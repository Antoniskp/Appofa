'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, STRING, DATE } = Sequelize;
    await queryInterface.sequelize.transaction(async transaction => {
      const options = { transaction };
      const timestamps = {
        createdAt: { type: DATE, allowNull: false },
        updatedAt: { type: DATE, allowNull: false },
      };
      const userReference = { type: INTEGER, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' };
      await queryInterface.addColumn('FoundingInterests', 'contactPhone', { type: STRING(32), allowNull: true }, options);
      await queryInterface.createTable('FoundingSigningDocuments', {
        id: { type: INTEGER, primaryKey: true },
        version: { type: STRING(100), allowNull: false },
        pdfUrl: { type: STRING(500), allowNull: false },
        sha256: { type: STRING(64), allowNull: false },
        ...timestamps,
      }, options);
      await queryInterface.createTable('FoundingSignatures', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        userId: { ...userReference, unique: true },
        legalName: { type: STRING(160), allowNull: false },
        recordReference: { type: STRING(80), unique: true, allowNull: false },
        verifiedByUserId: userReference,
        publicName: { type: STRING(100), allowNull: true },
        ...timestamps,
      }, options);
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      const options = { transaction };
      await queryInterface.dropTable('FoundingSignatures', options);
      await queryInterface.dropTable('FoundingSigningDocuments', options);
      await queryInterface.removeColumn('FoundingInterests', 'contactPhone', options);
    });
  },
};
