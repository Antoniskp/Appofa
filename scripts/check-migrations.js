'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_MIGRATIONS_DIR = path.join(__dirname, '..', 'src', 'migrations');
const TIMESTAMP_PREFIX_REGEX = /^\d{14}-/;
const LEGACY_PREFIX_REGEX = /^\d{3}-/;
const LEGACY_DUPLICATE_PREFIXES = new Set(['029', '032', '033', '20260402000000', '20260425000000']);

const getMigrationPrefix = (filename) => filename.split('-')[0];

const getMigrationFilenameReport = (files) => {
  const jsFiles = files.filter((file) => file.endsWith('.js')).sort();
  const prefixCounts = new Map();
  const invalidNames = [];

  jsFiles.forEach((file) => {
    const prefix = getMigrationPrefix(file);
    prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);

    if (!TIMESTAMP_PREFIX_REGEX.test(file) && !LEGACY_PREFIX_REGEX.test(file)) {
      invalidNames.push(file);
    }
  });

  const duplicatePrefixes = Array.from(prefixCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([prefix]) => prefix)
    .filter((prefix) => !LEGACY_DUPLICATE_PREFIXES.has(prefix));

  const nonTimestampNewNames = jsFiles.filter((file) => (
    !TIMESTAMP_PREFIX_REGEX.test(file) && !LEGACY_PREFIX_REGEX.test(file)
  ));

  return {
    total: jsFiles.length,
    invalidNames,
    duplicatePrefixes,
    nonTimestampNewNames,
    ok: invalidNames.length === 0 && duplicatePrefixes.length === 0 && nonTimestampNewNames.length === 0,
  };
};

const checkMigrations = (migrationsDir = DEFAULT_MIGRATIONS_DIR) => {
  const files = fs.readdirSync(migrationsDir);
  return getMigrationFilenameReport(files);
};

const printReport = (report) => {
  if (report.ok) {
    console.log(`Migration filename check passed (${report.total} files).`);
    return;
  }

  console.error('Migration filename check failed.');
  if (report.invalidNames.length) {
    console.error(`Invalid names: ${report.invalidNames.join(', ')}`);
  }
  if (report.duplicatePrefixes.length) {
    console.error(`Duplicate prefixes: ${report.duplicatePrefixes.join(', ')}`);
  }
  if (report.nonTimestampNewNames.length) {
    console.error(`New migrations must use YYYYMMDDHHMMSS-name.js: ${report.nonTimestampNewNames.join(', ')}`);
  }
};

if (require.main === module) {
  const report = checkMigrations(process.argv[2] || DEFAULT_MIGRATIONS_DIR);
  printReport(report);
  process.exit(report.ok ? 0 : 1);
}

module.exports = {
  getMigrationFilenameReport,
  checkMigrations,
};
