/**
 * Tests to verify poll system bug fixes
 */

// Mock fetch globally
global.fetch = jest.fn();

describe('Poll API Return Statements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete global.window;
    delete global.document;
  });

  test('pollAPI.create returns promise with data', async () => {
    const mockResponse = { success: true, data: { poll: { id: 1, title: 'Test' } } };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const { pollAPI } = require('../lib/api');
    const result = await pollAPI.create({ title: 'Test Poll', options: [] });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('pollAPI.update returns promise with data', async () => {
    const mockResponse = { success: true, data: { poll: { id: 1 } } };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const { pollAPI } = require('../lib/api');
    const result = await pollAPI.update(1, { title: 'Updated' });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('pollAPI.delete returns promise with data', async () => {
    const mockResponse = { success: true, message: 'Deleted' };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const { pollAPI } = require('../lib/api');
    const result = await pollAPI.delete(1);
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('pollAPI.vote returns promise with data', async () => {
    const mockResponse = { success: true, data: { voteCounts: {} } };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const { pollAPI } = require('../lib/api');
    const result = await pollAPI.vote(1, { optionId: 1 });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('pollAPI.addOption returns promise with data', async () => {
    const mockResponse = { success: true, data: { option: { id: 1 } } };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    const { pollAPI } = require('../lib/api');
    const result = await pollAPI.addOption(1, { optionText: 'New Option' });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
