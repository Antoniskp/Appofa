const fs = require('fs');
const path = require('path');

describe('admin locations modal map sizing', () => {
  const filePath = path.join(__dirname, '..', 'app', 'admin', 'locations', 'page.js');
  const source = fs.readFileSync(filePath, 'utf8');

  test('uses xl modal size for the create/edit location form', () => {
    expect(source).toContain('size="xl"');
  });

  test('uses updated map dimensions for both location picker maps', () => {
    const matches = source.match(/h-\[300px\] w-full rounded-xl overflow-hidden sm:h-\[340px\]/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
});
