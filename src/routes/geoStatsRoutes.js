const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { fn, col, literal, Op, QueryTypes } = require('sequelize');
const { normalizeIp } = require('../utils/normalizeIp');
const {
  sequelize,
  GeoVisit,
  User,
  CountryFunding,
  Location,
} = require('../models');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { apiLimiter } = require('../middleware/rateLimiter');
const csrfProtection = require('../middleware/csrfProtection');

const router = express.Router();

const getCountryNameLocal = (code) => {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || null;
  } catch {
    return null;
  }
};

const getFirstForwardedIp = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;
  return String(value).split(',')[0].trim() || null;
};

const getValidTrackingIp = (...candidates) => {
  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (ip) return ip;
  }
  return null;
};

router.post('/track', apiLimiter, async (req, res, next) => {
  try {
    const { path: visitPath, countryCode, locale, token } = req.body;
    if (!visitPath || typeof visitPath !== 'string') {
      return res.status(400).json({ success: false, message: 'path is required.' });
    }

    const ipAddress = getValidTrackingIp(
      req.body.ipAddress,
      getFirstForwardedIp(req.headers['x-forwarded-for']),
      req.ip
    );

    let isAuthenticated = false;
    let userId = null;
    if (token && typeof token === 'string') {
      try {
        const payload = jwt.decode(token);
        if (payload && typeof payload === 'object') {
          const parsed = Number.parseInt(payload.id || payload.sub, 10);
          userId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
          isAuthenticated = true;
        }
      } catch {
        isAuthenticated = false;
        userId = null;
      }
    }

    const sanitizedCode = countryCode
      ? String(countryCode).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || null
      : null;
    const validCode = sanitizedCode && /^[A-Z]{2}$/.test(sanitizedCode) ? sanitizedCode : null;
    const sessionHash = ipAddress
      ? crypto.createHash('sha256').update(String(ipAddress)).digest('hex')
      : null;
    await GeoVisit.create({
      countryCode: validCode,
      countryName: getCountryNameLocal(validCode),
      isAuthenticated,
      isDiaspora: null,
      userId,
      sessionHash,
      ipAddress,
      path: String(visitPath).slice(0, 500),
      locale: locale ? String(locale).slice(0, 10) : null,
    });
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
});

const VALID_PERIODS = new Set(['7d', '30d', 'all']);
const VALID_STATUSES = new Set(['locked', 'funding', 'unlocked']);

const getDateFilterForPeriod = (period) => {
  if (period === 'all') return null;
  const days = period === '30d' ? 30 : 7;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  return { [Op.gte]: fromDate };
};

const toInt = (value) => Number.parseInt(value, 10) || 0;
const toNumber = (value) => Number.parseFloat(value || 0);

// Public: get country funding status for a location
router.get('/country-funding/:locationId/public', apiLimiter, async (req, res, next) => {
  try {
    const locationId = Number.parseInt(req.params.locationId, 10);
    if (Number.isNaN(locationId)) {
      return res.status(400).json({ success: false, message: 'Invalid locationId.' });
    }
    const record = await CountryFunding.findOne({
      where: { locationId },
      include: [{ model: Location, as: 'location', attributes: ['id', 'name', 'name_local', 'slug', 'code'] }],
    });
    return res.json({ success: true, data: record || null });
  } catch (err) {
    return next(err);
  }
});

router.get('/visits', apiLimiter, authMiddleware, checkRole('admin'), async (req, res, next) => {
  try {
    const period = VALID_PERIODS.has(req.query.period) ? req.query.period : '7d';
    const where = {};

    const dateFilter = getDateFilterForPeriod(period);
    if (dateFilter) {
      where.createdAt = dateFilter;
    }

    if (req.query.countryCode) {
      where.countryCode = String(req.query.countryCode).trim().toUpperCase();
    }

    const [totalVisits, byCountryRows, topPathRows, recentVisitRows] = await Promise.all([
      GeoVisit.count({ where }),
      GeoVisit.findAll({
        attributes: [
          'countryCode',
          'countryName',
          [fn('COUNT', col('id')), 'visits'],
          [fn('SUM', literal('CASE WHEN "isAuthenticated" THEN 1 ELSE 0 END')), 'authenticated'],
          [fn('SUM', literal('CASE WHEN "isDiaspora" THEN 1 ELSE 0 END')), 'diaspora'],
        ],
        where,
        group: ['countryCode', 'countryName'],
        order: [[literal('"visits"'), 'DESC']],
      }),
      GeoVisit.findAll({
        attributes: [
          'path',
          [fn('COUNT', col('id')), 'visits'],
        ],
        where: {
          ...where,
          path: {
            [Op.not]: null,
            [Op.ne]: '',
          },
        },
        group: ['path'],
        order: [[literal('"visits"'), 'DESC']],
        limit: 10,
      }),
      GeoVisit.findAll({
        attributes: ['ipAddress', 'path', 'countryCode', 'countryName', 'createdAt', 'isAuthenticated', 'userId'],
        include: [{ model: User, as: 'user', attributes: ['id', 'username'], required: false }],
        where,
        order: [['createdAt', 'DESC']],
        limit: 100,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        period,
        totalVisits,
        byCountry: byCountryRows.map((row) => ({
          countryCode: row.countryCode,
          countryName: row.countryName,
          visits: toInt(row.get('visits')),
          authenticated: toInt(row.get('authenticated')),
          diaspora: toInt(row.get('diaspora')),
        })),
        topPaths: topPathRows.map((row) => ({
          path: row.path,
          visits: toInt(row.get('visits')),
        })),
        recentVisits: recentVisitRows.map((row) => ({
          ipAddress: row.ipAddress || null,
          path: row.path || null,
          countryCode: row.countryCode || null,
          countryName: row.countryName || null,
          isAuthenticated: Boolean(row.isAuthenticated),
          userId: row.userId || null,
          username: row.user?.username || null,
          createdAt: row.createdAt,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.delete('/visits', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, async (req, res, next) => {
  try {
    const days = Number(req.query.olderThanDays);
    if (!Number.isInteger(days) || days < 0) {
      return res.status(400).json({ success: false, message: 'olderThanDays must be a non-negative integer.' });
    }

    let deletedCount;
    if (days === 0) {
      deletedCount = await GeoVisit.destroy({ where: {}, truncate: false });
    } else {
      const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
      deletedCount = await GeoVisit.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoff,
          },
        },
      });
    }

    const message = days === 0
      ? `Deleted all ${deletedCount} visit records.`
      : `Deleted ${deletedCount} visit records older than ${days} days.`;

    return res.json({ success: true, message });
  } catch (err) {
    return next(err);
  }
});

router.get('/countries', apiLimiter, authMiddleware, checkRole('admin'), async (req, res, next) => {
  try {
    const visitRows = await GeoVisit.findAll({
      attributes: [
        'countryCode',
        'countryName',
        [fn('COUNT', col('id')), 'totalVisits'],
      ],
      where: {
        countryCode: {
          [Op.not]: null,
          [Op.ne]: '',
        },
      },
      group: ['countryCode', 'countryName'],
      order: [[literal('"totalVisits"'), 'DESC']],
    });

    const countryCodes = visitRows
      .map((row) => row.countryCode)
      .filter(Boolean);

    const locations = countryCodes.length
      ? await Location.findAll({
        where: {
          type: 'country',
          code: { [Op.in]: countryCodes },
        },
        attributes: ['id', 'code'],
      })
      : [];

    const locationByCode = new Map(
      locations
        .map((location) => [String(location.code || '').toUpperCase(), location])
    );

    const locationIds = locations.map((location) => location.id);

    const fundings = locationIds.length
      ? await CountryFunding.findAll({
        where: { locationId: { [Op.in]: locationIds } },
        attributes: ['locationId', 'status', 'goalAmount', 'currentAmount'],
      })
      : [];
    const fundingByLocationId = new Map(
      fundings.map((funding) => [funding.locationId, funding])
    );

    const hasContentRows = locationIds.length
      ? await sequelize.query(
        `
          SELECT l.id AS "locationId",
                 CASE
                   WHEN EXISTS (
                     SELECT 1
                     FROM "LocationLinks" ll
                     WHERE ll.location_id = l.id
                       AND ll.entity_type IN ('article', 'poll')
                   )
                   OR EXISTS (
                     SELECT 1
                     FROM "Suggestions" s
                     WHERE s."locationId" = l.id
                   )
                   THEN 1
                   ELSE 0
                 END AS "hasContent"
          FROM "Locations" l
          WHERE l.id IN (:locationIds)
        `,
        {
          replacements: { locationIds },
          type: QueryTypes.SELECT,
        }
      )
      : [];

    const hasContentByLocationId = new Map(
      hasContentRows.map((row) => [row.locationId, Boolean(row.hasContent)])
    );

    return res.json({
      success: true,
      data: visitRows.map((row) => {
        const normalizedCode = String(row.countryCode || '').toUpperCase();
        const location = locationByCode.get(normalizedCode);
        const funding = location ? fundingByLocationId.get(location.id) : null;
        return {
          countryCode: row.countryCode,
          countryName: row.countryName,
          totalVisits: toInt(row.get('totalVisits')),
          locationId: location?.id || null,
          hasContent: location ? Boolean(hasContentByLocationId.get(location.id)) : false,
          funding: funding
            ? {
              status: funding.status,
              goalAmount: toNumber(funding.goalAmount),
              currentAmount: toNumber(funding.currentAmount),
            }
            : null,
        };
      }),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/country-funding', apiLimiter, authMiddleware, checkRole('admin'), async (req, res, next) => {
  try {
    const records = await CountryFunding.findAll({
      include: [{
        model: Location,
        as: 'location',
        attributes: ['id', 'name', 'code', 'slug', 'type'],
      }],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ success: true, data: records });
  } catch (err) {
    return next(err);
  }
});

router.post('/country-funding', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, async (req, res, next) => {
  try {
    const { locationId, goalAmount, donationUrl, notes } = req.body;

    if (!locationId || Number.isNaN(Number(locationId))) {
      return res.status(400).json({ success: false, message: 'locationId is required.' });
    }

    const location = await Location.findOne({
      where: { id: Number(locationId), type: 'country' },
    });
    if (!location) {
      return res.status(400).json({ success: false, message: 'locationId must reference a valid country location.' });
    }

    const existing = await CountryFunding.findOne({ where: { locationId: location.id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Country funding already exists for this location.' });
    }

    const created = await CountryFunding.create({
      locationId: location.id,
      ...(goalAmount != null ? { goalAmount } : {}),
      donationUrl: donationUrl || null,
      notes: notes || null,
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return next(err);
  }
});

router.put('/country-funding/:id', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, async (req, res, next) => {
  try {
    const record = await CountryFunding.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Country funding record not found.' });
    }

    const { goalAmount, currentAmount, donorCount, status, donationUrl, notes } = req.body;

    if (status != null && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    if (goalAmount != null) record.goalAmount = goalAmount;
    if (currentAmount != null) record.currentAmount = currentAmount;
    if (donorCount != null) record.donorCount = donorCount;
    if (donationUrl !== undefined) record.donationUrl = donationUrl || null;
    if (notes !== undefined) record.notes = notes || null;

    if (status != null) {
      record.status = status;
      if (status === 'unlocked' && !record.unlockedAt) {
        record.unlockedAt = new Date();
        record.unlockedByUserId = req.user.id;
      }
    }

    await record.save();
    return res.json({ success: true, data: record });
  } catch (err) {
    return next(err);
  }
});

router.delete('/country-funding/:id', apiLimiter, authMiddleware, checkRole('admin'), csrfProtection, async (req, res, next) => {
  try {
    const record = await CountryFunding.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Country funding record not found.' });
    }

    await record.destroy();
    return res.json({ success: true, message: 'Country funding record deleted.' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
