const badges = require('../../config/badges.json');
const { UserBadge, User, Article, Poll, Comment, PollVote, SuggestionVote, Follow, Formation } = require('../models');

const badgeService = {
  /**
   * Evaluate all badges for a user and award any newly earned ones.
   * Returns array of newly awarded badges.
   */
  async evaluate(userId) {
    const stats = await this.getUserStats(userId);
    const existing = await UserBadge.findAll({ where: { userId } });
    const existingSet = new Set(existing.map(b => `${b.badgeSlug}:${b.tier}`));

    const newBadges = [];
    const toCreate = [];

    for (const badge of badges) {
      const value = this.getMetricValue(badge.slug, stats);

      for (const tierDef of badge.tiers) {
        const key = `${badge.slug}:${tierDef.tier}`;
        if (!existingSet.has(key) && value >= tierDef.threshold) {
          toCreate.push({
            userId,
            badgeSlug: badge.slug,
            tier: tierDef.tier,
            earnedAt: new Date(),
          });
          newBadges.push({ slug: badge.slug, tier: tierDef.tier, name: badge.name, label: tierDef.label });
        }
      }
    }

    if (toCreate.length > 0) {
      await UserBadge.bulkCreate(toCreate, { ignoreDuplicates: true });
    }

    return newBadges;
  },

  /**
   * Get user stats needed for badge evaluation
   */
  async getUserStats(userId) {
    const [
      articleCount,
      pollCount,
      commentCount,
      pollVoteCount,
      suggestionVoteCount,
      followerCount,
      formationCount,
      user,
    ] = await Promise.all([
      Article.count({ where: { authorId: userId, status: 'published' } }),
      Poll.count({ where: { creatorId: userId } }),
      Comment.count({ where: { authorId: userId } }),
      PollVote.count({ where: { userId } }),
      SuggestionVote.count({ where: { userId } }),
      Follow.count({ where: { followingId: userId } }),
      Formation.count({ where: { userId } }),
      User.findByPk(userId),
    ]);

    // Profile completeness score
    let profileScore = 0;
    if (user) {
      // Level 1: basic info (firstName OR lastName with meaningful content)
      if ((user.firstName && user.firstName.trim()) || (user.lastName && user.lastName.trim())) profileScore = 1;
      // Level 2: avatar + bio
      if (profileScore >= 1 && user.avatar && user.bio && user.bio.trim()) profileScore = 2;
      // Level 3: all sections (socialLinks, homeLocationId, professions or interests)
      if (profileScore >= 2 && user.socialLinks && user.homeLocationId &&
          ((user.professions && user.professions.length > 0) || (user.interests && user.interests.length > 0))) {
        profileScore = 3;
      }
    }

    // Article model has no views column — totalViews is always 0.
    // When a views column is added, replace this with:
    //   const viewsResult = await Article.sum('views', { where: { authorId: userId, status: 'published' } });
    //   totalViews = viewsResult || 0;
    const totalViews = 0;

    return {
      articleCount,
      pollCount,
      commentCount,
      voteCount: pollVoteCount + suggestionVoteCount,
      followerCount,
      formationCount,
      profileScore,
      totalViews,
    };
  },

  /**
   * Map badge slug to the relevant metric value
   */
  getMetricValue(slug, stats) {
    const mapping = {
      'article-writer': stats.articleCount,
      'pollster': stats.pollCount,
      'profile-complete': stats.profileScore,
      'popular': stats.totalViews,
      'commenter': stats.commentCount,
      'voter': stats.voteCount,
      'followed': stats.followerCount,
      'strategist': stats.formationCount,
    };
    return mapping[slug] ?? 0;
  },

  /**
   * Get all earned badges for a user (for profile display)
   * Returns enriched data including badge name and tier label from config.
   */
  async getUserBadges(userId) {
    const earned = await UserBadge.findAll({
      where: { userId },
      order: [['earnedAt', 'ASC']],
    });

    // Enrich with human-readable names from badge config
    const badgeMap = new Map(badges.map(b => [b.slug, b]));
    return earned.map(record => {
      const badgeDef = badgeMap.get(record.badgeSlug);
      const tierDef = badgeDef?.tiers.find(t => t.tier === record.tier);
      return {
        ...record.toJSON(),
        name: badgeDef?.name || record.badgeSlug,
        label: tierDef?.label || record.tier,
      };
    });
  },

  /**
   * Get badge progress for a user (earned + progress toward unearned)
   */
  async getUserBadgeProgress(userId) {
    const stats = await this.getUserStats(userId);
    const earned = await UserBadge.findAll({ where: { userId } });
    const earnedSet = new Set(earned.map(b => `${b.badgeSlug}:${b.tier}`));

    return badges.map(badge => {
      const currentValue = this.getMetricValue(badge.slug, stats);
      return {
        ...badge,
        currentValue,
        tiers: badge.tiers.map(t => ({
          ...t,
          earned: earnedSet.has(`${badge.slug}:${t.tier}`),
          earnedAt: earned.find(e => e.badgeSlug === badge.slug && e.tier === t.tier)?.earnedAt || null,
          progress: Math.min(100, Math.round((currentValue / t.threshold) * 100)),
        })),
      };
    });
  },
};

module.exports = badgeService;
