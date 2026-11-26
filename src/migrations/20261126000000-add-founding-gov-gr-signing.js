'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      const options = { transaction };
      await queryInterface.addColumn('FoundingSigningDocuments', 'govGrEnabled',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false }, options);
      await queryInterface.addColumn('FoundingInterests', 'govVerificationCode',
        { type: Sequelize.STRING(64), allowNull: true }, options);
      await queryInterface.addIndex('FoundingInterests', ['govVerificationCode'],
        { name: 'founding_interest_gov_code_unique', unique: true, transaction });
      await queryInterface.addColumn('FoundingSignatures', 'govDocumentFingerprint',
        { type: Sequelize.STRING(64), allowNull: true }, options);
      await queryInterface.addIndex('FoundingSignatures', ['govDocumentFingerprint'],
        { name: 'founding_signature_gov_fingerprint_unique', unique: true, transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      const options = { transaction };
      await queryInterface.removeIndex('FoundingSignatures', 'founding_signature_gov_fingerprint_unique', options);
      await queryInterface.removeIndex('FoundingInterests', 'founding_interest_gov_code_unique', options);
      await queryInterface.removeColumn('FoundingSignatures', 'govDocumentFingerprint', options);
      await queryInterface.removeColumn('FoundingInterests', 'govVerificationCode', options);
      await queryInterface.removeColumn('FoundingSigningDocuments', 'govGrEnabled', options);
    });
  },
};
