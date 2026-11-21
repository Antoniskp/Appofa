const express = require('express');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const optionalAuth = require('../middleware/optionalAuth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { libraryStatus, requestLibrary } = require('../services/legalLibraryService');

const router = express.Router();
const READER_ASSETS = new Map([
  ['/app.js', 'text/javascript'],
  ['/citationText.js', 'text/javascript'],
  ['/topicGuides.js', 'text/javascript'],
  ['/style.css', 'text/css'],
  ['/favicon.svg', 'image/svg+xml'],
  ['/logos/parliament.gif', 'image/gif'],
  ['/logos/national-printing.png', 'image/png'],
  ['/logos/diavgeia.png', 'image/png'],
  ['/logos/eurlex.svg', 'image/svg+xml'],
  ['/logos/european-union.svg', 'image/svg+xml'],
]);
const READER_ENDPOINTS = new Set(['/guides', '/gazettes', '/documents', '/document', '/connections']);
const READER_CSP = "default-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'";
// Keep the elements the Appofasistis script expects while hiding local controls.
const READER_CSS = `
  [data-view="jobs"], [data-view="settings"], #jobs-view, #settings-view,
  #open-import, [data-open-import], [data-add-text], [data-download],
  [data-tab="notes"], .local-badge, .sidebar-bottom { display: none !important; }
`;

const offline = res => res.status(503).json({ error: 'Η Νομική Βιβλιοθήκη δεν είναι διαθέσιμη αυτή τη στιγμή.' });
const missing = res => res.status(404).json({ error: 'Δεν βρέθηκε το περιεχόμενο.' });
const isReaderPage = req => /^\/view\/?$/.test(req.path);

router.use((req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});

router.get('/availability', apiLimiter, async (req, res) => {
  res.json({ online: Boolean(await libraryStatus()) });
});

router.use(apiLimiter, optionalAuth, (req, res, next) => {
  if (!req.user) {
    if (isReaderPage(req) && req.method === 'GET') return res.redirect('/login?next=%2Flaws');
    return res.status(401).json({ error: 'Απαιτείται σύνδεση.' });
  }
  if (req.user.emailVerified !== true) {
    if (isReaderPage(req) && req.method === 'GET') return res.redirect('/profile#email-verification');
    return res.status(403).json({ error: 'Απαιτείται επιβεβαιωμένο email.' });
  }
  next();
});

router.get('/view', async (req, res) => {
  if (!(await libraryStatus({ fresh: true }))) return offline(res);
  return serveReader(req, res, '/laws', 'text/html');
});

router.get('/view/*asset', (req, res) => {
  const asset = req.path.slice('/view'.length);
  const mediaType = READER_ASSETS.get(asset);
  if (!mediaType) return missing(res);
  return serveReader(req, res, '/laws' + asset, mediaType);
});

router.get('/status', async (req, res) => {
  const status = await libraryStatus();
  return status ? res.json(status) : offline(res);
});

// The reader loads its jobs panel during initialization.
router.get('/jobs', (req, res) => res.json({ jobs: [] }));

router.get(/^\/files\/[a-f0-9]{64}$/, (req, res) =>
  serveReader(req, res, '/api/laws' + req.path, 'application/pdf'));

router.get('/:resource', (req, res) => {
  if (!READER_ENDPOINTS.has(req.path)) return missing(res);
  return serveReader(req, res, '/api/laws' + req.path, 'application/json');
});

async function serveReader(req, res, path, mediaType) {
  try {
    const queryIndex = req.url.indexOf('?');
    const search = mediaType === 'application/json' && queryIndex !== -1 ? req.url.slice(queryIndex) : '';
    const response = await requestLibrary(path, { search });
    if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== mediaType) {
      await response.body?.cancel();
      if (response.status === 404) return missing(res);
      if (response.status === 400) return res.status(400).json({ error: 'Μη έγκυρο αίτημα.' });
      return offline(res);
    }

    res.type(mediaType);
    if (mediaType === 'text/html') res.set('Content-Security-Policy', READER_CSP);
    if (mediaType === 'application/pdf') {
      res.set('Content-Security-Policy', "sandbox; default-src 'none'");
      res.set('Content-Disposition', 'inline');
    }
    if (req.method === 'HEAD') {
      await response.body?.cancel();
      return res.end();
    }
    if (mediaType === 'text/css') return res.send(await response.text() + READER_CSS);
    if (path === '/laws/app.js') {
      // Remove the notes tab from the reader's keyboard navigation as well.
      return res.send((await response.text()).replace(/, \['notes', '[^'\r\n]*'\](?=\];)/, ''));
    }
    if (path === '/api/laws/document') {
      const { document, sourceText, units, references, incoming, attachments } = await response.json();
      return res.json({
        document, sourceText, units, references, incoming,
        attachments: attachments.map(attachment => ({ ...attachment, local_file: Boolean(attachment.local_file) })),
        annotation: { summary: '', notes: '', tags: [], revision: 0 },
        revisions: [],
      });
    }
    await pipeline(Readable.fromWeb(response.body), res);
  } catch {
    if (!res.headersSent && !res.destroyed) return offline(res);
  }
}

module.exports = router;
