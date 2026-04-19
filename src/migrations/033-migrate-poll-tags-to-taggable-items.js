'use strict';

const parseTagsArray = (rawTags) => {
  if (Array.isArray(rawTags)) return rawTags;
  if (typeof rawTags === 'string') {
    try {
      const parsed = JSON.parse(rawTags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeTagName = (tag) => String(tag || '').trim().toLowerCase();

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    let pollTable;
    try {
      pollTable = await queryInterface.describeTable('Polls');
    } catch {
      return;
    }

    if (pollTable.tags) {
      const polls = await queryInterface.sequelize.query(
        'SELECT "id", "tags" FROM "Polls" WHERE "tags" IS NOT NULL;',
        { type: Sequelize.QueryTypes.SELECT }
      );

      for (const poll of polls) {
        const rawTags = parseTagsArray(poll.tags);
        const uniqueNormalizedTags = [...new Set(rawTags.map(normalizeTagName).filter(Boolean))];

        for (const tagName of uniqueNormalizedTags) {
          if (dialect === 'postgres') {
            await queryInterface.sequelize.query(
              'INSERT INTO "Tags" ("name", "createdAt", "updatedAt") VALUES (:name, NOW(), NOW()) ON CONFLICT ("name") DO NOTHING;',
              { replacements: { name: tagName } }
            );
          } else {
            await queryInterface.sequelize.query(
              'INSERT OR IGNORE INTO "Tags" ("name", "createdAt", "updatedAt") VALUES (:name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);',
              { replacements: { name: tagName } }
            );
          }

          const [tag] = await queryInterface.sequelize.query(
            'SELECT "id" FROM "Tags" WHERE "name" = :name LIMIT 1;',
            { replacements: { name: tagName }, type: Sequelize.QueryTypes.SELECT }
          );

          if (!tag?.id) {
            continue;
          }

          if (dialect === 'postgres') {
            await queryInterface.sequelize.query(
              'INSERT INTO "TaggableItems" ("tagId", "entityType", "entityId", "createdAt", "updatedAt") VALUES (:tagId, \'poll\', :entityId, NOW(), NOW()) ON CONFLICT ("tagId", "entityType", "entityId") DO NOTHING;',
              { replacements: { tagId: tag.id, entityId: poll.id } }
            );
          } else {
            await queryInterface.sequelize.query(
              'INSERT OR IGNORE INTO "TaggableItems" ("tagId", "entityType", "entityId", "createdAt", "updatedAt") VALUES (:tagId, \'poll\', :entityId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);',
              { replacements: { tagId: tag.id, entityId: poll.id } }
            );
          }
        }
      }
    }

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query('ALTER TABLE "Polls" DROP COLUMN IF EXISTS "tags";');
    } else if (pollTable.tags) {
      await queryInterface.removeColumn('Polls', 'tags');
    }
  },

  async down(queryInterface, Sequelize) {
    let pollTable;
    try {
      pollTable = await queryInterface.describeTable('Polls');
    } catch {
      return;
    }

    if (!pollTable.tags) {
      await queryInterface.addColumn('Polls', 'tags', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: '[]'
      });
    }

    let taggableTable;
    let tagsTable;
    try {
      taggableTable = await queryInterface.describeTable('TaggableItems');
      tagsTable = await queryInterface.describeTable('Tags');
    } catch {
      return;
    }

    if (!taggableTable || !tagsTable) {
      return;
    }

    const rows = await queryInterface.sequelize.query(
      `SELECT ti."entityId" AS "pollId", t."name" AS "tagName"
       FROM "TaggableItems" ti
       INNER JOIN "Tags" t ON t."id" = ti."tagId"
       WHERE ti."entityType" = 'poll';`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const grouped = rows.reduce((acc, row) => {
      if (!acc[row.pollId]) acc[row.pollId] = [];
      acc[row.pollId].push(row.tagName);
      return acc;
    }, {});

    for (const [pollId, tagNames] of Object.entries(grouped)) {
      await queryInterface.sequelize.query(
        'UPDATE "Polls" SET "tags" = :tags WHERE "id" = :pollId;',
        {
          replacements: { pollId, tags: JSON.stringify([...new Set(tagNames)]) }
        }
      );
    }
  }
};
