const { User, Location, Article, Poll } = require('../models');
const { sequelize } = require('../models');

/**
 * Get community statistics
 */
exports.getCommunityStats = async (req, res) => {
  try {
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
    // TODO: This should be based on actual moderator assignments once that feature is implemented
    // Current estimate: 70% of locations need moderators (conservative estimate)
    const MODERATOR_COVERAGE_RATIO = 0.3; // 30% of locations currently have moderators
    const areasNeedingModerators = Math.max(0, totalLocations - Math.floor(totalLocations * MODERATOR_COVERAGE_RATIO));

    // Get total articles and polls count for additional stats
    const totalArticles = await Article.count();
    const totalPolls = await Poll.count();

    res.json({
      success: true,
      data: {
        totalLocations,
        activeUsers: parseInt(activeUsers),
        areasNeedingModerators,
        totalArticles,
        totalPolls
      }
    });
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
