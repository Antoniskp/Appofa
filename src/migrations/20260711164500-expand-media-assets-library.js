'use strict';

const MEDIA_USAGE_TYPES = ['shared', 'article_cover', 'article_body', 'avatar'];
const MEDIA_ENTITY_TYPES = ['shared', 'article', 'avatar'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tableInfo = await queryInterface.describeTable('MediaAssets').catch(() => null);
    if (!tableInfo) return;

    if (!tableInfo.variants) {
      await queryInterface.addColumn('MediaAssets', 'variants', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableInfo.detectedMimeType) {
      await queryInterface.addColumn('MediaAssets', 'detectedMimeType', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!tableInfo.entityType) {
      await queryInterface.addColumn('MediaAssets', 'entityType', {
        type: dialect === 'postgres' ? Sequelize.ENUM(...MEDIA_ENTITY_TYPES) : Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'shared',
      });
    }

    if (!tableInfo.caption) {
      await queryInterface.addColumn('MediaAssets', 'caption', {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
    }

    if (!tableInfo.tags) {
      await queryInterface.addColumn('MediaAssets', 'tags', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableInfo.metadata) {
      await queryInterface.addColumn('MediaAssets', 'metadata', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableInfo.checksumSha256) {
      await queryInterface.addColumn('MediaAssets', 'checksumSha256', {
        type: Sequelize.STRING(64),
        allowNull: true,
      });
    }

    if (!tableInfo.deletedAt) {
      await queryInterface.addColumn('MediaAssets', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableInfo.isOrphaned) {
      await queryInterface.addColumn('MediaAssets', 'isOrphaned', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!tableInfo.orphanedAt) {
      await queryInterface.addColumn('MediaAssets', 'orphanedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableInfo.lastReferencedAt) {
      await queryInterface.addColumn('MediaAssets', 'lastReferencedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        UPDATE "MediaAssets"
        SET "usageType" = 'article_cover'
        WHERE "usageType" = 'article_banner'
      `).catch((error) => {
        console.warn('media migration: failed to backfill postgres usageType values', error.message);
      });
    } else {
      await queryInterface.sequelize.query("UPDATE MediaAssets SET usageType = 'article_cover' WHERE usageType = 'article_banner'").catch((error) => {
        console.warn('media migration: failed to backfill sqlite usageType values', error.message);
      });
    }

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_MediaAssets_usageType_old";').catch(() => {});
      await queryInterface.sequelize.query('ALTER TYPE "enum_MediaAssets_usageType" RENAME TO "enum_MediaAssets_usageType_old";').catch(() => {});
      await queryInterface.sequelize.query(`CREATE TYPE "enum_MediaAssets_usageType" AS ENUM (${MEDIA_USAGE_TYPES.map((v) => `'${v}'`).join(', ')});`).catch(() => {});
      await queryInterface.sequelize.query('ALTER TABLE "MediaAssets" ALTER COLUMN "usageType" TYPE "enum_MediaAssets_usageType" USING "usageType"::text::"enum_MediaAssets_usageType";').catch(() => {});
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_MediaAssets_usageType_old";').catch(() => {});
    }

    const articleInfo = await queryInterface.describeTable('Articles').catch(() => null);
    if (articleInfo && !articleInfo.coverImageId) {
      await queryInterface.addColumn('Articles', 'coverImageId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'MediaAssets',
          key: 'id',
        },
        onDelete: 'SET NULL',
      });
      await queryInterface.addIndex('Articles', ['coverImageId']);
    }

    await queryInterface.addIndex('MediaAssets', ['entityType']).catch(() => {});
    await queryInterface.addIndex('MediaAssets', ['deletedAt']).catch(() => {});
    await queryInterface.addIndex('MediaAssets', ['isOrphaned']).catch(() => {});
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Articles', ['coverImageId']).catch(() => {});
    await queryInterface.removeColumn('Articles', 'coverImageId').catch(() => {});

    await queryInterface.removeIndex('MediaAssets', ['entityType']).catch(() => {});
    await queryInterface.removeIndex('MediaAssets', ['deletedAt']).catch(() => {});
    await queryInterface.removeIndex('MediaAssets', ['isOrphaned']).catch(() => {});

    await queryInterface.removeColumn('MediaAssets', 'lastReferencedAt').catch(() => {});
    await queryInterface.removeColumn('MediaAssets', 'orphanedAt').catch(() => {});
    await queryInterface.removeColumn('MediaAssets', 'isOrphaned').catch(() => {});
    await queryInterface.removeColumn('MediaAssets', 'deletedAt').catch(() => {});
    await queryInterface.removeColumn('MediaAssets', 'checksumSha256').catch(() => {});
    await queryInterface.removeColumn('MediaAssets', 'metadata').catch(() => {});
    await queryInterface.removeColumn('MediaAssets', 'tags').catch(() => {});
    await queryInterface.removeColumn('MediaAssets', 'caption').catch(() => {});
    await queryInterface.removeColumn('MediaAssets', 'entityType').catch(() => {});
    await queryInterface.removeColumn('MediaAssets', 'detectedMimeType').catch(() => {});
    await queryInterface.removeColumn('MediaAssets', 'variants').catch(() => {});

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_MediaAssets_entityType";').catch(() => {});
    }
  },
};
