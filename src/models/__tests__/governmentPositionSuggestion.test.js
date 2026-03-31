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

  it('personId does NOT allow null (required)', () => {
    expect(GovernmentPositionSuggestion.rawAttributes.personId.allowNull).toBe(false);
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
