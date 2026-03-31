'use strict';

// This migration previously seeded hardcoded current government holders by name.
// Replaced by no-op: current holders must be created via the admin UI using
// PublicPersonProfile records, per the new data-driven architecture.

module.exports = {
  async up() {},
  async down() {},
};
