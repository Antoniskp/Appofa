const REQUEST_TIMEOUT_MS = 15000;
const STATUS_TIMEOUT_MS = 3000;
const STATUS_TTL_MS = 30000;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const STAT_FIELDS = [
  'documents', 'laws', 'textDocuments', 'metadataDocuments', 'archivalDocuments',
  'units', 'articles', 'paragraphs', 'references', 'attachments', 'downloadedPdfs',
];

let statusCache;

function libraryOrigin() {
  try {
    const url = new URL(process.env.LAW_LIBRARY_BASE_URL?.trim());
    if (url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname) &&
      !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash) {
      return url.origin;
    }
  } catch {
    // The footer reports the library as offline until it has a valid origin.
  }
  return null;
}

async function requestLibrary(path, { origin = libraryOrigin(), search = '', timeout = REQUEST_TIMEOUT_MS } = {}) {
  if (!origin) throw new Error('Legal library origin is unavailable');
  const url = new URL(path, origin);
  url.search = search;
  return fetch(url, { redirect: 'error', signal: AbortSignal.timeout(timeout) });
}

async function probeLibrary(origin) {
  try {
    const response = await requestLibrary('/api/laws/status', { origin, timeout: STATUS_TIMEOUT_MS });
    if (!response.ok) {
      await response.body?.cancel();
      return null;
    }
    const status = await response.json();
    if (status.storageEngine !== 'Neo4j' || !Number.isFinite(status.stats?.documents)) return null;

    const stats = Object.fromEntries(STAT_FIELDS.map(field => [field, Number(status.stats[field]) || 0]));
    stats.lastUpdated = typeof status.stats.lastUpdated === 'string' ? status.stats.lastUpdated : null;
    return { stats, worker: { enabled: false }, importing: false };
  } catch {
    return null;
  }
}

function libraryStatus({ fresh = false } = {}) {
  const origin = libraryOrigin();
  if (!origin) return Promise.resolve(null);

  if (statusCache?.origin === origin && (statusCache.pending || (!fresh && Date.now() < statusCache.expiresAt))) {
    return statusCache.result;
  }

  const entry = { origin, pending: true, expiresAt: 0 };
  entry.result = probeLibrary(origin).finally(() => {
    entry.pending = false;
    entry.expiresAt = Date.now() + STATUS_TTL_MS;
  });
  statusCache = entry;
  return entry.result;
}

module.exports = { libraryStatus, requestLibrary };
