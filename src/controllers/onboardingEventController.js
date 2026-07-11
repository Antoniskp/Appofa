'use strict';

/**
 * onboardingEventController — server-side funnel analytics for onboarding milestones.
 *
 * POST /api/onboarding/events   — record one milestone (authenticated, CSRF)
 * GET  /api/admin/onboarding/funnel — aggregate view (admin-only)
 */

const { Op, fn, literal } = require('sequelize');
const { OnboardingEvent, sequelize } = require('../models');

// ISO date-only pattern used to detect calendar-day inputs (no time component)
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Abandonment window: users who started but have not completed within this many days
const ABANDONMENT_DAYS = 14;

// Metadata keys that may be stored per event type (allowlist)
const METADATA_ALLOWLIST = {
  registration: [],
  onboarding_viewed: [],
  goal_selected: ['previousGoal'],
  checklist_progress: ['completedCount', 'totalCount'],
  onboarding_dismissed: [],
  onboarding_resumed: [],
  onboarding_completed: [],
  moderator_application_submitted: [],
  moderator_application_approved: [],
  first_contribution_created: ['contentType'],
  candidate_registration_submitted: [],
  candidate_registration_approved: [],
};

/**
 * Sanitize metadata to only include allowlisted scalar keys.
 */
function sanitizeMetadata(eventType, raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const allowed = METADATA_ALLOWLIST[eventType] || [];
  if (allowed.length === 0) return null;
  const out = {};
  for (const key of allowed) {
    if (key in raw) {
      const val = raw[key];
      // Only store primitives
      if (val !== null && typeof val !== 'object') {
        out[key] = val;
      }
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * POST /api/onboarding/events
 * Record a single onboarding funnel milestone.
 */
exports.recordEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventType, goal, metadata: rawMetadata } = req.body;

    if (!OnboardingEvent.ALL_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ success: false, message: 'Invalid event type.' });
    }

    if (goal !== undefined && goal !== null && !OnboardingEvent.ALLOWED_GOALS.includes(goal)) {
      return res.status(400).json({ success: false, message: 'Invalid goal value.' });
    }

    const metadata = sanitizeMetadata(eventType, rawMetadata);

    // Idempotency: for once-per-user events, skip if already exists
    if (OnboardingEvent.ONCE_PER_USER_EVENTS.has(eventType)) {
      const existing = await OnboardingEvent.findOne({
        where: { userId, eventType },
        attributes: ['id'],
      });
      if (existing) {
        return res.json({ success: true, data: { recorded: false, reason: 'already_exists' } });
      }
    }

    await OnboardingEvent.create({ userId, eventType, goal: goal || null, metadata });

    return res.status(201).json({ success: true, data: { recorded: true } });
  } catch (err) {
    console.error('Record onboarding event error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record event.' });
  }
};

/**
 * GET /api/admin/onboarding/funnel
 * Aggregate funnel metrics, admin-only.
 *
 * Query params:
 *   from  — ISO date string, start of window (default: 30 days ago)
 *   to    — ISO date string, end of window (default: now)
 *   goal  — filter to a specific goal (optional)
 */
exports.getAdminFunnel = async (req, res) => {
  try {
    // Parse and validate date bounds
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let from = defaultFrom;
    let to = now;

    if (req.query.from) {
      from = new Date(req.query.from);
      if (isNaN(from.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid "from" date.' });
      }
    }
    if (req.query.to) {
      to = new Date(req.query.to);
      if (isNaN(to.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid "to" date.' });
      }
      // A date-only input (YYYY-MM-DD) should include the entire calendar day,
      // not stop at midnight UTC. Advance to 23:59:59.999 UTC of that day.
      if (DATE_ONLY_RE.test(req.query.to)) {
        to.setUTCHours(23, 59, 59, 999);
      }
    }
    if (from > to) {
      return res.status(400).json({ success: false, message: '"from" must be before "to".' });
    }

    const goalFilter = OnboardingEvent.ALLOWED_GOALS.includes(req.query.goal)
      ? req.query.goal
      : null;

    const where = {
      createdAt: { [Op.between]: [from, to] },
    };
    if (goalFilter) where.goal = goalFilter;

    // Count distinct users per event type.
    // Use dialect-aware Sequelize expression so column names are always properly
    // quoted; the raw SQL path is avoided entirely.
    const dialect = sequelize.getDialect();
    const countDistinct = dialect === 'postgres'
      ? fn('COUNT', literal('DISTINCT "userId"'))
      : fn('COUNT', literal('DISTINCT userId'));

    const rows = await OnboardingEvent.findAll({
      where,
      attributes: [
        'eventType',
        'goal',
        [countDistinct, 'userCount'],
      ],
      group: ['eventType', 'goal'],
      raw: true,
    });

    // Build structured response
    const byType = {};
    for (const row of rows) {
      const { eventType, goal, userCount } = row;
      if (!byType[eventType]) byType[eventType] = {};
      byType[eventType][goal || '_all'] = Number(userCount);
    }

    // Compute abandonment: users who viewed but did not complete within ABANDONMENT_DAYS.
    // Use Sequelize ORM queries only — no raw SQL — so identifiers are always quoted
    // correctly for both PostgreSQL (mixed-case names) and SQLite.
    const abandonmentCutoff = new Date(now.getTime() - ABANDONMENT_DAYS * 24 * 60 * 60 * 1000);

    const viewedBeforeCutoff = await OnboardingEvent.count({
      where: {
        eventType: 'onboarding_viewed',
        createdAt: { [Op.lte]: abandonmentCutoff },
      },
      distinct: true,
      col: 'userId',
    });

    // Distinct user IDs who have ever completed onboarding (no date restriction).
    const completedUserRows = await OnboardingEvent.findAll({
      where: { eventType: 'onboarding_completed' },
      attributes: ['userId'],
      group: ['userId'],
      raw: true,
    });
    const completedUserIds = completedUserRows.map((r) => r.userId);

    // Among those viewed-before-cutoff users, how many also completed?
    let completedViewerCount = 0;
    if (completedUserIds.length > 0) {
      completedViewerCount = await OnboardingEvent.count({
        where: {
          eventType: 'onboarding_viewed',
          createdAt: { [Op.lte]: abandonmentCutoff },
          userId: { [Op.in]: completedUserIds },
        },
        distinct: true,
        col: 'userId',
      });
    }
    const abandonedCount = Math.max(0, viewedBeforeCutoff - completedViewerCount);

    return res.json({
      success: true,
      data: {
        from: from.toISOString(),
        to: to.toISOString(),
        goal: goalFilter,
        byEventType: byType,
        abandonment: {
          windowDays: ABANDONMENT_DAYS,
          viewedBeforeCutoff: viewedBeforeCutoff,
          completedViewers: completedViewerCount,
          abandonedCount,
          abandonmentRate: viewedBeforeCutoff > 0
            ? Math.round((abandonedCount / viewedBeforeCutoff) * 100)
            : 0,
        },
      },
    });
  } catch (err) {
    console.error('[onboarding funnel] Error building funnel response:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch funnel data.' });
  }
};
