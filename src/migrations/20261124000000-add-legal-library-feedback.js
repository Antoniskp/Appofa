'use strict';

const contentTypes = "'article', 'person', 'poll', 'comment', 'candidate', 'user'";
const categories = "'misinformation', 'harassment', 'spam', 'privacy_violation', 'impersonation', 'inappropriate_content', 'other'";
const pendingIndex = 'reports_pending_law_user_unique';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    if (sequelize.getDialect() === 'postgres') {
      // PostgreSQL requires new enum values to be committed before the index can use them.
      await sequelize.query(`ALTER TYPE "enum_Reports_contentType" ADD VALUE IF NOT EXISTS 'law'`);
      await sequelize.query(`ALTER TYPE "enum_Reports_category" ADD VALUE IF NOT EXISTS 'harmful_legislation'`);
      await sequelize.query(`ALTER TYPE "enum_Reports_category" ADD VALUE IF NOT EXISTS 'corruption_risk'`);
    }
    await sequelize.transaction(async transaction => {
      const options = { transaction };
      const foreignKey = model => ({
        type: Sequelize.INTEGER, primaryKey: true, allowNull: false,
        references: { model, key: 'id' }, onDelete: 'CASCADE',
      });
      await queryInterface.createTable('LegalLibraryTargets', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        documentId: { type: Sequelize.STRING, allowNull: false },
        unitId: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
        label: { type: Sequelize.TEXT, allowNull: false },
      }, options);
      await queryInterface.addIndex('LegalLibraryTargets', ['documentId', 'unitId'], { unique: true, ...options });
      await queryInterface.createTable('LegalLibraryVotes', {
        targetId: foreignKey('LegalLibraryTargets'),
        userId: foreignKey('Users'),
        choice: { type: Sequelize.STRING(8), allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, options);
      await queryInterface.addIndex('Reports', ['contentId', 'reportedByUserId'], {
        name: pendingIndex, unique: true, where: { contentType: 'law', status: 'pending' }, ...options,
      });
    });
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async transaction => {
      const options = { transaction };
      await queryInterface.bulkDelete('Reports', { contentType: 'law' }, options);
      await queryInterface.removeIndex('Reports', pendingIndex, options);
      await queryInterface.dropTable('LegalLibraryVotes', options);
      await queryInterface.dropTable('LegalLibraryTargets', options);
      if (sequelize.getDialect() === 'postgres') {
        for (const [column, values] of [['contentType', contentTypes], ['category', categories]]) {
          const type = `enum_Reports_${column}`;
          await sequelize.query(`ALTER TYPE "${type}" RENAME TO "${type}_old"`, options);
          await sequelize.query(`CREATE TYPE "${type}" AS ENUM (${values})`, options);
          await sequelize.query(`ALTER TABLE "Reports" ALTER COLUMN "${column}" TYPE "${type}" USING "${column}"::text::"${type}"`, options);
          await sequelize.query(`DROP TYPE "${type}_old"`, options);
        }
      }
    });
  },
};
