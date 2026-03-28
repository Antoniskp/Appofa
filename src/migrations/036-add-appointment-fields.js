'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CandidateProfiles', 'isActiveCandidate', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('CandidateProfiles', 'appointedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('CandidateProfiles', 'appointedByUserId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('CandidateProfiles', 'retiredAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('CandidateProfiles', 'retiredAt');
    await queryInterface.removeColumn('CandidateProfiles', 'appointedByUserId');
    await queryInterface.removeColumn('CandidateProfiles', 'appointedAt');
    await queryInterface.removeColumn('CandidateProfiles', 'isActiveCandidate');
  }
};
