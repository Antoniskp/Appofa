'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'string' ? table : table.tableName));
    if (tableNames.includes('EmailLoginCodes')) return;

    await queryInterface.createTable('EmailLoginCodes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      codeHash: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      consumedAt: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('EmailLoginCodes', ['email', 'createdAt'], {
      name: 'email_login_codes_email_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('EmailLoginCodes');
  },
};
