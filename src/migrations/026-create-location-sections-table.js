'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_LocationSections_type" AS ENUM (
            'official_links',
            'contacts',
            'people',
            'webcams',
            'announcements'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    await queryInterface.createTable('LocationSections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'CASCADE',
        comment: 'Parent location'
      },
      type: {
        type: dialect === 'postgres'
          ? '"enum_LocationSections_type"'
          : Sequelize.ENUM('official_links', 'contacts', 'people', 'webcams', 'announcements'),
        allowNull: false,
        comment: 'Predefined section type'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Optional display title override'
      },
      content: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
        comment: 'Structured JSON content specific to the section type'
      },
      isPublished: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the section is visible to the public'
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Display order within the location page'
      },
      createdByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        comment: 'Moderator/admin who created the section'
      },
      updatedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        comment: 'Moderator/admin who last updated the section'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('LocationSections', ['locationId', 'sortOrder'], {
      name: 'location_sections_location_order_idx'
    });
    await queryInterface.addIndex('LocationSections', ['locationId', 'isPublished'], {
      name: 'location_sections_location_published_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('LocationSections');
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_LocationSections_type";'
      );
    }
  }
};
