'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('UserBadges')) {
      const dialect = queryInterface.sequelize.getDialect();

      await queryInterface.createTable('UserBadges', {
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
        badgeSlug: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        tier: {
          type: dialect === 'sqlite'
            ? Sequelize.STRING
            : Sequelize.ENUM('bronze', 'silver', 'gold'),
          allowNull: false,
        },
        earnedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });

      await queryInterface.addIndex('UserBadges', ['userId', 'badgeSlug', 'tier'], {
        unique: true,
        name: 'unique_user_badge_tier',
      });

      await queryInterface.addIndex('UserBadges', ['userId'], {
        name: 'user_badges_user_id',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('UserBadges').catch(() => {});
  },
};
