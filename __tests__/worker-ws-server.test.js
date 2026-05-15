const http = require('http');
const express = require('express');
const WebSocket = require('ws');

jest.mock('../src/services/workerTokenService', () => ({
  validateWorkerToken: jest.fn(),
  isValidWorkerTokenFormat: jest.fn(),
}));

const { validateWorkerToken, isValidWorkerTokenFormat } = require('../src/services/workerTokenService');
const {
  createWorkerWsServer,
  getConnectedWorkers,
  getFirstConnectedWorkerId,
  sendRequest,
} = require('../src/websocket/workerWsServer');

const waitForEvent = (emitter, eventName) => new Promise((resolve) => {
  emitter.once(eventName, (...args) => {
    if (args.length <= 1) {
      resolve(args[0]);
      return;
    }
    resolve(args);
  });
});

describe('worker websocket server', () => {
  let server;
  let wsServer;
  let port;
  let clients;

  beforeEach(async () => {
    jest.clearAllMocks();
    clients = [];

    const app = express();
    app.get('/api/health', (_req, res) => res.json({ ok: true }));

    server = http.createServer(app);
    wsServer = createWorkerWsServer(server);

    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await Promise.all(clients.map((client) => new Promise((resolve) => {
      if (client.readyState === WebSocket.CLOSED) {
        resolve();
        return;
      }
      client.once('close', resolve);
      client.terminate();
    })));
    await new Promise((resolve) => wsServer.close(resolve));
    await new Promise((resolve) => server.close(resolve));
  });

  test('rejects unauthorized connections with close code 4001', async () => {
    isValidWorkerTokenFormat.mockReturnValue(false);

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/workers?token=invalid`);
    clients.push(ws);
    const closeEvent = await waitForEvent(ws, 'close');

    expect(closeEvent[0]).toBe(4001);
    expect(closeEvent[1].toString()).toBe('Unauthorized');
  });

  test('tracks register and heartbeat for authorized worker', async () => {
    isValidWorkerTokenFormat.mockReturnValue(true);
    validateWorkerToken.mockResolvedValue({ valid: true, source: 'database', tokenId: 5 });

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/workers?token=appofa_wt_worker_token_1234567890`);
    clients.push(ws);
    await waitForEvent(ws, 'open');

    ws.send(JSON.stringify({
      type: 'register',
      workerId: 'worker-1',
      name: 'My Worker',
      capabilities: ['linkPreview'],
      maxConcurrentTasks: 3,
    }));

    ws.send(JSON.stringify({
      type: 'heartbeat',
      workerId: 'worker-1',
    }));

    const [messageData] = await waitForEvent(ws, 'message');
    const ack = JSON.parse(messageData.toString());
    expect(ack.type).toBe('heartbeat_ack');

    const workers = getConnectedWorkers();
    expect(workers).toHaveLength(1);
    expect(workers[0].workerId).toBe('worker-1');
    expect(workers[0].name).toBe('My Worker');
    expect(workers[0].capabilities).toEqual(['linkPreview']);
    expect(workers[0].maxConcurrentTasks).toBe(3);
    expect(workers[0].connectedAt).toBeTruthy();
    expect(workers[0].lastHeartbeat).toBeTruthy();
    expect(getFirstConnectedWorkerId()).toBe('worker-1');

    ws.close();
    await waitForEvent(ws, 'close');

    expect(getConnectedWorkers()).toEqual([]);
  });

  test('buffers register sent immediately on open while token auth is still pending', async () => {
    isValidWorkerTokenFormat.mockReturnValue(true);
    validateWorkerToken.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve({ valid: true, source: 'database', tokenId: 11 }), 30);
    }));

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/workers?token=appofa_wt_worker_token_1234567890`);
    clients.push(ws);
    await waitForEvent(ws, 'open');

    ws.send(JSON.stringify({
      type: 'register',
      workerId: 'worker-buffered-register',
      name: 'Buffered Register Worker',
    }));

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(getConnectedWorkers().some((worker) => worker.workerId === 'worker-buffered-register')).toBe(true);
    expect(getFirstConnectedWorkerId()).toBe('worker-buffered-register');

    ws.close();
    await waitForEvent(ws, 'close');
  });

  test('accepts token via x-worker-token header when query token is absent', async () => {
    isValidWorkerTokenFormat.mockReturnValue(true);
    validateWorkerToken.mockResolvedValue({ valid: true, source: 'database', tokenId: 8 });

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/workers`, {
      headers: {
        'x-worker-token': 'appofa_wt_worker_token_header_1234567890',
      },
    });
    clients.push(ws);

    await waitForEvent(ws, 'open');

    ws.send(JSON.stringify({
      type: 'register',
      workerId: 'worker-header',
      name: 'Header Worker',
      capabilities: ['pollStats'],
      maxConcurrentTasks: 2,
    }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(getConnectedWorkers().some((worker) => worker.workerId === 'worker-header')).toBe(true);

    ws.close();
    await waitForEvent(ws, 'close');
  });

  test('sendRequest resolves matching worker response by requestId', async () => {
    isValidWorkerTokenFormat.mockReturnValue(true);
    validateWorkerToken.mockResolvedValue({ valid: true, source: 'database', tokenId: 9 });

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/workers?token=appofa_wt_worker_token_1234567890`);
    clients.push(ws);
    await waitForEvent(ws, 'open');

    ws.send(JSON.stringify({
      type: 'register',
      workerId: 'worker-send-request',
      name: 'Worker Send Request',
    }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    const requestPromise = sendRequest('worker-send-request', { type: 'health_request' });
    const [messageData] = await waitForEvent(ws, 'message');
    const requestMessage = JSON.parse(messageData.toString());
    expect(requestMessage.type).toBe('health_request');
    expect(typeof requestMessage.requestId).toBe('string');

    ws.send(JSON.stringify({
      type: 'health_response',
      requestId: requestMessage.requestId,
      status: 200,
      data: { ok: true },
    }));

    const response = await requestPromise;
    expect(response.type).toBe('health_response');
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ ok: true });

    ws.close();
    await waitForEvent(ws, 'close');
  });

  test('sendRequest rejects when worker is not connected', async () => {
    await expect(sendRequest('missing-worker', { type: 'health_request' }))
      .rejects
      .toThrow('Worker not connected');
  });

  test('sendRequest rejects on timeout without response', async () => {
    isValidWorkerTokenFormat.mockReturnValue(true);
    validateWorkerToken.mockResolvedValue({ valid: true, source: 'database', tokenId: 10 });

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/workers?token=appofa_wt_worker_token_1234567890`);
    clients.push(ws);
    await waitForEvent(ws, 'open');

    ws.send(JSON.stringify({
      type: 'register',
      workerId: 'worker-timeout',
      name: 'Worker Timeout',
    }));

    await new Promise((resolve) => setTimeout(resolve, 10));

    await expect(sendRequest('worker-timeout', { type: 'snapshot_request' }, 20))
      .rejects
      .toThrow(/Worker request timed out/);

    ws.close();
    await waitForEvent(ws, 'close');
  });
});
