'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('LocationLinks'));
    
    if (tableExists) {
      console.log('LocationLinks table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('LocationLinks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Locations',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'ID of the location'
      },
      entity_type: {
        type: Sequelize.ENUM('article', 'user'),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of the linked entity'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('LocationLinks', ['location_id', 'entity_type', 'entity_id'], {
      unique: true,
      name: 'unique_location_entity_link'
    });

    await queryInterface.addIndex('LocationLinks', ['entity_type', 'entity_id'], {
      name: 'entity_index'
    });

    await queryInterface.addIndex('LocationLinks', ['location_id'], {
      name: 'location_index'
    });

    // Apply column comment for entity_type enum (done separately to avoid Sequelize bug #17894)
    try {
      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN "LocationLinks"."entity_type" IS 'Type of entity linked to location';
      `);
    } catch (error) {
      console.warn('Warning: Could not apply entity_type column comment:', error.message);
    }

    console.log('LocationLinks table created successfully');
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    try {
      await queryInterface.removeIndex('LocationLinks', 'location_index');
    } catch (error) {
      console.warn('Index location_index does not exist');
    }

    try {
      await queryInterface.removeIndex('LocationLinks', 'entity_index');
    } catch (error) {
      console.warn('Index entity_index does not exist');
    }

    try {
      await queryInterface.removeIndex('LocationLinks', 'unique_location_entity_link');
    } catch (error) {
      console.warn('Index unique_location_entity_link does not exist');
    }

    // Drop table
    await queryInterface.dropTable('LocationLinks');
    
    // Drop the enum type
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_LocationLinks_entity_type";');
    } catch (error) {
      console.warn('Warning: Could not drop enum type:', error.message);
    }

    console.log('LocationLinks table dropped successfully');
  }
};
