const { User, Location, Article, Poll, PollVote, Comment } = require('../models');
const { sequelize } = require('../models');

// In-memory cache for community stats (per Node instance)
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let statsCache = null;       // { data, expiresAt }
let inflightPromise = null;  // concurrency guard – avoid stampede

async function computeCommunityStats() {
  // Get total locations count
  const totalLocations = await Location.count();

  // Get active users count (users who have created articles or polls)
  const activeUsersQuery = await sequelize.query(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM (
      SELECT "userId" as user_id FROM "Articles" WHERE "userId" IS NOT NULL
      UNION
      SELECT "createdBy" as user_id FROM "Polls" WHERE "createdBy" IS NOT NULL
    ) as active_users
  `, { type: sequelize.QueryTypes.SELECT });

  const activeUsers = activeUsersQuery[0]?.count || 0;

  // Count locations that need moderators
  const MODERATOR_COVERAGE_RATIO = 0.3;
  const areasNeedingModerators = Math.max(0, totalLocations - Math.floor(totalLocations * MODERATOR_COVERAGE_RATIO));

  const totalArticles = await Article.count();
  const totalPolls = await Poll.count();
  const totalUsers = await User.count();
  const totalVotes = await PollVote.count();
  const totalComments = await Comment.count({ where: { status: 'visible' } });

  return {
    totalLocations,
    activeUsers: parseInt(activeUsers),
    areasNeedingModerators,
    totalArticles,
    totalPolls,
    totalUsers,
    totalVotes,
    totalComments,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Get community statistics (cached, lazy refresh, 10-min TTL)
 */
exports.getCommunityStats = async (req, res) => {
  try {
    const now = Date.now();

    if (statsCache && statsCache.expiresAt > now) {
      return res.json({ success: true, data: statsCache.data });
    }

    // Avoid stampede: reuse an existing in-flight computation
    if (!inflightPromise) {
      inflightPromise = computeCommunityStats().then((data) => {
        statsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
        inflightPromise = null;
        return data;
      }).catch((err) => {
        inflightPromise = null;
        throw err;
      });
    }

    const data = await inflightPromise;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching community stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching community stats.'
    });
  }
};

/**
 * Get user's home location
 */
exports.getUserHomeLocation = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // For now, return null as there's no home location field in User model
    // This can be enhanced when the User model is updated with home location
    res.json({
      success: true,
      data: {
        homeLocation: null
      }
    });
  } catch (error) {
    console.error('Error fetching user home location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user home location.'
    });
  }
};
