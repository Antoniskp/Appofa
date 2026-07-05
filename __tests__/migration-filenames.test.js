const { getMigrationFilenameReport, checkMigrations } = require('../scripts/check-migrations');

describe('migration filename hygiene', () => {
  it('passes for the current migrations directory', () => {
    expect(checkMigrations().ok).toBe(true);
  });

  it('allows existing legacy duplicate prefixes but rejects new duplicate timestamp prefixes', () => {
    const report = getMigrationFilenameReport([
      '029-add-article-embed-fields.js',
      '029-add-problem-request-type.js',
      '20260705000000-create-example.js',
      '20260705000000-create-another-example.js',
    ]);

    expect(report.duplicatePrefixes).toEqual(['20260705000000']);
    expect(report.ok).toBe(false);
  });

  it('rejects non-standard new filenames', () => {
    const report = getMigrationFilenameReport(['create-example.js']);

    expect(report.invalidNames).toEqual(['create-example.js']);
    expect(report.nonTimestampNewNames).toEqual(['create-example.js']);
    expect(report.ok).toBe(false);
  });
});
