const express = require('express');
const { fn, col, literal, Op, QueryTypes } = require('sequelize');
const {
  sequelize,
  GeoVisit,
  CountryFunding,
  Location,
} = require('../models');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { apiLimiter } = require('../middleware/rateLimiter');
const csrfProtection = require('../middleware/csrfProtection');

const router = express.Router();

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

    const [totalVisits, byCountryRows, topPathRows] = await Promise.all([
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
      },
    });
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
      goalAmount: goalAmount != null ? goalAmount : undefined,
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
