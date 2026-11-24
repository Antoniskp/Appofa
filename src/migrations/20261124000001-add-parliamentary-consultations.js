'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Users', 'parliamentaryPublisherName', {
        type: Sequelize.STRING(200), allowNull: true,
      }, { transaction });
      await queryInterface.addColumn('CivicQuestions', 'parliamentaryConsultation', {
        type: Sequelize.JSON, allowNull: true,
      }, { transaction });
      await queryInterface.createTable('ConsultationEvaluations', {
        civicQuestionId: {
          type: Sequelize.INTEGER, primaryKey: true, allowNull: false,
          references: { model: 'CivicQuestions', key: 'id' }, onDelete: 'CASCADE',
        },
        userId: {
          type: Sequelize.INTEGER, primaryKey: true, allowNull: false,
          references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE',
        },
        choice: { type: Sequelize.STRING(20), allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      }, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('ConsultationEvaluations', { transaction });
      // Native DROP COLUMN avoids rebuilding tables referenced by foreign keys in SQLite.
      await queryInterface.sequelize.query('ALTER TABLE "CivicQuestions" DROP COLUMN "parliamentaryConsultation"', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE "Users" DROP COLUMN "parliamentaryPublisherName"', { transaction });
    });
  },
};
