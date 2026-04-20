'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Suggestions');

    if (!table.visibility) {
      await queryInterface.addColumn('Suggestions', 'visibility', {
        type: Sequelize.ENUM('public', 'private', 'locals_only'),
        allowNull: false,
        defaultValue: 'public'
      });
    }

    if (!table.voteRestriction) {
      await queryInterface.addColumn('Suggestions', 'voteRestriction', {
        type: Sequelize.ENUM('authenticated', 'locals_only'),
        allowNull: false,
        defaultValue: 'authenticated'
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('Suggestions');

    if (table.voteRestriction) {
      await queryInterface.removeColumn('Suggestions', 'voteRestriction');
    }

    if (table.visibility) {
      await queryInterface.removeColumn('Suggestions', 'visibility');
    }

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Suggestions_voteRestriction";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Suggestions_visibility";');
    }
  }
};
