'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'candidate';`
      );
    } else {
      // For SQLite (used in tests) and other dialects, recreate the column
      await queryInterface.changeColumn('Users', 'role', {
        type: Sequelize.ENUM('admin', 'moderator', 'editor', 'viewer', 'candidate'),
        defaultValue: 'viewer',
        allowNull: false
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      // PostgreSQL does not support removing ENUM values directly.
      // This is a no-op to avoid data loss.
    } else {
      await queryInterface.changeColumn('Users', 'role', {
        type: Sequelize.ENUM('admin', 'moderator', 'editor', 'viewer'),
        defaultValue: 'viewer',
        allowNull: false
      });
    }
  }
};
