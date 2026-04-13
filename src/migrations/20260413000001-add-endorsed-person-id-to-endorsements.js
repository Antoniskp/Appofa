'use strict';

/**
 * Adds endorsedPersonId (FK → PublicPersonProfiles) to Endorsements.
 *
 * With this column, endorsements on unclaimed/pending person profiles are stored
 * using endorsedPersonId instead of endorsedId (which targets real Users).
 * Exactly one of endorsedId / endorsedPersonId must be non-null (enforced in
 * the service layer).
 *
 * The old unique index (endorserId, endorsedId, topic) is replaced with a new
 * composite index (endorserId, endorsedId, endorsedPersonId, topic) so that
 * uniqueness is maintained for both user-endorsements and person-endorsements.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('Endorsements')) return;

    const columns = await queryInterface.describeTable('Endorsements');

    // 1. Make endorsedId nullable (placeholder users no longer used)
    if (columns.endorsedId) {
      await queryInterface.changeColumn('Endorsements', 'endorsedId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      });
    }

    // 2. Add endorsedPersonId column
    if (!columns.endorsedPersonId) {
      await queryInterface.addColumn('Endorsements', 'endorsedPersonId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'CASCADE',
      });
    }

    // 3. Drop old unique index and create new composite one
    const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';
    try {
      if (isPostgres) {
        await queryInterface.sequelize.query(
          'DROP INDEX IF EXISTS endorsements_unique_endorser_endorsed_topic'
        );
      } else {
        await queryInterface.removeIndex('Endorsements', 'endorsements_unique_endorser_endorsed_topic');
      }
    } catch {
      // Index may not exist yet; safe to continue
    }

    try {
      await queryInterface.addIndex('Endorsements', ['endorserId', 'endorsedId', 'endorsedPersonId', 'topic'], {
        unique: true,
        name: 'endorsements_unique_endorser_endorsed_person_topic',
      });
    } catch {
      // Index may already exist
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('Endorsements')) return;

    const columns = await queryInterface.describeTable('Endorsements');

    // Remove new index
    try {
      await queryInterface.removeIndex('Endorsements', 'endorsements_unique_endorser_endorsed_person_topic');
    } catch {
      // Ignore
    }

    // Restore old unique index
    try {
      await queryInterface.addIndex('Endorsements', ['endorserId', 'endorsedId', 'topic'], {
        unique: true,
        name: 'endorsements_unique_endorser_endorsed_topic',
      });
    } catch {
      // Ignore
    }

    // Remove endorsedPersonId
    if (columns.endorsedPersonId) {
      await queryInterface.removeColumn('Endorsements', 'endorsedPersonId');
    }

    // Restore endorsedId as NOT NULL
    if (columns.endorsedId) {
      await queryInterface.changeColumn('Endorsements', 'endorsedId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      });
    }
  },
};
