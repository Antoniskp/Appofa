'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FoundingInterests', {
      userId: {
        type: Sequelize.INTEGER, allowNull: false, primaryKey: true,
        references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE',
      },
      wantsToSign: { type: Sequelize.BOOLEAN, allowNull: false },
      wantsToVolunteer: { type: Sequelize.BOOLEAN, allowNull: false },
      signingStatus: { type: Sequelize.STRING(12), allowNull: false, defaultValue: 'requested' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('FoundingInterests');
  },
};
