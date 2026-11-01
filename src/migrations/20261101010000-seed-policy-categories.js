'use strict';

const categories = [
  ['economy', 'Economy'], ['employment', 'Employment & social security'],
  ['housing', 'Housing'], ['education', 'Education & research'],
  ['health', 'Health & welfare'], ['environment', 'Environment & energy'],
  ['agriculture', 'Agriculture'], ['infrastructure', 'Infrastructure & transport'],
  ['justice', 'Justice & public safety'], ['governance', 'Governance & democracy'],
  ['foreign-policy', 'Foreign policy & defence'], ['culture', 'Culture & tourism'],
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      const [existing] = await queryInterface.sequelize.query('SELECT slug FROM "PolicyCategories"', { transaction });
      const slugs = new Set(existing.map(row => row.slug));
      const now = new Date();
      const rows = categories.filter(([slug]) => !slugs.has(slug)).map(([slug, name]) => ({ slug, name, createdAt: now, updatedAt: now }));
      if (rows.length) await queryInterface.bulkInsert('PolicyCategories', rows, { transaction });
    });
  },
  async down() {
    // Keep shared taxonomy records: they may predate this seed or have acquired
    // positions since deployment. Rolling back the feature schema removes them.
  },
};
