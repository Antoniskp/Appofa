'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('IpAccessRules')) {
      const dialect = queryInterface.sequelize.getDialect();

      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE "enum_IpAccessRules_type" AS ENUM ('whitelist', 'blacklist');
          EXCEPTION WHEN duplicate_object THEN null;
          END $$;
        `);
      }

      await queryInterface.createTable('IpAccessRules', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        ip: {
          type: Sequelize.STRING(45),
          allowNull: false,
          unique: true,
        },
        type: {
          type: dialect === 'postgres'
            ? Sequelize.ENUM('whitelist', 'blacklist')
            : Sequelize.STRING,
          allowNull: false,
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        createdByUserId: {
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
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('IpAccessRules').catch(() => {});

    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_IpAccessRules_type";'
      ).catch(() => {});
    }
  },
};
