'use strict';

const crypto = require('crypto');
const { URL } = require('url');
const WebSocket = require('ws');
const { validateWorkerToken, isValidWorkerTokenFormat } = require('../services/workerTokenService');

const connectedWorkers = new Map();
const pendingRequests = new Map();

const buildRequestError = (message, status) => {
  const error = new Error(message);
  if (status) {
    error.status = status;
  }
  return error;
};

const getTokenFromRequest = (req) => {
  const requestUrl = new URL(req.url, 'http://localhost');
  const queryToken = requestUrl.searchParams.get('token');
  if (queryToken) return queryToken;

  const rawHeader = req.headers['x-worker-token'];
  return Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
};

const isAuthorizedToken = async (token) => {
  if (!token || typeof token !== 'string' || !isValidWorkerTokenFormat(token)) {
    return false;
  }

  const dbResult = await validateWorkerToken(token);
  if (dbResult.valid) {
    return true;
  }

  const envToken = (process.env.WORKER_TOKEN || '').trim();
  return Boolean(envToken && token === envToken);
};

const getConnectedWorkers = () => Array.from(connectedWorkers.values()).map((worker) => ({
  workerId: worker.workerId,
  name: worker.name,
  capabilities: worker.capabilities,
  maxConcurrentTasks: worker.maxConcurrentTasks,
  connectedAt: worker.connectedAt,
  lastHeartbeat: worker.lastHeartbeat || null,
}));

const getFirstConnectedWorkerId = () => {
  const first = connectedWorkers.keys().next();
  return first.done ? null : first.value;
};

const resolvePendingRequest = (requestId, responseMessage) => {
  const pending = pendingRequests.get(requestId);
  if (!pending) {
    return false;
  }

  clearTimeout(pending.timeout);
  pendingRequests.delete(requestId);
  pending.resolve(responseMessage);
  return true;
};

const rejectPendingRequestsForWorker = (workerId, reasonMessage) => {
  for (const [requestId, pending] of pendingRequests.entries()) {
    if (pending.workerId !== workerId) {
      continue;
    }

    clearTimeout(pending.timeout);
    pendingRequests.delete(requestId);
    pending.reject(buildRequestError(reasonMessage || 'Worker disconnected before responding.', 503));
  }
};

const sendRequest = (workerId, message, timeoutMs = 10000) => {
  const worker = connectedWorkers.get(workerId);
  if (!worker || !worker.ws || worker.ws.readyState !== WebSocket.OPEN) {
    return Promise.reject(buildRequestError(`Worker not connected: ${workerId}`, 503));
  }

  const requestId = crypto.randomUUID();
  const payload = {
    ...message,
    requestId,
  };

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(buildRequestError(`Worker request timed out: ${requestId}`, 504));
    }, timeoutMs);

    pendingRequests.set(requestId, {
      workerId,
      resolve,
      reject,
      timeout,
    });

    try {
      worker.ws.send(JSON.stringify(payload));
    } catch (error) {
      clearTimeout(timeout);
      pendingRequests.delete(requestId);
      reject(error);
    }
  });
};

const createWorkerWsServer = (httpServer) => {
  const workerWsServer = new WebSocket.Server({
    server: httpServer,
    path: '/ws/workers',
  });

  workerWsServer.on('connection', async (ws, req) => {
    try {
      const token = getTokenFromRequest(req);
      const isAuthorized = await isAuthorizedToken(token);
      if (!isAuthorized) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      const workerHeaderId = req.headers['x-worker-id'];
      const headerWorkerId = Array.isArray(workerHeaderId) ? workerHeaderId[0] : workerHeaderId;
      if (headerWorkerId) {
        ws.workerHeaderId = headerWorkerId;
      }

      console.log('Worker WebSocket connected.');

      ws.on('message', (rawMessage) => {
        try {
          const parsedMessage = JSON.parse(rawMessage.toString());
          const { type } = parsedMessage;

          if (type === 'health_response' || type === 'snapshot_response' || type === 'response') {
            if (!parsedMessage.requestId || typeof parsedMessage.requestId !== 'string') {
              console.warn('Worker response message missing requestId.');
              return;
            }

            const resolved = resolvePendingRequest(parsedMessage.requestId, parsedMessage);
            if (!resolved) {
              console.warn('Worker response received for unknown requestId:', parsedMessage.requestId);
            }
            return;
          }

          if (type === 'register') {
            const workerId = parsedMessage.workerId || ws.workerHeaderId;
            if (!workerId) {
              console.warn('Worker register message missing workerId.');
              return;
            }

            ws.workerId = workerId;
            connectedWorkers.set(workerId, {
              workerId,
              name: parsedMessage.name || null,
              capabilities: Array.isArray(parsedMessage.capabilities) ? parsedMessage.capabilities : [],
              maxConcurrentTasks: Number.isInteger(parsedMessage.maxConcurrentTasks)
                ? parsedMessage.maxConcurrentTasks
                : null,
              connectedAt: new Date().toISOString(),
              lastHeartbeat: null,
              ws,
            });
            console.log(`Worker registered: ${workerId}`);
            return;
          }

          if (type === 'heartbeat') {
            const workerId = parsedMessage.workerId || ws.workerId || ws.workerHeaderId;
            if (!workerId) {
              console.warn('Heartbeat received without workerId.');
              return;
            }

            const existing = connectedWorkers.get(workerId);
            if (existing) {
              connectedWorkers.set(workerId, {
                ...existing,
                lastHeartbeat: new Date().toISOString(),
                ws,
              });
            }

            ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
            return;
          }

          if (type === 'taskResult') {
            console.log('Worker task result received:', {
              workerId: parsedMessage.workerId || ws.workerId || ws.workerHeaderId || null,
              taskId: parsedMessage.taskId || null,
              result: parsedMessage,
            });
            return;
          }

          console.warn('Unknown worker message type:', type);
        } catch (error) {
          console.warn('Failed to parse worker message:', error.message);
        }
      });

      ws.on('close', () => {
        if (ws.workerId) {
          connectedWorkers.delete(ws.workerId);
          rejectPendingRequestsForWorker(ws.workerId, `Worker disconnected: ${ws.workerId}`);
          console.log(`Worker disconnected: ${ws.workerId}`);
          return;
        }

        console.log('Worker WebSocket disconnected before registration.');
      });

      ws.on('error', (error) => {
        console.error('Worker WebSocket error:', error.message);
      });
    } catch (error) {
      console.error('Worker WebSocket connection error:', error.message);
      ws.close(4001, 'Unauthorized');
    }
  });

  console.log('Worker WebSocket server listening on /ws/workers');
  return workerWsServer;
};

module.exports = {
  createWorkerWsServer,
  getConnectedWorkers,
  getFirstConnectedWorkerId,
  sendRequest,
};
