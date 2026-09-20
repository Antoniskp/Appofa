process.env.NODE_ENV = process.env.NODE_ENV || 'test';
// Never let a developer's .env DB_STORAGE make force-sync tests erase their database.
process.env.DB_STORAGE = process.env.TEST_DB_STORAGE || ':memory:';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
