'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.createTable('PersonRemovalRequests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      publicPersonProfileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'CASCADE'
      },
      requesterName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      requesterEmail: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: dialect === 'sqlite'
          ? Sequelize.STRING(20)
          : Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      adminNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reviewedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex('PersonRemovalRequests', ['publicPersonProfileId']);
    await queryInterface.addIndex('PersonRemovalRequests', ['reviewedBy']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PersonRemovalRequests');
  }
};
