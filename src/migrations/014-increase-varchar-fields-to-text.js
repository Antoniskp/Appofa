module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Migration 014: Increasing VARCHAR(255) fields to TEXT for URL/token fields');

      const tableExists = async (tableName) => {
        try {
          await queryInterface.describeTable(tableName);
          return true;
        } catch (error) {
          return false;
        }
      };

      const changeColumnIfTableExists = async (tableName, columnName, columnConfig) => {
        if (!(await tableExists(tableName))) {
          console.log(`  Skipping ${tableName}.${columnName} (table does not exist)`);
          return;
        }
        await queryInterface.changeColumn(tableName, columnName, columnConfig);
      };

      await changeColumnIfTableExists('Users', 'avatar', {
        type: Sequelize.TEXT,
        allowNull: true
      });

      await changeColumnIfTableExists('Articles', 'bannerImageUrl', {
        type: Sequelize.TEXT,
        allowNull: true
      });

      await changeColumnIfTableExists('Images', 'url', {
        type: Sequelize.TEXT,
        allowNull: true
      });

      await changeColumnIfTableExists('Images', 'originalName', {
        type: Sequelize.TEXT,
        allowNull: true
      });

      await changeColumnIfTableExists('PollOptions', 'displayText', {
        type: Sequelize.TEXT,
        allowNull: true
      });

      console.log('✓ Migration 014: All URL/text fields increased to TEXT');
    } catch (error) {
      console.error('Error in migration 014:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableExists = async (tableName) => {
        try {
          await queryInterface.describeTable(tableName);
          return true;
        } catch (error) {
          return false;
        }
      };

      const changeColumnIfTableExists = async (tableName, columnName, columnConfig) => {
        if (!(await tableExists(tableName))) {
          console.log(`  Skipping ${tableName}.${columnName} rollback (table does not exist)`);
          return;
        }
        await queryInterface.changeColumn(tableName, columnName, columnConfig);
      };

      await changeColumnIfTableExists('Users', 'avatar', {
        type: Sequelize.STRING(255),
        allowNull: true
      });

      await changeColumnIfTableExists('Articles', 'bannerImageUrl', {
        type: Sequelize.STRING(255),
        allowNull: true
      });

      await changeColumnIfTableExists('Images', 'url', {
        type: Sequelize.STRING(255),
        allowNull: true
      });

      await changeColumnIfTableExists('Images', 'originalName', {
        type: Sequelize.STRING(255),
        allowNull: true
      });

      await changeColumnIfTableExists('PollOptions', 'displayText', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    } catch (error) {
      console.error('Error rolling back migration 014:', error);
      throw error;
    }
  }
};
