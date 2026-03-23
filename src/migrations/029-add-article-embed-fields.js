'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Articles').catch(() => null);
    if (!tableDescription) {
      console.log('Articles table does not exist, skipping embed fields migration');
      return;
    }

    const columnsToAdd = [
      {
        name: 'sourceUrl',
        definition: { type: Sequelize.STRING, allowNull: true }
      },
      {
        name: 'sourceProvider',
        definition: { type: Sequelize.STRING(50), allowNull: true }
      },
      {
        name: 'sourceMeta',
        definition: { type: Sequelize.JSON, allowNull: true }
      },
      {
        name: 'embedUrl',
        definition: { type: Sequelize.STRING, allowNull: true }
      },
      {
        name: 'embedHtml',
        definition: { type: Sequelize.TEXT, allowNull: true }
      }
    ];

    for (const col of columnsToAdd) {
      if (!tableDescription[col.name]) {
        await queryInterface.addColumn('Articles', col.name, col.definition);
        console.log(`Added column Articles.${col.name}`);
      } else {
        console.log(`Column Articles.${col.name} already exists, skipping`);
      }
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('Articles').catch(() => null);
    if (!tableDescription) return;

    const columnsToDrop = ['sourceUrl', 'sourceProvider', 'sourceMeta', 'embedUrl', 'embedHtml'];
    for (const col of columnsToDrop) {
      if (tableDescription[col]) {
        await queryInterface.removeColumn('Articles', col);
        console.log(`Removed column Articles.${col}`);
      }
    }
  }
};
