'use strict';

const SOURCE_TYPES = ['parliament', 'european_commission', 'municipal_council', 'regional_council', 'other'];
const QUESTION_STATUSES = ['open', 'closed', 'archived'];
const VISIBILITIES = ['public', 'private', 'locals_only'];
const VOTE_RESTRICTIONS = ['authenticated', 'locals_only'];
const RESULTS_VISIBILITIES = ['always', 'after_vote', 'after_deadline'];
const VOTE_CHOICES = ['agree', 'disagree', 'present'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => (typeof table === 'string' ? table : table.tableName || table.name));

    if (!tableNames.includes('CivicQuestions')) {
      await queryInterface.createTable('CivicQuestions', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        originalLink: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        sourceType: {
          type: dialect === 'postgres' ? Sequelize.ENUM(...SOURCE_TYPES) : Sequelize.STRING,
          allowNull: false,
          defaultValue: 'other',
        },
        sourceName: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        simplified: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        pros: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        cons: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        dateAsked: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        deadline: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        status: {
          type: dialect === 'postgres' ? Sequelize.ENUM(...QUESTION_STATUSES) : Sequelize.STRING,
          allowNull: false,
          defaultValue: 'open',
        },
        locationId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'Locations', key: 'id' },
          onDelete: 'SET NULL',
        },
        creatorId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
        },
        visibility: {
          type: dialect === 'postgres' ? Sequelize.ENUM(...VISIBILITIES) : Sequelize.STRING,
          allowNull: false,
          defaultValue: 'public',
        },
        voteRestriction: {
          type: dialect === 'postgres' ? Sequelize.ENUM(...VOTE_RESTRICTIONS) : Sequelize.STRING,
          allowNull: false,
          defaultValue: 'authenticated',
        },
        resultsVisibility: {
          type: dialect === 'postgres' ? Sequelize.ENUM(...RESULTS_VISIBILITIES) : Sequelize.STRING,
          allowNull: false,
          defaultValue: 'always',
        },
        category: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        officialIdentifier: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        commentsEnabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        commentsLocked: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });

      await queryInterface.addIndex('CivicQuestions', ['creatorId']);
      await queryInterface.addIndex('CivicQuestions', ['locationId']);
      await queryInterface.addIndex('CivicQuestions', ['status']);
      await queryInterface.addIndex('CivicQuestions', ['sourceType']);
      await queryInterface.addIndex('CivicQuestions', ['createdAt']);
    }

    if (!tableNames.includes('CivicQuestionVotes')) {
      await queryInterface.createTable('CivicQuestionVotes', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        civicQuestionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'CivicQuestions', key: 'id' },
          onDelete: 'CASCADE',
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
        },
        choice: {
          type: dialect === 'postgres' ? Sequelize.ENUM(...VOTE_CHOICES) : Sequelize.STRING,
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });

      await queryInterface.addIndex('CivicQuestionVotes', ['civicQuestionId', 'userId'], {
        unique: true,
        name: 'unique_user_vote_per_civic_question',
      });
      await queryInterface.addIndex('CivicQuestionVotes', ['civicQuestionId']);
      await queryInterface.addIndex('CivicQuestionVotes', ['userId']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('CivicQuestionVotes').catch(() => {});
    await queryInterface.dropTable('CivicQuestions').catch(() => {});

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CivicQuestionVotes_choice";').catch(() => {});
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CivicQuestions_sourceType";').catch(() => {});
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CivicQuestions_status";').catch(() => {});
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CivicQuestions_visibility";').catch(() => {});
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CivicQuestions_voteRestriction";').catch(() => {});
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CivicQuestions_resultsVisibility";').catch(() => {});
    }
  },
};
