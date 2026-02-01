/**
 * Migration script to update existing articles with the new type field
 * This script updates articles to have proper type values based on their isNews field
 */

const { sequelize, Article } = require('./models');
require('dotenv').config();

const updateArticleTypes = async () => {
  try {
    console.log('Starting article type migration...');
    
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync database models (alter tables to add new fields)
    await sequelize.sync({ alter: true });
    console.log('Database schema updated.');

    // Update articles based on isNews field
    const articles = await Article.findAll();
    console.log(`Found ${articles.length} articles to process.`);

    let updated = 0;
    for (const article of articles) {
      // If the article doesn't have a type yet, set it based on isNews
      if (!article.type) {
        article.type = article.isNews ? 'news' : 'personal';
        await article.save();
        updated++;
      }
    }

    console.log(`✓ Updated ${updated} articles with type field.`);
    console.log('Migration completed successfully!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

updateArticleTypes();
