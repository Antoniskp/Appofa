'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Users');
    if (!columns.preferredLocale) {
      await queryInterface.addColumn('Users', 'preferredLocale', {
        type: Sequelize.STRING(5), allowNull: false, defaultValue: 'el',
      });
    }
    if (!columns.onboardingFollowupClaimedAt) {
      await queryInterface.addColumn('Users', 'onboardingFollowupClaimedAt', {
        type: Sequelize.DATE, allowNull: true,
      });
    }
    if (!columns.onboardingFollowupSentAt) {
      await queryInterface.addColumn('Users', 'onboardingFollowupSentAt', {
        type: Sequelize.DATE, allowNull: true,
      });
    }
    // Start the automated follow-up only for accounts created after deployment.
    // This avoids emailing the existing backlog when the scheduler first starts.
    await queryInterface.sequelize.query(
      'UPDATE "Users" SET "onboardingFollowupSentAt" = "createdAt" WHERE "onboardingFollowupSentAt" IS NULL'
    );
  },
  async down(queryInterface) {
    const columns = await queryInterface.describeTable('Users');
    for (const name of ['onboardingFollowupSentAt', 'onboardingFollowupClaimedAt', 'preferredLocale']) {
      if (columns[name]) await queryInterface.removeColumn('Users', name);
    }
  },
};
