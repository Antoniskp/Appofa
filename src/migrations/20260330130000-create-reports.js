'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.createTable('Reports', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      contentType: {
        type: dialect === 'sqlite'
          ? Sequelize.STRING(20)
          : Sequelize.ENUM('article', 'person', 'poll', 'comment', 'candidate', 'user'),
        allowNull: false
      },
      contentId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      category: {
        type: dialect === 'sqlite'
          ? Sequelize.STRING(30)
          : Sequelize.ENUM('misinformation', 'harassment', 'spam', 'privacy_violation', 'impersonation', 'inappropriate_content', 'other'),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reporterName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      reporterEmail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      reportedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      status: {
        type: dialect === 'sqlite'
          ? Sequelize.STRING(20)
          : Sequelize.ENUM('pending', 'reviewed', 'dismissed', 'actioned'),
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

    await queryInterface.addIndex('Reports', ['contentType', 'contentId']);
    await queryInterface.addIndex('Reports', ['status']);
    await queryInterface.addIndex('Reports', ['reportedByUserId']);
    await queryInterface.addIndex('Reports', ['reviewedBy']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Reports');
  }
};
