'use strict';

module.exports = {
  async up(queryInterface) {
    if (queryInterface.sequelize.getDialect() !== 'postgres') return;
    const newTypes = ['org_invite_received', 'org_join_approved', 'org_member_removed'];
    for (const val of newTypes) {
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
           ALTER TYPE "enum_Notifications_type" ADD VALUE IF NOT EXISTS '${val}';
         EXCEPTION WHEN duplicate_object THEN NULL;
         END $$;`
      );
    }
  },
  async down() { /* enum removal not safe */ },
};
