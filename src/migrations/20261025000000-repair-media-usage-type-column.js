'use strict';

// A partially completed enum replacement can leave the column attached to
// enum_MediaAssets_usageType_old even though the current enum already exists.
module.exports = {
  async up(queryInterface) {
    if (queryInterface.sequelize.getDialect() !== 'postgres') return;

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query("SET LOCAL lock_timeout = '5s'", { transaction });
      await queryInterface.sequelize.query("SET LOCAL statement_timeout = '30s'", { transaction });
      // Keep the enum itself intact: other columns may still reference it.
      await queryInterface.sequelize.query(`
        ALTER TABLE "MediaAssets" ALTER COLUMN "usageType" DROP DEFAULT;
        ALTER TABLE "MediaAssets" ALTER COLUMN "usageType"
          TYPE "enum_MediaAssets_usageType"
          USING (CASE WHEN "usageType"::text = 'article_banner'
            THEN 'article_cover' ELSE "usageType"::text END)::"enum_MediaAssets_usageType";
        ALTER TABLE "MediaAssets" ALTER COLUMN "usageType" SET DEFAULT 'shared';
      `, { transaction });
    });
  },

  async down() {
    // Preserve new article_cover/avatar values; reverting the legacy type
    // would make valid media records unreadable or require deleting data.
  },
};
