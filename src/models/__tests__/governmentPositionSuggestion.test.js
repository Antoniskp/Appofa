/**
 * GovernmentPositionSuggestion model tests
 */
const { GovernmentPositionSuggestion } = require('../index');

describe('GovernmentPositionSuggestion Model', () => {
  it('has personId field', () => {
    const attr = GovernmentPositionSuggestion.rawAttributes.personId;
    expect(attr).toBeDefined();
  });

  it('personId references PublicPersonProfiles', () => {
    const attr = GovernmentPositionSuggestion.rawAttributes.personId;
    expect(attr.references).toBeDefined();
    expect(attr.references.model).toBe('PublicPersonProfiles');
  });

  it('personId allows null (optional when userId is set)', () => {
    expect(GovernmentPositionSuggestion.rawAttributes.personId.allowNull).toBe(true);
  });

  it('has userId field', () => {
    const attr = GovernmentPositionSuggestion.rawAttributes.userId;
    expect(attr).toBeDefined();
    expect(attr.allowNull).toBe(true);
  });

  it('has user association to User', () => {
    const assoc = GovernmentPositionSuggestion.associations.user;
    expect(assoc).toBeDefined();
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('User');
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

  it('has person association to PublicPersonProfile', () => {
    const assoc = GovernmentPositionSuggestion.associations.person;
    expect(assoc).toBeDefined();
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('PublicPersonProfile');
  });
});
