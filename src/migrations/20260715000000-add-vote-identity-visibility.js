'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const pollVotes = await queryInterface.describeTable('PollVotes');
    const suggestionVotes = await queryInterface.describeTable('SuggestionVotes');

    if (!pollVotes.identityVisibility) {
      await queryInterface.addColumn('PollVotes', 'identityVisibility', {
        type: Sequelize.ENUM('anonymous', 'public'),
        allowNull: false,
        defaultValue: 'anonymous'
      });
    }

    if (!suggestionVotes.identityVisibility) {
      await queryInterface.addColumn('SuggestionVotes', 'identityVisibility', {
        type: Sequelize.ENUM('anonymous', 'public'),
        allowNull: false,
        defaultValue: 'anonymous'
      });
    }
  },

  async down(queryInterface) {
    const pollVotes = await queryInterface.describeTable('PollVotes');
    const suggestionVotes = await queryInterface.describeTable('SuggestionVotes');

    if (suggestionVotes.identityVisibility) {
      await queryInterface.removeColumn('SuggestionVotes', 'identityVisibility');
    }

    if (pollVotes.identityVisibility) {
      await queryInterface.removeColumn('PollVotes', 'identityVisibility');
    }

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_SuggestionVotes_identityVisibility";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_PollVotes_identityVisibility";');
    }
  }
};
