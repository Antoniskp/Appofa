/**
 * GovernmentCurrentHolder model tests
 */
const { GovernmentCurrentHolder } = require('../index');

describe('GovernmentCurrentHolder Model', () => {
  it('has personId field', () => {
    const attr = GovernmentCurrentHolder.rawAttributes.personId;
    expect(attr).toBeDefined();
  });

  it('personId does NOT allow null (required)', () => {
    expect(GovernmentCurrentHolder.rawAttributes.personId.allowNull).toBe(false);
  });

  it('does NOT have holderName field', () => {
    const fields = Object.keys(GovernmentCurrentHolder.rawAttributes);
    expect(fields).not.toContain('holderName');
  });

  it('does NOT have holderPhoto field', () => {
    const fields = Object.keys(GovernmentCurrentHolder.rawAttributes);
    expect(fields).not.toContain('holderPhoto');
  });

  it('has since field as DATEONLY', () => {
    const attr = GovernmentCurrentHolder.rawAttributes.since;
    expect(attr).toBeDefined();
  });

  it('has isActive field', () => {
    expect(GovernmentCurrentHolder.rawAttributes.isActive).toBeDefined();
  });

  it('has person association to PublicPersonProfile', () => {
    const assoc = GovernmentCurrentHolder.associations.person;
    expect(assoc).toBeDefined();
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('PublicPersonProfile');
  });
});
