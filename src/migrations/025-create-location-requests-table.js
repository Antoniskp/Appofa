'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_LocationRequests_status" AS ENUM ('pending','approved','rejected');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    await queryInterface.createTable('LocationRequests', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      countryName: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Requested country name in English'
      },
      countryNameLocal: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Requested country name in local language (optional)'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes from the requester'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      requestedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      reviewedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      reviewedAt: { type: Sequelize.DATE, allowNull: true },
      reviewNotes: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('LocationRequests', ['status', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('LocationRequests');
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_LocationRequests_status";'
      );
    }
  }
};
