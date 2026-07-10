'use strict';

const ALLOWED_GOALS = ['moderator', 'creator', 'independent', 'citizen'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');
    const dialect = queryInterface.sequelize.getDialect();

    if (!tableDescription.onboardingGoal) {
      await queryInterface.addColumn('Users', 'onboardingGoal', {
        type: dialect === 'postgres'
          ? Sequelize.ENUM(...ALLOWED_GOALS)
          : Sequelize.STRING(30),
        allowNull: true,
      });
    }

    if (!tableDescription.onboardingSecondaryGoals) {
      await queryInterface.addColumn('Users', 'onboardingSecondaryGoals', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableDescription.onboardingDismissed) {
      await queryInterface.addColumn('Users', 'onboardingDismissed', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!tableDescription.onboardingCompletedAt) {
      await queryInterface.addColumn('Users', 'onboardingCompletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('Users');
    const dialect = queryInterface.sequelize.getDialect();

    if (tableDescription.onboardingCompletedAt) {
      await queryInterface.removeColumn('Users', 'onboardingCompletedAt');
    }
    if (tableDescription.onboardingDismissed) {
      await queryInterface.removeColumn('Users', 'onboardingDismissed');
    }
    if (tableDescription.onboardingSecondaryGoals) {
      await queryInterface.removeColumn('Users', 'onboardingSecondaryGoals');
    }
    if (tableDescription.onboardingGoal) {
      await queryInterface.removeColumn('Users', 'onboardingGoal');
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS "enum_Users_onboardingGoal";'
        );
      }
    }
  },
};
