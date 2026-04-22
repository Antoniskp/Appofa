'use strict';

const DEFAULT_SETTINGS = [
  { key: 'unknown_country_action', value: 'allow' },
  { key: 'unknown_country_redirect_path', value: '/unknown-country' },
  { key: 'no_ip_action', value: 'allow' },
  { key: 'no_ip_redirect_path', value: '/unknown-country' },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const dialect = queryInterface.sequelize.getDialect();

    if (!tables.includes('GeoAccessSettings')) {
      await queryInterface.createTable('GeoAccessSettings', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        key: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        value: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
    }

    const now = new Date();
    for (const setting of DEFAULT_SETTINGS) {
      if (dialect === 'postgres' || dialect === 'sqlite') {
        await queryInterface.sequelize.query(
          `INSERT INTO "GeoAccessSettings" ("key", "value", "updatedAt")
           VALUES (:key, :value, :updatedAt)
           ON CONFLICT ("key") DO UPDATE
           SET "value" = EXCLUDED."value", "updatedAt" = EXCLUDED."updatedAt";`,
          {
            replacements: { key: setting.key, value: setting.value, updatedAt: now },
          }
        );
      } else {
        const [rows] = await queryInterface.sequelize.query(
          'SELECT id FROM "GeoAccessSettings" WHERE "key" = :key LIMIT 1;',
          { replacements: { key: setting.key } }
        );
        if (rows.length) {
          await queryInterface.bulkUpdate(
            'GeoAccessSettings',
            { value: setting.value, updatedAt: now },
            { key: setting.key }
          );
        } else {
          await queryInterface.bulkInsert('GeoAccessSettings', [{
            key: setting.key,
            value: setting.value,
            updatedAt: now,
          }]);
        }
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('GeoAccessSettings').catch(() => {});
  },
};
