'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'Locations';

    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM "Locations" WHERE type = :type AND slug = :slug LIMIT 1;',
      {
        replacements: { type: 'international', slug: 'international' },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existing.length === 0) {
      const now = new Date();
      await queryInterface.bulkInsert(tableName, [{
        name: 'International',
        type: 'international',
        slug: 'international',
        parent_id: null,
        createdAt: now,
        updatedAt: now
      }]);
      console.log('International location added successfully');
    } else {
      console.log('International location already exists');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Locations', {
      type: 'international',
      slug: 'international'
    });
  }
};
