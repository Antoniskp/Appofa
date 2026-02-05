'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('Locations'));
    
    if (tableExists) {
      console.log('Locations table already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('Locations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Official name of the location'
      },
      name_local: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Local language name of the location'
      },
      type: {
        type: Sequelize.ENUM('international', 'country', 'prefecture', 'municipality'),
        allowNull: false
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Locations',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'Parent location ID for hierarchical structure'
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
        comment: 'ISO or official code (e.g., ISO country code, GADM code)'
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'URL-friendly identifier'
      },
      lat: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
        comment: 'Latitude coordinate'
      },
      lng: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
        comment: 'Longitude coordinate'
      },
      bounding_box: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional bounding box for map display: {north, south, east, west}'
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
    await queryInterface.addIndex('Locations', ['parent_id'], {
      name: 'location_parent_index'
    });

    await queryInterface.addIndex('Locations', ['code'], {
      name: 'location_code_index'
    });

    await queryInterface.addIndex('Locations', ['slug'], {
      name: 'location_slug_index'
    });

    // Add unique constraint on (type, name, parent_id)
    await queryInterface.addIndex('Locations', ['type', 'name', 'parent_id'], {
      unique: true,
      name: 'unique_location_name_per_parent'
    });

    // Apply column comment for type enum (done separately to avoid Sequelize bug #17894)
    try {
      await queryInterface.sequelize.query(`
        COMMENT ON COLUMN "Locations"."type" IS 'Hierarchical level of the location';
      `);
    } catch (error) {
      console.warn('Warning: Could not apply type column comment:', error.message);
    }

    console.log('Locations table created successfully');
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    try {
      await queryInterface.removeIndex('Locations', 'unique_location_name_per_parent');
    } catch (error) {
      console.warn('Index unique_location_name_per_parent does not exist');
    }

    try {
      await queryInterface.removeIndex('Locations', 'location_slug_index');
    } catch (error) {
      console.warn('Index location_slug_index does not exist');
    }

    try {
      await queryInterface.removeIndex('Locations', 'location_code_index');
    } catch (error) {
      console.warn('Index location_code_index does not exist');
    }

    try {
      await queryInterface.removeIndex('Locations', 'location_parent_index');
    } catch (error) {
      console.warn('Index location_parent_index does not exist');
    }

    // Drop enum type first before dropping table
    await queryInterface.dropTable('Locations');
    
    // Drop the enum type
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Locations_type";');
    } catch (error) {
      console.warn('Warning: Could not drop enum type:', error.message);
    }

    console.log('Locations table dropped successfully');
  }
};
