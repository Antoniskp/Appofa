'use strict';

const TOPICS = ['Education', 'Economy', 'Health', 'Environment', 'Local Governance', 'Technology'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_Endorsements_topic" AS ENUM (${TOPICS.map((t) => `'${t}'`).join(', ')});
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    await queryInterface.createTable('Endorsements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      endorserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      endorsedId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      topic: {
        type: dialect === 'postgres'
          ? Sequelize.ENUM(...TOPICS)
          : Sequelize.STRING(50),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Unique constraint: one endorsement per endorser+endorsed+topic
    await queryInterface.addIndex('Endorsements', ['endorserId', 'endorsedId', 'topic'], {
      unique: true,
      name: 'endorsements_unique_endorser_endorsed_topic'
    });

    await queryInterface.addIndex('Endorsements', ['endorsedId', 'topic', 'createdAt']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Endorsements');
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Endorsements_topic";');
    }
  }
};
