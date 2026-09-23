function validateProductionConfig(env = process.env) {
  if (env.NODE_ENV !== 'production') return;
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || /your-.*secret|change-this|test.*secret/i.test(env.JWT_SECRET)) {
    throw new Error('Production requires a unique JWT_SECRET of at least 32 characters.');
  }
  if (!env.DB_PASSWORD || env.DB_PASSWORD.length < 16 || /^(password|changeme|your-password)/i.test(env.DB_PASSWORD)) {
    throw new Error('Production requires a unique DB_PASSWORD of at least 16 characters.');
  }
}
module.exports = { validateProductionConfig };
