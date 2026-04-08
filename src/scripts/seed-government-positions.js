const path = require('path');
const { sequelize, GovernmentPosition } = require('../models');
require('dotenv').config();

const { allPositions } = require(
  path.join(__dirname, '../../config/countries/index.js')
);

const seedGovernmentPositions = async () => {
  try {
    console.log('Starting government positions seeding...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    let created = 0;
    let skipped = 0;
    for (const pos of allPositions) {
      const [, wasCreated] = await GovernmentPosition.findOrCreate({
        where: { slug: pos.slug },
        defaults: {
          slug: pos.slug,
          title: pos.title,
          titleEn: pos.titleEn || null,
          positionTypeKey: pos.positionTypeKey,
          scope: pos.scope || 'national',
          countryCode: pos.countryCode || 'GR',
          chamberKey: pos.chamberKey || null,
          description: null,
          order: pos.order,
          isActive: true,
        },
      });
      if (wasCreated) {
        console.log(`✓ Created [${pos.countryCode}]: ${pos.title}`);
        created++;
      } else {
        console.log(`- Already exists [${pos.countryCode}]: ${pos.title}`);
        skipped++;
      }
    }

    console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding government positions:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedGovernmentPositions();
