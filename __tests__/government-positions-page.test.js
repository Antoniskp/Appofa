describe('citizen-help government positions data source', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('fetches official GR current holders from backend source-of-truth endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [{ id: 1, title: 'Πρωθυπουργός', currentHolders: [] }],
      }),
    });

    const { getCurrentGovernmentPositions } = require('../app/(statics)/citizen-help/government-positions/page');
    const result = await getCurrentGovernmentPositions('gr');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/dream-team/current-holders?countryCode=GR'),
      expect.objectContaining({ next: { revalidate: 300 } }),
    );
    expect(result).toEqual({
      positions: [{ id: 1, title: 'Πρωθυπουργός', currentHolders: [] }],
      error: false,
    });
  });

  test('returns graceful fallback when backend source is unavailable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));

    const { getCurrentGovernmentPositions } = require('../app/(statics)/citizen-help/government-positions/page');
    const result = await getCurrentGovernmentPositions('GR');

    expect(result).toEqual({ positions: [], error: true });
  });
});
