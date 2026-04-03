'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // ── Formations ────────────────────────────────────────────────────────────
    if (!tables.includes('Formations')) {
      await queryInterface.createTable('Formations', {
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
        name: {
          type: Sequelize.STRING(200),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        category: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'serious',
        },
        isPublic: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        shareSlug: {
          type: Sequelize.STRING(32),
          allowNull: true,
          unique: true,
        },
        likeCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
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
    }

    // ── FormationPicks ────────────────────────────────────────────────────────
    if (!tables.includes('FormationPicks')) {
      await queryInterface.createTable('FormationPicks', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        formationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Formations', key: 'id' },
          onDelete: 'CASCADE',
        },
        positionSlug: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        personId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'PublicPersonProfiles', key: 'id' },
          onDelete: 'SET NULL',
        },
        candidateUserId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'SET NULL',
        },
        personName: {
          type: Sequelize.STRING(200),
          allowNull: true,
        },
        photo: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        avatar: {
          type: Sequelize.STRING(500),
          allowNull: true,
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

      await queryInterface.addIndex('FormationPicks', ['formationId', 'positionSlug'], {
        unique: true,
        name: 'unique_pick_per_position',
      });
    }

    // ── FormationLikes ────────────────────────────────────────────────────────
    if (!tables.includes('FormationLikes')) {
      await queryInterface.createTable('FormationLikes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        formationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Formations', key: 'id' },
          onDelete: 'CASCADE',
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
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

      await queryInterface.addIndex('FormationLikes', ['formationId', 'userId'], {
        unique: true,
        name: 'unique_formation_like',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('FormationLikes').catch(() => {});
    await queryInterface.dropTable('FormationPicks').catch(() => {});
    await queryInterface.dropTable('Formations').catch(() => {});
  },
};
