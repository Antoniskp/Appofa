/**
 * GovernmentPosition model tests
 */
const { GovernmentPosition } = require('../index');

describe('GovernmentPosition Model', () => {
  it('has positionTypeKey as a STRING field (not ENUM)', () => {
    const attr = GovernmentPosition.rawAttributes.positionTypeKey;
    expect(attr).toBeDefined();
    expect(attr.type.constructor.name).toBe('STRING');
    expect(attr.type.values).toBeUndefined();
  });

  it('positionTypeKey does not allow null', () => {
    expect(GovernmentPosition.rawAttributes.positionTypeKey.allowNull).toBe(false);
  });

  it('has scope field as ENUM with national/regional/municipal', () => {
    const attr = GovernmentPosition.rawAttributes.scope;
    expect(attr).toBeDefined();
    expect(attr.type.values).toEqual(expect.arrayContaining(['national', 'regional', 'municipal']));
  });

  it('scope defaults to national', () => {
    expect(GovernmentPosition.rawAttributes.scope.defaultValue).toBe('national');
  });

  it('has countryCode field', () => {
    const attr = GovernmentPosition.rawAttributes.countryCode;
    expect(attr).toBeDefined();
  });

  it('countryCode defaults to GR', () => {
    expect(GovernmentPosition.rawAttributes.countryCode.defaultValue).toBe('GR');
  });

  it('has jurisdictionId that is nullable', () => {
    const attr = GovernmentPosition.rawAttributes.jurisdictionId;
    expect(attr).toBeDefined();
    expect(attr.allowNull).toBe(true);
  });

  it('does NOT have category field', () => {
    const fields = Object.keys(GovernmentPosition.rawAttributes);
    expect(fields).not.toContain('category');
  });

  it('has jurisdiction association to Location', () => {
    const assoc = GovernmentPosition.associations.jurisdiction;
    expect(assoc).toBeDefined();
    expect(assoc.associationType).toBe('BelongsTo');
  });
});
