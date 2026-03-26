'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('LinkPreviewCaches')) {
      console.log('LinkPreviewCaches table does not exist, skipping');
      return;
    }

    await queryInterface.changeColumn('LinkPreviewCaches', 'title', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.changeColumn('LinkPreviewCaches', 'authorName', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    console.log('LinkPreviewCaches title and authorName columns altered to TEXT');
  },

  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('LinkPreviewCaches')) {
      console.log('LinkPreviewCaches table does not exist, skipping');
      return;
    }

    await queryInterface.changeColumn('LinkPreviewCaches', 'title', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.changeColumn('LinkPreviewCaches', 'authorName', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  }
};
