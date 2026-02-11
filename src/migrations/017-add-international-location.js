'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if International location already exists
    const [results] = await queryInterface.sequelize.query(
      `SELECT id FROM "Locations" WHERE type = 'international' AND slug = 'international' LIMIT 1;`
    );

    if (results.length === 0) {
      // Insert International location
      await queryInterface.sequelize.query(`
        INSERT INTO "Locations" (name, type, slug, parent_id, "createdAt", "updatedAt")
        VALUES ('International', 'international', 'international', NULL, NOW(), NOW());
      `);
      console.log('International location added successfully');
    } else {
      console.log('International location already exists');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DELETE FROM "Locations" WHERE type = 'international' AND slug = 'international';
    `);
  }
};
