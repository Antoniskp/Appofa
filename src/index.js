const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { helmetConfig, corsOptions } = require('./config/securityHeaders');
const { sequelize } = require('./models');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');
const adminRoutes = require('./routes/adminRoutes');
const locationRoutes = require('./routes/locationRoutes');
const pollRoutes = require('./routes/pollRoutes');

const app = express();

// Trust nginx proxy headers for proper rate limiting and security
// Enables Express to read X-Forwarded-For, X-Forwarded-Proto, X-Forwarded-Host
app.set('trust proxy', true);

const PORT = process.env.PORT || 3000;
const isProductionEnv = () => process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'News Application API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      articles: '/api/articles',
      locations: '/api/locations',
      polls: '/api/polls'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/polls', pollRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database sync and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    if (!isProductionEnv()) {
      // Sync database models in non-production environments
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized.');
      
      // Apply column comments separately to avoid Sequelize bug #17894
      // (ENUM + comment causes invalid USING clause in COMMENT statement)
      try {
        await sequelize.query(`
          COMMENT ON COLUMN "${sequelize.models.Location.tableName}"."type" IS 'Hierarchical level of the location';
        `);
        await sequelize.query(`
          COMMENT ON COLUMN "${sequelize.models.LocationLink.tableName}"."entity_type" IS 'Type of entity linked to location';
        `);
        console.log('Column comments applied successfully.');
      } catch (error) {
        // Ignore errors if columns don't exist yet (first run)
        if (error?.message && !error.message.includes('does not exist')) {
          console.warn('Warning: Could not apply column comments:', error.message);
        }
      }
    } else {
      console.log('Skipping Sequelize sync in production. Run migrations before starting the server.');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
module.exports.shouldSyncSchema = () => !isProductionEnv();
