'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LocationRoles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      roleKey: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Predefined role key, e.g. "mayor", "regional_governor"',
      },
      personId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PublicPersonProfiles', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex('LocationRoles', ['locationId', 'roleKey'], {
      unique: true,
      name: 'idx_location_roles_unique',
    });

    await queryInterface.addIndex('LocationRoles', ['locationId'], {
      name: 'idx_location_roles_location_id',
    });

    await queryInterface.addIndex('LocationRoles', ['personId'], {
      name: 'idx_location_roles_person_id',
    });

    await queryInterface.addIndex('LocationRoles', ['userId'], {
      name: 'idx_location_roles_user_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('LocationRoles');
  },
};
