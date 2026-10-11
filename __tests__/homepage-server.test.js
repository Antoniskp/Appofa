jest.mock('../lib/api/homepage', () => ({ homepageAPI: { get: jest.fn() } }));
const { homepageAPI } = require('../lib/api/homepage');
const { getPublicHomepage } = require('../lib/api/homepage-server');

afterEach(() => jest.resetAllMocks());

test('server rendering requests only public editorial sections, with a timeout and no caching', async () => {
  homepageAPI.get.mockResolvedValue({ success: true, data: { latestNews: [{ id: 1 }] } });
  expect(await getPublicHomepage()).toEqual({ data: { latestNews: [{ id: 1 }] }, errors: {} });
  expect(homepageAPI.get).toHaveBeenCalledWith(undefined, ['latestArticles', 'latestNews', 'videos', 'prefectures'], expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }));
  expect(homepageAPI.get.mock.calls[0][2].headers).toBeUndefined();
});

test('an unavailable backend leaves the client able to recover', async () => {
  homepageAPI.get.mockRejectedValue(new Error('Timeout'));
  expect(await getPublicHomepage()).toBeNull();
});
