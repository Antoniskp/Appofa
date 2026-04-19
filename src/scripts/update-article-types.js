/**
 * Deprecated migration helper.
 * `Articles.isNews` has been removed; article type is now source-of-truth.
 */

const { sequelize } = require('../models');
require('dotenv').config();

const updateArticleTypes = async () => {
  try {
    console.log('This script is deprecated and no longer performs any updates.');
    console.log('Reason: Articles.isNews was removed; article type now fully drives news behavior.');
    await sequelize.authenticate();
    console.log('No action taken.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
};

updateArticleTypes();
