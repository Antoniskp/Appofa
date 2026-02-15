const request = require('supertest');
const express = require('express');

// Mock express-rate-limit before requiring rateLimiter
jest.mock('express-rate-limit', () => {
  return jest.fn((config) => {
    // Create a middleware that stores the config for inspection
    const middleware = (req, res, next) => {
      middleware.config = config;
      next();
    };
    middleware.config = config;
    return middleware;
  });
});

describe('Rate Limiter Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;
    // Clear the module cache to allow re-requiring with different NODE_ENV
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  describe('Production Environment', () => {
    it('should use strict rate limits in production', () => {
      process.env.NODE_ENV = 'production';
      const { apiLimiter, authLimiter, createLimiter } = require('../src/middleware/rateLimiter');

      expect(apiLimiter.config.max).toBe(100);
      expect(authLimiter.config.max).toBe(5);
      expect(createLimiter.config.max).toBe(20);
    });
  });

  describe('Development Environment', () => {
    it('should use relaxed rate limits in development', () => {
      process.env.NODE_ENV = 'development';
      const { apiLimiter, authLimiter, createLimiter } = require('../src/middleware/rateLimiter');

      expect(apiLimiter.config.max).toBe(1000);
      expect(authLimiter.config.max).toBe(100);
      expect(createLimiter.config.max).toBe(200);
    });

    it('should use relaxed rate limits when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      const { apiLimiter, authLimiter, createLimiter } = require('../src/middleware/rateLimiter');

      expect(apiLimiter.config.max).toBe(1000);
      expect(authLimiter.config.max).toBe(100);
      expect(createLimiter.config.max).toBe(200);
    });
  });

  describe('Test Environment', () => {
    it('should skip rate limiting in test environment', () => {
      process.env.NODE_ENV = 'test';
      const { apiLimiter, authLimiter, createLimiter } = require('../src/middleware/rateLimiter');

      // All limiters should have skip function that returns true for test env
      expect(apiLimiter.config.skip()).toBe(true);
      expect(authLimiter.config.skip()).toBe(true);
      expect(createLimiter.config.skip()).toBe(true);
    });
  });

  describe('Rate Limiter Configuration', () => {
    it('should configure apiLimiter with correct window and messages', () => {
      process.env.NODE_ENV = 'production';
      const { apiLimiter } = require('../src/middleware/rateLimiter');

      expect(apiLimiter.config.windowMs).toBe(15 * 60 * 1000);
      expect(apiLimiter.config.message).toEqual({
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      });
      expect(apiLimiter.config.standardHeaders).toBe(true);
      expect(apiLimiter.config.legacyHeaders).toBe(false);
    });

    it('should configure authLimiter with skipSuccessfulRequests', () => {
      process.env.NODE_ENV = 'production';
      const { authLimiter } = require('../src/middleware/rateLimiter');

      expect(authLimiter.config.windowMs).toBe(15 * 60 * 1000);
      expect(authLimiter.config.skipSuccessfulRequests).toBe(true);
      expect(authLimiter.config.message).toEqual({
        success: false,
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
      });
    });

    it('should configure createLimiter with correct settings', () => {
      process.env.NODE_ENV = 'production';
      const { createLimiter } = require('../src/middleware/rateLimiter');

      expect(createLimiter.config.windowMs).toBe(15 * 60 * 1000);
      expect(createLimiter.config.message).toEqual({
        success: false,
        message: 'Too many create requests from this IP, please try again later.'
      });
    });
  });
});
