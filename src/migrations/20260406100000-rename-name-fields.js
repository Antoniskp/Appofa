'use strict';

/**
 * Migration 20260406100000 — Rename firstName→firstNameNative, lastName→lastNameNative
 * on both Users and PublicPersonProfiles tables, and add firstNameEn, lastNameEn, nickname.
 *
 * This migration is fully idempotent: it checks column existence before acting.
 * SQLite does not support RENAME COLUMN in older versions; Sequelize's renameColumn
 * handles this by recreating the table internally for SQLite.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    for (const tableName of ['Users', 'PublicPersonProfiles']) {
      if (!tables.includes(tableName)) continue;

      const cols = await queryInterface.describeTable(tableName);

      // Rename firstName → firstNameNative
      if (cols.firstName && !cols.firstNameNative) {
        await queryInterface.renameColumn(tableName, 'firstName', 'firstNameNative');
      }

      // Rename lastName → lastNameNative
      if (cols.lastName && !cols.lastNameNative) {
        await queryInterface.renameColumn(tableName, 'lastName', 'lastNameNative');
      }

      // Re-describe after potential renames
      const updatedCols = await queryInterface.describeTable(tableName);

      // Add firstNameEn
      if (!updatedCols.firstNameEn) {
        await queryInterface.addColumn(tableName, 'firstNameEn', {
          type: Sequelize.STRING(100),
          allowNull: true
        });
      }

      // Add lastNameEn
      if (!updatedCols.lastNameEn) {
        await queryInterface.addColumn(tableName, 'lastNameEn', {
          type: Sequelize.STRING(100),
          allowNull: true
        });
      }

      // Add nickname
      if (!updatedCols.nickname) {
        await queryInterface.addColumn(tableName, 'nickname', {
          type: Sequelize.STRING(100),
          allowNull: true
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    for (const tableName of ['Users', 'PublicPersonProfiles']) {
      if (!tables.includes(tableName)) continue;

      const cols = await queryInterface.describeTable(tableName);

      // Remove added columns
      if (cols.nickname) {
        await queryInterface.removeColumn(tableName, 'nickname');
      }
      if (cols.lastNameEn) {
        await queryInterface.removeColumn(tableName, 'lastNameEn');
      }
      if (cols.firstNameEn) {
        await queryInterface.removeColumn(tableName, 'firstNameEn');
      }

      // Re-describe after removals
      const updatedCols = await queryInterface.describeTable(tableName);

      // Rename firstNameNative → firstName
      if (updatedCols.firstNameNative && !updatedCols.firstName) {
        await queryInterface.renameColumn(tableName, 'firstNameNative', 'firstName');
      }

      // Rename lastNameNative → lastName
      if (updatedCols.lastNameNative && !updatedCols.lastName) {
        await queryInterface.renameColumn(tableName, 'lastNameNative', 'lastName');
      }
    }
  }
};
