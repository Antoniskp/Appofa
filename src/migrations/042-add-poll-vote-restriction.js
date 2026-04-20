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
      const dialect = queryInterface.sequelize.getDialect();
      // PostgreSQL requires explicit cast when assigning string literals to an ENUM column
      // inside a CASE expression, otherwise it infers the type as `text` and throws 42804.
      // SQLite does not support this cast syntax.
      const localsOnlyValue = dialect === 'postgres'
        ? '\'locals_only\'::"enum_Polls_voteRestriction"'
        : '\'locals_only\'';
      const anyoneValue = dialect === 'postgres'
        ? '\'anyone\'::"enum_Polls_voteRestriction"'
        : '\'anyone\'';
      const authenticatedValue = dialect === 'postgres'
        ? '\'authenticated\'::"enum_Polls_voteRestriction"'
        : '\'authenticated\'';

      await queryInterface.sequelize.query(`
        UPDATE "Polls"
        SET "voteRestriction" = CASE
          WHEN "visibility" = 'locals_only' THEN ${localsOnlyValue}
          WHEN "allowUnauthenticatedVotes" = true THEN ${anyoneValue}
          ELSE ${authenticatedValue}
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
