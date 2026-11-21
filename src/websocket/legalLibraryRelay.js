const { randomUUID } = require('node:crypto');
const WebSocket = require('ws');

const LEGAL_LIBRARY_CAPABILITY = 'lawLibraryRead';
const MAX_CHUNK_BYTES = 64 * 1024;
const MAX_ENCODED_CHUNK = Math.ceil(MAX_CHUNK_BYTES / 3) * 4;
const MAX_RESPONSE_BYTES = 48 * 1024 * 1024;
const MAX_PENDING_REQUESTS = 12;
const RESPONSE_TYPES = new Set(['law_library_start', 'law_library_chunk', 'law_library_end', 'law_library_error']);
const pendingRequests = new Map();

function removeRequest(request) {
  clearTimeout(request.timeout);
  pendingRequests.delete(request.id);
}

function cancelWorker(request) {
  if (request.ws.readyState === WebSocket.OPEN) {
    request.ws.send(JSON.stringify({ type: 'law_library_cancel', requestId: request.id }), () => {});
  }
}

function failRequest(request, message, cancel = false) {
  removeRequest(request);
  if (cancel) cancelWorker(request);
  const error = new Error(message);
  if (request.started) request.controller.error(error);
  else request.reject(error);
}

function requestLegalLibrary(ws, { path, search }, timeoutMs) {
  if (ws.readyState !== WebSocket.OPEN) throw new Error('Legal library worker disconnected');
  if (pendingRequests.size >= MAX_PENDING_REQUESTS) throw new Error('Legal library is busy');

  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const request = { id, ws, resolve, reject, bytes: 0, started: false };
    request.timeout = setTimeout(() => failRequest(request, 'Legal library request timed out', true), timeoutMs);
    pendingRequests.set(id, request);

    ws.send(JSON.stringify({ type: 'law_library_request', requestId: id, path, search }), error => {
      if (error && pendingRequests.has(id)) failRequest(request, 'Could not reach legal library worker');
    });
  });
}

function handleLegalLibraryResponse(ws, message) {
  if (!RESPONSE_TYPES.has(message.type)) return false;
  const request = pendingRequests.get(message.requestId);
  if (!request || request.ws !== ws) return true;

  if (message.type === 'law_library_error') {
    failRequest(request, 'Legal library worker could not complete request');
    return true;
  }
  if (message.type === 'law_library_start' && !request.started) {
    try {
      const { status, contentType } = message;
      if (!Number.isInteger(status) || status < 200 || status > 599 || typeof contentType !== 'string' || contentType.length > 120) {
        throw new Error('Invalid reader response');
      }
      const body = new ReadableStream({
        start(controller) { request.controller = controller; },
        cancel() {
          removeRequest(request);
          cancelWorker(request);
        },
      });
      const response = new Response(body, { status, headers: { 'Content-Type': contentType } });
      request.started = true;
      request.resolve(response);
    } catch {
      failRequest(request, 'Invalid legal library response', true);
    }
    return true;
  }
  if (message.type === 'law_library_chunk' && request.started &&
      typeof message.data === 'string' && message.data.length <= MAX_ENCODED_CHUNK) {
    const chunk = Buffer.from(message.data, 'base64');
    request.bytes += chunk.length;
    if (chunk.length > 0 && chunk.length <= MAX_CHUNK_BYTES && request.bytes <= MAX_RESPONSE_BYTES) {
      request.controller.enqueue(chunk);
      return true;
    }
  }
  if (message.type === 'law_library_end' && request.started) {
    removeRequest(request);
    request.controller.close();
    return true;
  }

  failRequest(request, 'Invalid legal library response', true);
  return true;
}

function closeLegalLibraryRequests(ws) {
  for (const request of pendingRequests.values()) {
    if (request.ws === ws) failRequest(request, 'Legal library worker disconnected', true);
  }
}

module.exports = { LEGAL_LIBRARY_CAPABILITY, requestLegalLibrary, handleLegalLibraryResponse, closeLegalLibraryRequests };
