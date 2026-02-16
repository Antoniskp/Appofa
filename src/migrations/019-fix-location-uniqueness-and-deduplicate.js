'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const describeOrNull = async (tableName) => {
      try {
        await queryInterface.describeTable(tableName);
        return true;
      } catch (error) {
        return false;
      }
    };

    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "unique_location_name_per_parent";');

    const locations = await queryInterface.sequelize.query(
      'SELECT id, type, name, parent_id FROM "Locations" ORDER BY id ASC;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const keepIdByKey = new Map();
    const duplicateToKeepId = new Map();

    for (const location of locations) {
      const normalizedName = String(location.name || '').trim().toLowerCase();
      const parentId = location.parent_id ?? -1;
      const key = `${location.type}::${normalizedName}::${parentId}`;

      if (!keepIdByKey.has(key)) {
        keepIdByKey.set(key, location.id);
        continue;
      }

      duplicateToKeepId.set(location.id, keepIdByKey.get(key));
    }

    const duplicateIds = Array.from(duplicateToKeepId.keys());

    if (duplicateIds.length > 0) {
      const maybeUpdateReferenceTable = async (tableName, columnName) => {
        if (!(await describeOrNull(tableName))) {
          return;
        }

        for (const [duplicateId, keepId] of duplicateToKeepId.entries()) {
          await queryInterface.bulkUpdate(
            tableName,
            { [columnName]: keepId },
            { [columnName]: duplicateId }
          );
        }
      };

      await maybeUpdateReferenceTable('Locations', 'parent_id');
      await maybeUpdateReferenceTable('LocationLinks', 'location_id');
      await maybeUpdateReferenceTable('Messages', 'locationId');
      await maybeUpdateReferenceTable('Polls', 'locationId');
      await maybeUpdateReferenceTable('Users', 'homeLocationId');

      await queryInterface.bulkDelete('Locations', {
        id: duplicateIds
      });
    }

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "unique_location_name_per_parent"
      ON "Locations" (type, LOWER(TRIM(name)), COALESCE(parent_id, -1));
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "unique_location_name_per_parent";');

    await queryInterface.addIndex('Locations', ['type', 'name', 'parent_id'], {
      unique: true,
      name: 'unique_location_name_per_parent'
    });
  }
};
