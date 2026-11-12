'use strict';

const TOPICS = [
  { name: 'Ελαιοπαραγωγή', slug: 'ελαιοπαραγωγη', description: 'Ελαιοκαλλιέργεια, συγκομιδή και παραγωγή ελαιολάδου.' },
  { name: 'Ψάρεμα', slug: 'ψαρεμα', description: 'Ψάρεμα και αλιευτικές δραστηριότητες.' },
  { name: 'Μαγειρική', slug: 'μαγειρικη', description: 'Μαγειρική, συνταγές και φαγητό.' },
  { name: 'Κηπουρική', slug: 'κηπουρικη', description: 'Κηπουρική, καλλιέργεια φυτών και λαχανικών.' }
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    for (const topic of TOPICS) {
      const [tags] = await queryInterface.sequelize.query(
        'SELECT "id" FROM "Tags" WHERE "name" = :name LIMIT 1;',
        { replacements: { name: topic.name } }
      );
      let tagId = tags[0]?.id;
      if (!tagId) {
        await queryInterface.bulkInsert('Tags', [{ name: topic.name, createdAt: now, updatedAt: now }]);
        const [createdTags] = await queryInterface.sequelize.query(
          'SELECT "id" FROM "Tags" WHERE "name" = :name LIMIT 1;',
          { replacements: { name: topic.name } }
        );
        tagId = createdTags[0].id;
      }

      const [topics] = await queryInterface.sequelize.query(
        'SELECT "id" FROM "Topics" WHERE "slug" = :slug LIMIT 1;',
        { replacements: { slug: topic.slug } }
      );
      if (!topics.length) {
        await queryInterface.bulkInsert('Topics', [{
          tagId,
          name: topic.name,
          slug: topic.slug,
          description: topic.description,
          aliases: JSON.stringify([]),
          status: 'active',
          isFeatured: false,
          createdAt: now,
          updatedAt: now
        }]);
      }
    }
  },

  async down(queryInterface) {
    for (const { slug } of TOPICS) {
      await queryInterface.bulkDelete('Topics', { slug });
    }
  }
};
