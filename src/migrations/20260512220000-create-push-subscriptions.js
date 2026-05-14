'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((t) => (typeof t === 'string' ? t : t.tableName || t.name));

    if (tableNames.includes('PushSubscriptions')) {
      return;
    }

    await queryInterface.createTable('PushSubscriptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      endpoint: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      p256dh: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      auth: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      userAgent: {
        type: Sequelize.STRING(500),
        allowNull: true,
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

    await queryInterface.addIndex('PushSubscriptions', ['userId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PushSubscriptions').catch(() => {});
  },
};
