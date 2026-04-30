'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserLocationRoles', {
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
        comment: 'Platform role key, e.g. "moderator"',
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

    await queryInterface.addIndex('UserLocationRoles', ['userId', 'locationId', 'roleKey'], {
      unique: true,
      name: 'idx_user_location_roles_unique',
    });

    await queryInterface.addIndex('UserLocationRoles', ['userId'], {
      name: 'idx_user_location_roles_user_id',
    });

    await queryInterface.addIndex('UserLocationRoles', ['locationId'], {
      name: 'idx_user_location_roles_location_id',
    });

    await queryInterface.addIndex('UserLocationRoles', ['roleKey'], {
      name: 'idx_user_location_roles_role_key',
    });

    // Data migration: copy existing moderator homeLocationId values into the new table.
    // These users had their moderator scope stored in homeLocationId; migrate those
    // assignments so the new join table reflects them.
    const moderators = await queryInterface.sequelize.query(
      `SELECT id, "homeLocationId" FROM "Users" WHERE role = 'moderator' AND "homeLocationId" IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const now = new Date();
    for (const mod of moderators) {
      await queryInterface.sequelize.query(
        `INSERT INTO "UserLocationRoles" ("userId", "locationId", "roleKey", "createdAt", "updatedAt")
         VALUES (:userId, :locationId, 'moderator', :now, :now)
         ON CONFLICT DO NOTHING`,
        {
          replacements: { userId: mod.id, locationId: mod.homeLocationId, now },
          type: Sequelize.QueryTypes.INSERT,
        }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('UserLocationRoles');
  },
};
