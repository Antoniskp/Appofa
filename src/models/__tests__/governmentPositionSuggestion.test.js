/**
 * GovernmentPositionSuggestion model tests
 */
const { GovernmentPositionSuggestion } = require('../index');

describe('GovernmentPositionSuggestion Model', () => {
  it('does NOT have personId field', () => {
    expect(GovernmentPositionSuggestion.rawAttributes.personId).toBeUndefined();
  });

  it('has userId field (NOT NULL)', () => {
    const attr = GovernmentPositionSuggestion.rawAttributes.userId;
    expect(attr).toBeDefined();
    expect(attr.allowNull).toBe(false);
  });

  it('has user association to User', () => {
    const assoc = GovernmentPositionSuggestion.associations.user;
    expect(assoc).toBeDefined();
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('User');
  });

  it('does NOT have person association to PublicPersonProfile', () => {
    const assoc = GovernmentPositionSuggestion.associations.person;
    expect(assoc).toBeUndefined();
  });

  it('does NOT have name field', () => {
    const fields = Object.keys(GovernmentPositionSuggestion.rawAttributes);
    expect(fields).not.toContain('name');
  });

  it('has reason, order, isActive fields', () => {
    const fields = Object.keys(GovernmentPositionSuggestion.rawAttributes);
    expect(fields).toContain('reason');
    expect(fields).toContain('order');
    expect(fields).toContain('isActive');
  });
});
