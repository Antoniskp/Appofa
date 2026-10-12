const en = require('../messages/calendar/en.json');
const el = require('../messages/calendar/el.json');
const ro = require('../messages/calendar/ro.json');

function paths(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'object' ? paths(child, `${prefix}${key}.`) : [`${prefix}${key}`]).sort();
}
test('calendar translations cover the same keys in every supported language', () => {
  expect(paths(el)).toEqual(paths(en));
  expect(paths(ro)).toEqual(paths(en));
});
