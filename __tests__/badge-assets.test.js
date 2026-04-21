const fs = require('fs');
const path = require('path');

describe('badge SVG assets', () => {
  const badgesConfigPath = path.join(process.cwd(), 'config', 'badges.json');
  const badgesDir = path.join(process.cwd(), 'public', 'images', 'badges');
  const badgesConfig = JSON.parse(fs.readFileSync(badgesConfigPath, 'utf8'));

  const expectedFiles = badgesConfig.flatMap(({ slug, tiers }) =>
    tiers.map(({ tier }) => `${slug}-${tier}.svg`)
  );

  test('all expected badge SVG files exist', () => {
    expectedFiles.forEach((filename) => {
      expect(fs.existsSync(path.join(badgesDir, filename))).toBe(true);
    });
  });

  test('all expected badge SVG files use a 32x32 viewBox', () => {
    expectedFiles.forEach((filename) => {
      const content = fs.readFileSync(path.join(badgesDir, filename), 'utf8');
      expect(content).toContain('viewBox="0 0 32 32"');
      expect(content).toContain('width="32"');
      expect(content).toContain('height="32"');
    });
  });
});
