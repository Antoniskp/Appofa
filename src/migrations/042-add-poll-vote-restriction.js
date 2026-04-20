'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Polls');

    if (!table.voteRestriction) {
      await queryInterface.addColumn('Polls', 'voteRestriction', {
        type: Sequelize.ENUM('anyone', 'authenticated', 'locals_only'),
        allowNull: false,
        defaultValue: 'authenticated'
      });
    }

    if (table.allowUnauthenticatedVotes) {
      // PostgreSQL requires explicit cast when assigning string literals to an ENUM column
      // inside a CASE expression, otherwise it infers the type as `text` and throws 42804.
      await queryInterface.sequelize.query(`
        UPDATE "Polls"
        SET "voteRestriction" = CASE
          WHEN "visibility" = 'locals_only' THEN 'locals_only'::"enum_Polls_voteRestriction"
          WHEN "allowUnauthenticatedVotes" = true THEN 'anyone'::"enum_Polls_voteRestriction"
          ELSE 'authenticated'::"enum_Polls_voteRestriction"
        END
      `);

      await queryInterface.removeColumn('Polls', 'allowUnauthenticatedVotes');
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Polls');

    if (!table.allowUnauthenticatedVotes) {
      await queryInterface.addColumn('Polls', 'allowUnauthenticatedVotes', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    if (table.voteRestriction) {
      await queryInterface.sequelize.query(`
        UPDATE "Polls"
        SET "allowUnauthenticatedVotes" = CASE
          WHEN "voteRestriction" = 'anyone' THEN true
          ELSE false
        END
      `);

      await queryInterface.removeColumn('Polls', 'voteRestriction');
    }

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Polls_voteRestriction";');
    }
  }
};
