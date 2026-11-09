'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProposalDigestPreferences', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      userId: { type: Sequelize.INTEGER, allowNull: false, unique: true, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      locale: { type: Sequelize.STRING(5), allowNull: false, defaultValue: 'el' },
      enabledAt: { type: Sequelize.DATE, allowNull: true },
      lastSentAt: { type: Sequelize.DATE, allowNull: true },
      unsubscribeTokenHash: { type: Sequelize.STRING(64), allowNull: true, unique: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('ProposalDigestPreferences', ['enabled', 'lastSentAt'], { name: 'proposal_digest_enabled_last_sent_idx' });
  },
  async down(queryInterface) { await queryInterface.dropTable('ProposalDigestPreferences'); },
};
