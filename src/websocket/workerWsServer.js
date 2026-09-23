'use strict';

const crypto = require('crypto');
const { URL } = require('url');
const WebSocket = require('ws');
const { validateWorkerToken, isValidWorkerTokenFormat } = require('../services/workerTokenService');

const connectedWorkers = new Map();
const pendingRequests = new Map();
const pendingTasks = new Map();

const pruneDisconnectedWorkers = () => {
  for (const [workerId, worker] of connectedWorkers.entries()) {
    if (!worker.ws || worker.ws.readyState !== WebSocket.OPEN) {
      connectedWorkers.delete(workerId);
    }
  }
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
  if (dbResult.valid) return true;
  const envToken = (process.env.WORKER_TOKEN || '').trim();
  return Boolean(envToken && token === envToken);
};

const getConnectedWorkers = () => {
  pruneDisconnectedWorkers();
  return Array.from(connectedWorkers.values()).map((worker) => ({
    workerId: worker.workerId,
    name: worker.name,
    capabilities: worker.capabilities,
    maxConcurrentTasks: worker.maxConcurrentTasks,
    connectedAt: worker.connectedAt,
    lastHeartbeat: worker.lastHeartbeat || null,
  }));
};

const getFirstConnectedWorkerId = (requiredCapability = null) => {
  pruneDisconnectedWorkers();
  for (const [workerId, worker] of connectedWorkers.entries()) {
    if (
      !requiredCapability ||
      (Array.isArray(worker.capabilities) && worker.capabilities.includes(requiredCapability))
    ) {
      return workerId;
    }
  }
  return null;
};

const sendRequest = (workerId, message, timeoutMs = 10000) => {
  return new Promise((resolve, reject) => {
    const worker = connectedWorkers.get(workerId);
    if (!worker || !worker.ws || worker.ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('Worker not connected'));
    }
    const requestId = crypto.randomUUID();
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('Worker request timed out'));
    }, timeoutMs);
    pendingRequests.set(requestId, { resolve, reject, timeout });
    worker.ws.send(JSON.stringify({ ...message, requestId }));
  });
};

const sendTaskToWorker = (workerId, taskType, payload = {}, timeoutMs = 30000) => {
  return new Promise((resolve, reject) => {
    const worker = connectedWorkers.get(workerId);
    if (!worker || !worker.ws || worker.ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('Worker not connected'));
    }

    if (!taskType || typeof taskType !== 'string') {
      return reject(new Error('Worker task type is required'));
    }

    const taskId = crypto.randomUUID();
    const timeout = setTimeout(() => {
      pendingTasks.delete(taskId);
      reject(new Error('Worker task timed out'));
    }, timeoutMs);

    pendingTasks.set(taskId, { resolve, reject, timeout });
    worker.ws.send(JSON.stringify({
      type: 'task',
      taskId,
      taskType,
      payload,
    }));
  });
};

const handleWorkerMessage = (ws, parsedMessage) => {
  const { type } = parsedMessage;

  if (type === 'register') {
    const workerId = parsedMessage.workerId || ws.workerHeaderId;
    if (!workerId) {
      console.warn('Worker register message missing workerId.');
      return;
    }
    ws.workerId = workerId;
    connectedWorkers.set(workerId, {
      ws,
      workerId,
      name: parsedMessage.name || null,
      capabilities: Array.isArray(parsedMessage.capabilities) ? parsedMessage.capabilities : [],
      maxConcurrentTasks: Number.isInteger(parsedMessage.maxConcurrentTasks) ? parsedMessage.maxConcurrentTasks : null,
      connectedAt: new Date().toISOString(),
      lastHeartbeat: null,
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
      connectedWorkers.set(workerId, { ...existing, lastHeartbeat: new Date().toISOString() });
    }
    ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
    return;
  }

  if (type === 'health_response' || type === 'snapshot_response') {
    const { requestId } = parsedMessage;
    const pending = requestId && pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingRequests.delete(requestId);
      pending.resolve(parsedMessage);
    }
    return;
  }

  if (type === 'taskResult') {
    const { taskId } = parsedMessage;
    const pending = taskId && pendingTasks.get(taskId);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingTasks.delete(taskId);
      pending.resolve(parsedMessage);
      return;
    }

    console.log('Worker task result received:', {
      workerId: parsedMessage.workerId || ws.workerId || ws.workerHeaderId || null,
      taskId: parsedMessage.taskId || null,
      result: parsedMessage,
    });
    return;
  }

  console.warn('Unknown worker message type:', type);
};

const createWorkerWsServer = (httpServer) => {
  const workerWsServer = new WebSocket.Server({
    server: httpServer,
    path: '/ws/workers',
    maxPayload: 1024 * 1024,
  });
  let pendingAuthentications = 0;

  workerWsServer.on('connection', async (ws, req) => {
    // Install before any await: malformed frames can arrive during authentication.
    ws.on('error', () => ws.terminate());
    if (pendingAuthentications >= 32 || workerWsServer.clients.size > 64) {
      ws.terminate();
      return;
    }
    pendingAuthentications += 1;
    const authTimeout = setTimeout(() => ws.terminate(), 5000);
    ws.once('close', () => clearTimeout(authTimeout));
    try {
      ws.on('close', () => {
        if (ws.workerId) {
          connectedWorkers.delete(ws.workerId);
          console.log(`Worker disconnected: ${ws.workerId}`);
          return;
        }
        console.log('Worker WebSocket disconnected before registration.');
      });

      // Buffer messages immediately before any await, so register is not lost
      const messageBuffer = [];
      let bufferedBytes = 0;
      const bufferMessage = (raw) => {
        bufferedBytes += raw.length;
        if (messageBuffer.length >= 8 || bufferedBytes > 64 * 1024) {
          messageBuffer.length = 0;
          ws.terminate();
          return;
        }
        messageBuffer.push(raw);
      };
      ws.on('message', bufferMessage);

      const token = getTokenFromRequest(req);
      const isAuthorized = await isAuthorizedToken(token);
      clearTimeout(authTimeout);
      if (ws.readyState !== WebSocket.OPEN) return;

      if (!isAuthorized) {
        ws.off('message', bufferMessage);
        ws.close(4001, 'Unauthorized');
        return;
      }

      const workerHeaderId = req.headers['x-worker-id'];
      const headerWorkerId = Array.isArray(workerHeaderId) ? workerHeaderId[0] : workerHeaderId;
      if (headerWorkerId) {
        ws.workerHeaderId = headerWorkerId;
      }

      console.log('Worker WebSocket connected.');

      // Switch from buffer to real handler
      ws.off('message', bufferMessage);
      ws.on('message', (rawMessage) => {
        try {
          const parsedMessage = JSON.parse(rawMessage.toString());
          handleWorkerMessage(ws, parsedMessage);
        } catch (error) {
          console.warn('Failed to parse worker message:', error.message);
        }
      });

      // Replay buffered messages (e.g. register sent on open)
      for (const raw of messageBuffer) {
        try {
          const parsedMessage = JSON.parse(raw.toString());
          handleWorkerMessage(ws, parsedMessage);
        } catch (error) {
          console.warn('Failed to parse buffered worker message:', error.message);
        }
      }

      ws.on('error', (error) => {
        console.error('Worker WebSocket error:', error.message);
      });
    } catch (error) {
      clearTimeout(authTimeout);
      console.error('Worker WebSocket connection error:', error.message);
      ws.close(4001, 'Unauthorized');
    } finally {
      pendingAuthentications -= 1;
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
  sendTaskToWorker,
};
