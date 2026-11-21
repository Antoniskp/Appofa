const { getLegalLibraryWorker, hasConnectedLegalLibraryWorker } = require('../websocket/workerWsServer');
const { requestLegalLibrary } = require('../websocket/legalLibraryRelay');

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
    // The worker connection is the default when a local origin is unavailable.
  }
  return null;
}

async function requestLibrary(path, { origin = libraryOrigin(), search = '', timeout = REQUEST_TIMEOUT_MS } = {}) {
  const url = new URL(path, origin || 'http://localhost');
  url.search = search;
  if (path === '/api/laws/documents') {
    if (!(await libraryStatus())) throw new Error('Legal library search is unavailable');
    url.searchParams.set('scope', 'source');
  }
  if (!origin) {
    const worker = await getLegalLibraryWorker();
    if (!worker) throw new Error('Legal library worker is unavailable');
    return requestLegalLibrary(worker, { path: url.pathname, search: url.search }, timeout);
  }
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
    if (status.sourceSearch !== true && process.env.LAW_LIBRARY_LEGACY_SHARED_COLLECTION !== 'true') return null;

    const stats = Object.fromEntries(STAT_FIELDS.map(field => [field, Number(status.stats[field]) || 0]));
    stats.lastUpdated = typeof status.stats.lastUpdated === 'string' ? status.stats.lastUpdated : null;
    return { stats, worker: { enabled: false }, importing: false };
  } catch {
    return null;
  }
}

function libraryStatus({ fresh = false } = {}) {
  const origin = libraryOrigin();
  if (!origin && !hasConnectedLegalLibraryWorker()) {
    clearLibraryStatus();
    return Promise.resolve(null);
  }

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

function clearLibraryStatus() {
  statusCache = null;
}

module.exports = { libraryStatus, requestLibrary, clearLibraryStatus };
