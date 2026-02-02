const express = require('express');
const router = express.Router();
const { sequelize, User, Article } = require('../models');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { apiLimiter } = require('../middleware/rateLimiter');

const runCheck = async (checkFn) => {
  const start = Date.now();
  try {
    const details = await checkFn();
    return {
      status: 'healthy',
      responseTimeMs: Date.now() - start,
      ...details
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTimeMs: Date.now() - start,
      error: error.message
    };
  }
};

router.get('/health', apiLimiter, authMiddleware, checkRole('admin'), async (req, res) => {
  const startedAt = Date.now();
  const checks = {
    api: {
      status: 'healthy',
      responseTimeMs: 0,
      message: 'API responding'
    }
  };

  checks.database = await runCheck(async () => {
    await sequelize.authenticate();
    return { message: 'Database connection successful' };
  });

  checks.users = await runCheck(async () => {
    const count = await User.count();
    return { count, message: 'Users query successful' };
  });

  checks.articles = await runCheck(async () => {
    const count = await Article.count();
    return { count, message: 'Articles query successful' };
  });

  const hasUnhealthy = Object.values(checks).some((check) => check.status !== 'healthy');
  const status = hasUnhealthy ? 'unhealthy' : 'healthy';

  res.status(hasUnhealthy ? 503 : 200).json({
    success: !hasUnhealthy,
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs: Date.now() - startedAt,
    checks
  });
});

module.exports = router;
