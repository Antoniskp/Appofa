'use strict';

// Frozen schema: do not import live model definitions into this migration.
module.exports = {
  async up(queryInterface, S) {
    const fk = (model, nullable = false) => ({
  type: S.INTEGER, allowNull: nullable, references: { model, key: 'id' },
  onDelete: nullable ? 'SET NULL' : 'RESTRICT', onUpdate: 'CASCADE',
});
const choice = (values, defaultValue) => ({
  type: S.STRING(24), allowNull: false, defaultValue, validate: { isIn: [values] },
});
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable('PolicyCategories', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: S.STRING(120), allowNull: false },
        slug: { type: S.STRING(140), allowNull: false },
        description: { type: S.TEXT, allowNull: true },
        createdAt: { type: S.DATE, allowNull: false },
        updatedAt: { type: S.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addIndex('PolicyCategories', ["slug"], { unique: true, transaction });
      await queryInterface.createTable('OrganizationPositions', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
        organizationId: fk('Organizations'),
        categoryId: fk('PolicyCategories'),
        locationId: fk('Locations', true),
        suggestionId: fk('Suggestions', true),
        createdByUserId: fk('Users', true),
        status: choice(['active', 'withdrawn', 'archived'], 'active'),
        createdAt: { type: S.DATE, allowNull: false },
        updatedAt: { type: S.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addIndex('OrganizationPositions', ["organizationId","status"], { transaction });
      await queryInterface.addIndex('OrganizationPositions', ["categoryId"], { transaction });
      await queryInterface.createTable('PositionRevisions', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
        positionId: fk('OrganizationPositions'),
        version: { type: S.INTEGER, allowNull: false, validate: { min: 1 } },
        title: { type: S.STRING(200), allowNull: false, validate: { len: [5, 200] } },
        body: { type: S.TEXT, allowNull: false, validate: { notEmpty: true } },
        attribution: choice(['sourced', 'official', 'community'], 'sourced'),
        status: choice(['draft', 'in_review', 'published', 'superseded', 'rejected'], 'draft'),
        createdByUserId: fk('Users', true),
        reviewedByUserId: fk('Users', true),
        reviewedAt: { type: S.DATE, allowNull: true },
        publishedAt: { type: S.DATE, allowNull: true },
        reviewNote: { type: S.TEXT, allowNull: true },
        createdAt: { type: S.DATE, allowNull: false },
        updatedAt: { type: S.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.createTable('PositionTopics', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
        positionId: fk('OrganizationPositions'),
        topicId: fk('Topics'),
        createdAt: { type: S.DATE, allowNull: false },
        updatedAt: { type: S.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addIndex('PositionTopics', ["positionId","topicId"], { unique: true, transaction });
      await queryInterface.addIndex('PositionTopics', ["topicId"], { transaction });
      await queryInterface.createTable('PositionSources', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
        revisionId: fk('PositionRevisions'),
        provider: { type: S.STRING(80), allowNull: false },
        sourceUrl: { type: S.STRING(2048), allowNull: false, validate: { isUrl: true } },
        originalSourceUrl: { type: S.STRING(2048), allowNull: true, validate: { isUrl: true } },
        externalId: { type: S.STRING(255), allowNull: true },
        originalTopic: { type: S.STRING(255), allowNull: true },
        sourcePublishedAt: { type: S.DATE, allowNull: true },
        retrievedAt: { type: S.DATE, allowNull: false },
        contentFingerprint: { type: S.STRING(64), allowNull: false },
        reviewStatus: choice(['pending', 'verified', 'rejected'], 'pending'),
        createdAt: { type: S.DATE, allowNull: false },
        updatedAt: { type: S.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addIndex('PositionSources', ["revisionId","provider","contentFingerprint"], { unique: true, transaction });
      await queryInterface.addIndex('PositionSources', ["provider","externalId"], { transaction });
      await queryInterface.createTable('PositionVotes', {
        id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
        revisionId: fk('PositionRevisions'),
        userId: fk('Users'),
        value: { type: S.SMALLINT, allowNull: false, validate: { isIn: [[-1, 1]] } },
        identityVisibility: choice(['anonymous', 'public'], 'anonymous'),
        createdAt: { type: S.DATE, allowNull: false },
        updatedAt: { type: S.DATE, allowNull: false },
      }, { transaction });
      await queryInterface.addConstraint('PositionVotes', {
        fields: ['value'], type: 'check', name: 'position_vote_value_check',
        where: { value: { [S.Op.in]: [-1, 1] } }, transaction,
      });
      await queryInterface.addConstraint('PositionRevisions', {
        fields: ['version'], type: 'check', name: 'position_revision_version_check',
        where: { version: { [S.Op.gte]: 1 } }, transaction,
      });
      // SQLite rebuilds tables when adding checks, so indexes must follow them.
      await queryInterface.addIndex('PositionVotes', ['revisionId', 'userId'], { unique: true, transaction });
      await queryInterface.addIndex('PositionRevisions', ['positionId', 'version'], { unique: true, transaction });
      await queryInterface.addIndex('PositionRevisions', ['positionId', 'status'], { transaction });
      await queryInterface.addIndex('PositionRevisions', ['positionId'], {
        unique: true, where: { status: 'published' }, name: 'position_one_published_revision', transaction,
      });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.dropTable('PositionVotes', { transaction });
      await queryInterface.dropTable('PositionSources', { transaction });
      await queryInterface.dropTable('PositionTopics', { transaction });
      await queryInterface.dropTable('PositionRevisions', { transaction });
      await queryInterface.dropTable('OrganizationPositions', { transaction });
      await queryInterface.dropTable('PolicyCategories', { transaction });
    });
  },
};

