const en = require('../messages/en.json');
const el = require('../messages/el.json');

describe('users stats labels translations', () => {
  test('Greek labels describe the intended buckets clearly', () => {
    expect(el.users.stats_registered).toBe('Σύνολο λογαριασμών');
    expect(el.users.stats_registered_only).toBe('Εγγεγραμμένοι χρήστες');
    expect(el.users.stats_public).toBe('Προφίλ σε ροή διεκδίκησης');
    expect(el.users.stats_hidden).toBe('Κρυφά προφίλ');
  });

  test('English labels match the same bucket semantics', () => {
    expect(en.users.stats_registered).toBe('Total accounts');
    expect(en.users.stats_registered_only).toBe('Registered users');
    expect(en.users.stats_public).toBe('Claim-flow profiles');
    expect(en.users.stats_hidden).toBe('Hidden profiles');
  });
});
