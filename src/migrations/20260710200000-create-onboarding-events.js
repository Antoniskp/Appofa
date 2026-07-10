'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('OnboardingEvents')) return;

    await queryInterface.createTable('OnboardingEvents', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      eventType: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      goal: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('OnboardingEvents', ['userId', 'eventType'], {
      name: 'onboarding_events_user_type',
    });
    await queryInterface.addIndex('OnboardingEvents', ['eventType', 'createdAt'], {
      name: 'onboarding_events_type_created',
    });
    await queryInterface.addIndex('OnboardingEvents', ['goal', 'createdAt'], {
      name: 'onboarding_events_goal_created',
    });
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('OnboardingEvents')) return;
    await queryInterface.dropTable('OnboardingEvents');
  },
};
