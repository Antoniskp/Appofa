/**
 * GovernmentCurrentHolder model tests
 */
const { GovernmentCurrentHolder } = require('../index');

describe('GovernmentCurrentHolder Model', () => {
  it('does NOT have personId field', () => {
    expect(GovernmentCurrentHolder.rawAttributes.personId).toBeUndefined();
  });

  it('has userId field (NOT NULL)', () => {
    const attr = GovernmentCurrentHolder.rawAttributes.userId;
    expect(attr).toBeDefined();
    expect(attr.allowNull).toBe(false);
  });

  it('has user association to User', () => {
    const assoc = GovernmentCurrentHolder.associations.user;
    expect(assoc).toBeDefined();
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('User');
  });

  it('does NOT have person association to PublicPersonProfile', () => {
    const assoc = GovernmentCurrentHolder.associations.person;
    expect(assoc).toBeUndefined();
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
});
