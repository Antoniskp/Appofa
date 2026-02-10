module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if userAgent column already exists
      const table = await queryInterface.describeTable('PollVotes');
      if (table.userAgent) {
        console.log('userAgent column already exists in PollVotes table, skipping');
        return;
      }

      // Add userAgent column to PollVotes table
      await queryInterface.addColumn(
        'PollVotes',
        'userAgent',
        {
          type: Sequelize.STRING(500),
          allowNull: true
        }
      );

      // Drop old sessionId index if it exists
      try {
        await queryInterface.removeIndex('PollVotes', 'PollVotes_pollId_sessionId');
      } catch (e) {
        // Index might not exist, continue
      }

      // Add new composite unique index for device fingerprint
      await queryInterface.addConstraint(
        'PollVotes',
        {
          fields: ['pollId', 'ipAddress', 'userAgent'],
          type: 'unique',
          name: 'unique_device_vote_per_poll',
          where: {
            userId: null,
            isAuthenticated: false
          }
        }
      );

      console.log('Migration 013: Added userAgent column and device fingerprint index to PollVotes');
    } catch (error) {
      console.error('Error in migration 013:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove the composite unique constraint
      try {
        await queryInterface.removeConstraint(
          'PollVotes',
          'unique_device_vote_per_poll'
        );
      } catch (e) {
        // Constraint might not exist
      }

      // Remove userAgent column
      await queryInterface.removeColumn('PollVotes', 'userAgent');
    } catch (error) {
      console.error('Error in migration 013 rollback:', error);
      throw error;
    }
  }
};
