'use strict';

const { URL } = require('url');
const WebSocket = require('ws');
const { validateWorkerToken, isValidWorkerTokenFormat } = require('../services/workerTokenService');

const connectedWorkers = new Map();

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
};
