'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.getDialect();
    // Create ENUM types idempotently (PostgreSQL only)
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_Comments_entityType" AS ENUM ('article','poll','user_profile');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_Comments_status" AS ENUM ('visible','hidden','deleted');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
    }
    await queryInterface.createTable('Comments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      entityType: { type: Sequelize.ENUM('article', 'poll', 'user_profile'), allowNull: false, field: 'entityType' },
      entityId: { type: Sequelize.INTEGER, allowNull: false },
      authorId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      parentId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Comments', key: 'id' }, onDelete: 'CASCADE' },
      body: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('visible', 'hidden', 'deleted'), defaultValue: 'visible', allowNull: false },
      moderatedByUserId: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
      moderatedAt: { type: Sequelize.DATE, allowNull: true },
      moderationReason: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('Comments', ['entityType', 'entityId', 'createdAt']);
    await queryInterface.addIndex('Comments', ['parentId', 'createdAt']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Comments');
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Comments_entityType";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Comments_status";');
    }
  }
};
