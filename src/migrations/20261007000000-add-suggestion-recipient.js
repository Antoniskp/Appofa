'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Suggestions');
    if (!columns.recipientKey) await queryInterface.addColumn('Suggestions', 'recipientKey', { type: Sequelize.STRING(80), allowNull: true });
    if (!columns.recipient) await queryInterface.addColumn('Suggestions', 'recipient', { type: Sequelize.JSON, allowNull: true });
    const indexes = await queryInterface.showIndex('Suggestions');
    if (!indexes.some(index => index.name === 'suggestions_recipient_key_idx')) {
      await queryInterface.addIndex('Suggestions', ['recipientKey'], { name: 'suggestions_recipient_key_idx' });
    }
  },
  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('Suggestions');
    if (indexes.some(index => index.name === 'suggestions_recipient_key_idx')) await queryInterface.removeIndex('Suggestions', 'suggestions_recipient_key_idx');
    const columns = await queryInterface.describeTable('Suggestions');
    if (columns.recipient) await queryInterface.removeColumn('Suggestions', 'recipient');
    if (columns.recipientKey) await queryInterface.removeColumn('Suggestions', 'recipientKey');
  },
};
