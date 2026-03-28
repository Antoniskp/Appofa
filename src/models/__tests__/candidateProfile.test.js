/**
 * CandidateProfile model tests
 */
const { CandidateProfile, User, Location } = require('../index');

describe('CandidateProfile Model', () => {
  it('has all required fields defined', () => {
    const fields = Object.keys(CandidateProfile.rawAttributes);
    const required = ['id', 'slug', 'fullName', 'constituencyId', 'bio', 'photo',
      'contactEmail', 'socialLinks', 'politicalPositions', 'manifesto',
      'claimStatus', 'claimedByUserId', 'claimRequestedAt', 'claimVerifiedAt',
      'claimVerifiedByUserId', 'claimToken', 'claimTokenExpiresAt',
      'createdByUserId', 'source'];
    required.forEach((f) => expect(fields).toContain(f));
  });

  it('has claimStatus ENUM with correct values', () => {
    const attr = CandidateProfile.rawAttributes.claimStatus;
    expect(attr.type.values).toEqual(expect.arrayContaining(['unclaimed', 'pending', 'claimed', 'rejected']));
  });

  it('has claimStatus defaulting to unclaimed', () => {
    expect(CandidateProfile.rawAttributes.claimStatus.defaultValue).toBe('unclaimed');
  });

  it('has source ENUM with correct values', () => {
    const attr = CandidateProfile.rawAttributes.source;
    expect(attr.type.values).toEqual(expect.arrayContaining(['moderator', 'application', 'self']));
  });

  it('has source defaulting to moderator', () => {
    expect(CandidateProfile.rawAttributes.source.defaultValue).toBe('moderator');
  });

  it('has slug as unique', () => {
    expect(CandidateProfile.rawAttributes.slug.unique).toBe(true);
  });

  it('has correct associations', () => {
    const assocNames = Object.keys(CandidateProfile.associations);
    expect(assocNames).toContain('constituency');
    expect(assocNames).toContain('claimedBy');
    expect(assocNames).toContain('claimVerifiedBy');
    expect(assocNames).toContain('createdBy');
    expect(assocNames).toContain('applications');
  });

  it('constituency association is BelongsTo Location', () => {
    const assoc = CandidateProfile.associations.constituency;
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('Location');
  });

  it('applications association is HasMany CandidateApplication', () => {
    const assoc = CandidateProfile.associations.applications;
    expect(assoc.associationType).toBe('HasMany');
    expect(assoc.target.name).toBe('CandidateApplication');
  });

  it('socialLinks getter parses JSON', () => {
    const inst = CandidateProfile.build({});
    inst.setDataValue('socialLinks', '{"twitter":"https://x.com"}');
    expect(inst.socialLinks).toEqual({ twitter: 'https://x.com' });
  });

  it('socialLinks getter returns null for invalid JSON', () => {
    const inst = CandidateProfile.build({});
    inst.setDataValue('socialLinks', 'not-json');
    expect(inst.socialLinks).toBeNull();
  });

  it('socialLinks getter returns null for null value', () => {
    const inst = CandidateProfile.build({});
    inst.setDataValue('socialLinks', null);
    expect(inst.socialLinks).toBeNull();
  });

  it('socialLinks setter serializes object to JSON', () => {
    const inst = CandidateProfile.build({});
    inst.socialLinks = { website: 'https://example.com' };
    expect(inst.getDataValue('socialLinks')).toBe('{"website":"https://example.com"}');
  });

  it('politicalPositions getter parses JSON', () => {
    const inst = CandidateProfile.build({});
    inst.setDataValue('politicalPositions', '{"Economy":"support SMEs"}');
    expect(inst.politicalPositions).toEqual({ Economy: 'support SMEs' });
  });

  it('politicalPositions setter serializes object', () => {
    const inst = CandidateProfile.build({});
    inst.politicalPositions = { Health: 'free healthcare' };
    expect(inst.getDataValue('politicalPositions')).toBe('{"Health":"free healthcare"}');
  });
});
