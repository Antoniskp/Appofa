const express = require('express');
const path = require('node:path');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const boundariesPath = path.join(__dirname, '..', '..', 'config', 'map-data', 'electoral-districts.geojson');

router.get('/candidates', apiLimiter, require('../controllers/politicalMapController').candidates);

// Production proxies /api/* directly to Express, so this public map data must
// be available here as well as through Next's development API proxy.
router.get('/', apiLimiter, (req, res) => {
  res.type('application/geo+json').sendFile(boundariesPath, { maxAge: '1h' });
});

module.exports = router;
