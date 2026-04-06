/**
 * PublicPersonProfile model tests
 */
const { PublicPersonProfile, User, Location } = require('../index');

describe('PublicPersonProfile Model', () => {
  it('has all required fields defined', () => {
    const fields = Object.keys(PublicPersonProfile.rawAttributes);
    const required = ['id', 'slug', 'firstNameNative', 'lastNameNative', 'firstNameEn', 'lastNameEn', 'nickname',
      'locationId', 'constituencyId',
      'bio', 'photo', 'contactEmail', 'socialLinks', 'politicalPositions', 'manifesto',
      'claimStatus', 'claimedByUserId', 'claimRequestedAt', 'claimVerifiedAt',
      'claimVerifiedByUserId', 'claimToken', 'claimTokenExpiresAt',
      'createdByUserId', 'source'];
    required.forEach((f) => expect(fields).toContain(f));
  });

  it('has claimStatus ENUM with correct values', () => {
    const attr = PublicPersonProfile.rawAttributes.claimStatus;
    expect(attr.type.values).toEqual(expect.arrayContaining(['unclaimed', 'pending', 'claimed', 'rejected']));
  });

  it('has claimStatus defaulting to unclaimed', () => {
    expect(PublicPersonProfile.rawAttributes.claimStatus.defaultValue).toBe('unclaimed');
  });

  it('has source ENUM with correct values', () => {
    const attr = PublicPersonProfile.rawAttributes.source;
    expect(attr.type.values).toEqual(expect.arrayContaining(['moderator', 'application', 'self']));
  });

  it('has source defaulting to moderator', () => {
    expect(PublicPersonProfile.rawAttributes.source.defaultValue).toBe('moderator');
  });

  it('has slug as unique', () => {
    expect(PublicPersonProfile.rawAttributes.slug.unique).toBe(true);
  });

  it('has firstNameNative allowNull false', () => {
    expect(PublicPersonProfile.rawAttributes.firstNameNative.allowNull).toBe(false);
  });

  it('has lastNameNative allowNull false', () => {
    expect(PublicPersonProfile.rawAttributes.lastNameNative.allowNull).toBe(false);
  });

  it('has firstNameEn allowNull true', () => {
    expect(PublicPersonProfile.rawAttributes.firstNameEn.allowNull).toBe(true);
  });

  it('has lastNameEn allowNull true', () => {
    expect(PublicPersonProfile.rawAttributes.lastNameEn.allowNull).toBe(true);
  });

  it('has nickname allowNull true', () => {
    expect(PublicPersonProfile.rawAttributes.nickname.allowNull).toBe(true);
  });

  it('has fullName as a virtual field (backward compat alias for fullNameNative)', () => {
    const inst = PublicPersonProfile.build({ firstNameNative: 'Jane', lastNameNative: 'Doe' });
    expect(inst.fullName).toBe('Jane Doe');
  });

  it('has fullNameNative as a virtual field combining firstNameNative and lastNameNative', () => {
    const inst = PublicPersonProfile.build({ firstNameNative: 'Jane', lastNameNative: 'Doe' });
    expect(inst.fullNameNative).toBe('Jane Doe');
  });

  it('has fullNameEn as a virtual field combining firstNameEn and lastNameEn', () => {
    const inst = PublicPersonProfile.build({ firstNameEn: 'Jane', lastNameEn: 'Doe' });
    expect(inst.fullNameEn).toBe('Jane Doe');
  });

  it('fullName virtual trims whitespace when one name part is empty', () => {
    const inst = PublicPersonProfile.build({ firstNameNative: 'Jane', lastNameNative: '' });
    expect(inst.fullName).toBe('Jane');
  });

  it('does NOT have position field (removed in refactor)', () => {
    const fields = Object.keys(PublicPersonProfile.rawAttributes);
    expect(fields).not.toContain('position');
  });

  it('has correct associations', () => {
    const assocNames = Object.keys(PublicPersonProfile.associations);
    expect(assocNames).toContain('location');
    expect(assocNames).toContain('constituency');
    expect(assocNames).toContain('claimedBy');
    expect(assocNames).toContain('claimVerifiedBy');
    expect(assocNames).toContain('createdBy');
    expect(assocNames).toContain('applications');
  });

  it('location association is BelongsTo Location', () => {
    const assoc = PublicPersonProfile.associations.location;
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('Location');
  });

  it('constituency association is BelongsTo Location', () => {
    const assoc = PublicPersonProfile.associations.constituency;
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('Location');
  });

  it('does not have an applications association', () => {
    expect(PublicPersonProfile.associations.applications).toBeUndefined();
  });

  it('socialLinks getter parses JSON', () => {
    const inst = PublicPersonProfile.build({});
    inst.setDataValue('socialLinks', '{"twitter":"https://x.com"}');
    expect(inst.socialLinks).toEqual({ twitter: 'https://x.com' });
  });

  it('socialLinks getter returns null for invalid JSON', () => {
    const inst = PublicPersonProfile.build({});
    inst.setDataValue('socialLinks', 'not-json');
    expect(inst.socialLinks).toBeNull();
  });

  it('socialLinks getter returns null for null value', () => {
    const inst = PublicPersonProfile.build({});
    inst.setDataValue('socialLinks', null);
    expect(inst.socialLinks).toBeNull();
  });

  it('socialLinks setter serializes object to JSON', () => {
    const inst = PublicPersonProfile.build({});
    inst.socialLinks = { website: 'https://example.com' };
    expect(inst.getDataValue('socialLinks')).toBe('{"website":"https://example.com"}');
  });

  it('politicalPositions getter parses JSON', () => {
    const inst = PublicPersonProfile.build({});
    inst.setDataValue('politicalPositions', '{"Economy":"support SMEs"}');
    expect(inst.politicalPositions).toEqual({ Economy: 'support SMEs' });
  });

  it('politicalPositions setter serializes object', () => {
    const inst = PublicPersonProfile.build({});
    inst.politicalPositions = { Health: 'free healthcare' };
    expect(inst.getDataValue('politicalPositions')).toBe('{"Health":"free healthcare"}');
  });
});
