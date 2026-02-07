/**
 * Test that pollAPI methods return Promises correctly
 * This ensures arrow functions with curly braces have explicit return statements
 */

// Mock fetch to avoid actual HTTP calls
global.fetch = jest.fn();

// Mock document for CSRF token testing
global.document = {
  cookie: 'csrf_token=test-csrf-token'
};

const { pollAPI } = require('../lib/api');

describe('pollAPI methods return values', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} })
    });
  });

  test('create() returns a Promise', async () => {
    const pollData = {
      title: 'Test Poll',
      options: [{ optionText: 'Option 1' }, { optionText: 'Option 2' }]
    };
    
    const result = pollAPI.create(pollData);
    
    // Should return a Promise, not undefined
    expect(result).toBeInstanceOf(Promise);
    
    const response = await result;
    expect(response.success).toBe(true);
  });

  test('update() returns a Promise', async () => {
    const result = pollAPI.update(1, { title: 'Updated' });
    
    expect(result).toBeInstanceOf(Promise);
    
    const response = await result;
    expect(response.success).toBe(true);
  });

  test('delete() returns a Promise', async () => {
    const result = pollAPI.delete(1);
    
    expect(result).toBeInstanceOf(Promise);
    
    const response = await result;
    expect(response.success).toBe(true);
  });

  test('vote() returns a Promise', async () => {
    const result = pollAPI.vote(1, { optionId: 1 });
    
    expect(result).toBeInstanceOf(Promise);
    
    const response = await result;
    expect(response.success).toBe(true);
  });

  test('addOption() returns a Promise', async () => {
    const result = pollAPI.addOption(1, { optionText: 'New Option' });
    
    expect(result).toBeInstanceOf(Promise);
    
    const response = await result;
    expect(response.success).toBe(true);
  });

  test('getById() returns a Promise', async () => {
    const result = pollAPI.getById(1);
    
    expect(result).toBeInstanceOf(Promise);
    
    const response = await result;
    expect(response.success).toBe(true);
  });

  test('getResults() returns a Promise', async () => {
    const result = pollAPI.getResults(1);
    
    expect(result).toBeInstanceOf(Promise);
    
    const response = await result;
    expect(response.success).toBe(true);
  });

  test('getAll() returns a Promise', async () => {
    const result = pollAPI.getAll();
    
    expect(result).toBeInstanceOf(Promise);
    
    const response = await result;
    expect(response.success).toBe(true);
  });
});
