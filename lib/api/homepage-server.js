import { homepageAPI } from './homepage';

// Public editorial content only. Never forward cookies or render a server IP's ballot state.
export async function getPublicHomepage() {
  try {
    const response = await homepageAPI.get(undefined, ['latestArticles', 'latestNews', 'videos', 'prefectures'], {
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    return response?.success ? { data: response.data, errors: response.errors || {} } : null;
  } catch {
    // The client can recover without making the entire page unavailable.
    return null;
  }
}
