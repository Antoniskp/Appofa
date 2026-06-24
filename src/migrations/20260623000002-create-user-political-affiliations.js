'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.createTable('UserPoliticalAffiliations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      organizationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Organizations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      endorsementLevel: {
        type: dialect === 'postgres'
          ? Sequelize.ENUM('active', 'passive', 'neutral')
          : Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'neutral',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('UserPoliticalAffiliations', ['userId', 'organizationId'], {
      unique: true,
      name: 'idx_user_political_affil_unique',
    });
    await queryInterface.addIndex('UserPoliticalAffiliations', ['userId'], {
      name: 'idx_user_political_affil_user_id',
    });
    await queryInterface.addIndex('UserPoliticalAffiliations', ['organizationId'], {
      name: 'idx_user_political_affil_org_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('UserPoliticalAffiliations');
  },
};
