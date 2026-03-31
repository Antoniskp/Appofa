'use strict';

// This migration previously seeded hardcoded AI suggestions by free-text name.
// Replaced by no-op: suggestions must be created via the admin UI using
// PublicPersonProfile records, per the new data-driven architecture.

module.exports = {
  async up() {},
  async down() {},
};
