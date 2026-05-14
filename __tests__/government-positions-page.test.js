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

  test('returns graceful fallback when backend returns non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    const { getCurrentGovernmentPositions } = require('../app/(statics)/citizen-help/government-positions/page');
    const result = await getCurrentGovernmentPositions('GR');

    expect(result).toEqual({ positions: [], error: true });
  });

  test('returns graceful fallback when backend returns unexpected shape', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    });

    const { getCurrentGovernmentPositions } = require('../app/(statics)/citizen-help/government-positions/page');
    const result = await getCurrentGovernmentPositions('GR');

    expect(result).toEqual({ positions: [], error: true });
  });
});

describe('citizen-help government positions UI helpers', () => {
  // The page module exports its data fetcher; we also test the icon/type config
  // lookups indirectly through the rendered card helpers.

  test('governmentPositionTypes.json has required fields for all expected types', () => {
    const types = require('../config/governmentPositionTypes.json');
    const requiredKeys = ['head_of_state', 'prime_minister', 'parliament_speaker', 'minister'];
    for (const key of requiredKeys) {
      const entry = types.find((t) => t.key === key);
      expect(entry).toBeDefined();
      expect(entry.icon).toBeTruthy();
      expect(entry.labelGr).toBeTruthy();
      expect(entry.color).toBeTruthy();
    }
  });

  test('governmentPositions.json has icons for all GR leadership positions', () => {
    const config = require('../config/governmentPositions.json');
    const leadershipSlugs = ['proedros-dimokratias', 'proedros-voulis', 'prothypoyrgos'];
    for (const slug of leadershipSlugs) {
      const pos = config.positions.find((p) => p.slug === slug);
      expect(pos).toBeDefined();
      expect(pos.icon).toBeTruthy();
      expect(pos.positionTypeKey).toBeTruthy();
    }
  });

  test('governmentPositions.json minister entries have ministerCategory', () => {
    const config = require('../config/governmentPositions.json');
    const ministers = config.positions.filter((p) => p.positionTypeKey === 'minister');
    expect(ministers.length).toBeGreaterThan(0);
    for (const m of ministers) {
      expect(m.ministerCategory).toBeTruthy();
    }
  });
});
