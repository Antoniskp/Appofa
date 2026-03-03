'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const describeOrNull = async (tableName) => {
      try {
        return await queryInterface.describeTable(tableName);
      } catch {
        return null;
      }
    };

    const articleTable = await describeOrNull('Articles');
    const pollTable = await describeOrNull('Polls');
    const userTable = await describeOrNull('Users');

    if (articleTable) {
      if (!articleTable.commentsEnabled) {
        await queryInterface.addColumn('Articles', 'commentsEnabled', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        });
      }
      if (!articleTable.commentsLocked) {
        await queryInterface.addColumn('Articles', 'commentsLocked', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        });
      }
    }

    if (pollTable) {
      if (!pollTable.commentsEnabled) {
        await queryInterface.addColumn('Polls', 'commentsEnabled', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        });
      }
      if (!pollTable.commentsLocked) {
        await queryInterface.addColumn('Polls', 'commentsLocked', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        });
      }
    }

    if (userTable) {
      if (!userTable.profileCommentsEnabled) {
        await queryInterface.addColumn('Users', 'profileCommentsEnabled', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        });
      }
      if (!userTable.profileCommentsLocked) {
        await queryInterface.addColumn('Users', 'profileCommentsLocked', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        });
      }
    }
  },

  async down(queryInterface) {
    const describeOrNull = async (tableName) => {
      try {
        return await queryInterface.describeTable(tableName);
      } catch {
        return null;
      }
    };

    const articleTable = await describeOrNull('Articles');
    const pollTable = await describeOrNull('Polls');
    const userTable = await describeOrNull('Users');

    if (articleTable?.commentsEnabled) {
      await queryInterface.removeColumn('Articles', 'commentsEnabled');
    }
    if (articleTable?.commentsLocked) {
      await queryInterface.removeColumn('Articles', 'commentsLocked');
    }
    if (pollTable?.commentsEnabled) {
      await queryInterface.removeColumn('Polls', 'commentsEnabled');
    }
    if (pollTable?.commentsLocked) {
      await queryInterface.removeColumn('Polls', 'commentsLocked');
    }
    if (userTable?.profileCommentsEnabled) {
      await queryInterface.removeColumn('Users', 'profileCommentsEnabled');
    }
    if (userTable?.profileCommentsLocked) {
      await queryInterface.removeColumn('Users', 'profileCommentsLocked');
    }
  }
};
