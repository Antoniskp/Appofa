'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LocationElectionVotes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      roleKey: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      voterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      candidateUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
    });

    await queryInterface.addIndex('LocationElectionVotes', ['locationId', 'roleKey', 'voterId'], {
      unique: true,
      name: 'uq_location_election_vote',
    });
    await queryInterface.addIndex('LocationElectionVotes', ['locationId', 'roleKey']);
    await queryInterface.addIndex('LocationElectionVotes', ['candidateUserId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('LocationElectionVotes');
  },
};
