'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const dialect = queryInterface.sequelize.getDialect();

    if (!tables.includes('CountryFundings')) {
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_CountryFundings_status" AS ENUM ('locked', 'funding', 'unlocked');
          EXCEPTION WHEN duplicate_object THEN null;
          END $$;
        `);
      }

      await queryInterface.createTable('CountryFundings', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        locationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Locations', key: 'id' },
          onDelete: 'CASCADE',
        },
        goalAmount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 500.00,
        },
        currentAmount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00,
        },
        donorCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        status: {
          type: dialect === 'postgres'
            ? Sequelize.ENUM('locked', 'funding', 'unlocked')
            : Sequelize.STRING,
          allowNull: false,
          defaultValue: 'locked',
        },
        donationUrl: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        unlockedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        unlockedByUserId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Users', key: 'id' },
          onDelete: 'SET NULL',
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

      await queryInterface.addIndex('CountryFundings', ['locationId'], {
        unique: true,
        name: 'country_funding_location_unique',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CountryFundings').catch(() => {});

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_CountryFundings_status";'
      ).catch(() => {});
    }
  },
};
