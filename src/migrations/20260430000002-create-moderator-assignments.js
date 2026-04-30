'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ModeratorAssignments', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assignedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    const nowExpr = queryInterface.sequelize.getDialect() === 'postgres'
      ? 'NOW()'
      : 'CURRENT_TIMESTAMP';

    await queryInterface.sequelize.query(`
      INSERT INTO "ModeratorAssignments" ("userId", "locationId", "assignedByUserId", "createdAt", "updatedAt")
      SELECT "id", "moderatorLocationId", NULL, ${nowExpr}, ${nowExpr}
      FROM "Users"
      WHERE "moderatorLocationId" IS NOT NULL
      ON CONFLICT ("userId") DO NOTHING
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ModeratorAssignments');
  }
};
