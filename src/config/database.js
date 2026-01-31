const { Sequelize } = require('sequelize');
require('dotenv').config();

const isTestEnv = process.env.NODE_ENV === 'test';

const sequelize = isTestEnv
  ? new Sequelize({
      dialect: 'sqlite',
      storage: process.env.TEST_DB_STORAGE || ':memory:',
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME || 'newsapp',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'password',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

module.exports = sequelize;
