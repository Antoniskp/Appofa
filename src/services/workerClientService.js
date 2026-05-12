class WorkerServiceError extends Error {
  constructor(message, { status = 500, details = null } = {}) {
    super(message);
    this.name = 'WorkerServiceError';
    this.status = status;
    this.details = details;
  }
}

const DEFAULT_TIMEOUT_MS = 10000;

const getWorkerBaseUrl = () => {
  const value = (process.env.WORKER_BASE_URL || '').trim();
  if (!value) {
    throw new WorkerServiceError('Worker integration is not configured (missing WORKER_BASE_URL).', { status: 503 });
  }
  return value.replace(/\/+$/, '');
};

const getWorkerToken = () => {
  const value = (process.env.WORKER_TOKEN || '').trim();
  if (!value) {
    throw new WorkerServiceError('Worker integration is not configured (missing WORKER_TOKEN).', { status: 503 });
  }
  return value;
};

const parseResponseBody = async (response) => {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const callWorker = async (path, { method = 'GET', body, withToken = false } = {}) => {
  const baseUrl = getWorkerBaseUrl();
  const startedAt = Date.now();
  const headers = {
    Accept: 'application/json'
  };

  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  if (withToken) {
    headers['x-worker-token'] = getWorkerToken();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    const timeoutError = error?.name === 'AbortError';
    throw new WorkerServiceError(
      timeoutError ? 'Worker request timed out.' : 'Unable to reach worker service.',
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }

  const latencyMs = Date.now() - startedAt;
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    const upstreamMessage = typeof responseBody === 'object' && responseBody && typeof responseBody.message === 'string'
      ? responseBody.message
      : null;
    throw new WorkerServiceError(
      upstreamMessage
        ? `Worker request failed (${response.status}): ${upstreamMessage}`
        : `Worker request failed (${response.status}).`,
      {
        status: 502,
        details: { workerStatus: response.status, latencyMs }
      }
    );
  }

  return {
    status: response.status,
    latencyMs,
    data: responseBody
  };
};

const checkHealth = async () => {
  return callWorker('/health');
};

const createSnapshot = async (snapshotPayload) => {
  return callWorker('/internal/snapshots', {
    method: 'POST',
    body: snapshotPayload,
    withToken: true
  });
};

module.exports = {
  WorkerServiceError,
  checkHealth,
  createSnapshot
};
