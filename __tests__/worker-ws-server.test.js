const http = require('http');
const express = require('express');
const WebSocket = require('ws');

jest.mock('../src/services/workerTokenService', () => ({
  validateWorkerToken: jest.fn(),
  isValidWorkerTokenFormat: jest.fn(),
}));

const { validateWorkerToken, isValidWorkerTokenFormat } = require('../src/services/workerTokenService');
const { createWorkerWsServer, getConnectedWorkers } = require('../src/websocket/workerWsServer');

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

    ws.close();
    await waitForEvent(ws, 'close');

    expect(getConnectedWorkers()).toEqual([]);
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
});
