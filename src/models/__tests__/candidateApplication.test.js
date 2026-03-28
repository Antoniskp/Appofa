/**
 * CandidateApplication model tests
 */
const { CandidateApplication } = require('../index');

describe('CandidateApplication Model', () => {
  it('has all required fields defined', () => {
    const fields = Object.keys(CandidateApplication.rawAttributes);
    const required = ['id', 'applicantUserId', 'firstName', 'lastName', 'locationId',
      'constituencyId', 'bio', 'contactEmail', 'socialLinks', 'politicalPositions', 'manifesto',
      'supportingStatement', 'status', 'reviewedByUserId', 'reviewedAt',
      'rejectionReason', 'publicPersonProfileId'];
    required.forEach((f) => expect(fields).toContain(f));
  });

  it('applicantUserId is required (allowNull: false)', () => {
    expect(CandidateApplication.rawAttributes.applicantUserId.allowNull).toBe(false);
  });

  it('supportingStatement is required (allowNull: false)', () => {
    expect(CandidateApplication.rawAttributes.supportingStatement.allowNull).toBe(false);
  });

  it('firstName is required (allowNull: false)', () => {
    expect(CandidateApplication.rawAttributes.firstName.allowNull).toBe(false);
  });

  it('lastName is required (allowNull: false)', () => {
    expect(CandidateApplication.rawAttributes.lastName.allowNull).toBe(false);
  });

  it('has fullName as a virtual field combining firstName and lastName', () => {
    const inst = CandidateApplication.build({ firstName: 'John', lastName: 'Smith' });
    expect(inst.fullName).toBe('John Smith');
  });

  it('status ENUM has correct values', () => {
    const attr = CandidateApplication.rawAttributes.status;
    expect(attr.type.values).toEqual(expect.arrayContaining(['pending', 'approved', 'rejected']));
  });

  it('status defaults to pending', () => {
    expect(CandidateApplication.rawAttributes.status.defaultValue).toBe('pending');
  });

  it('has correct associations', () => {
    const assocNames = Object.keys(CandidateApplication.associations);
    expect(assocNames).toContain('applicant');
    expect(assocNames).toContain('reviewer');
    expect(assocNames).toContain('constituency');
    expect(assocNames).toContain('publicPersonProfile');
  });

  it('applicant association is BelongsTo User', () => {
    const assoc = CandidateApplication.associations.applicant;
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('User');
  });

  it('publicPersonProfile association is BelongsTo PublicPersonProfile', () => {
    const assoc = CandidateApplication.associations.publicPersonProfile;
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('PublicPersonProfile');
  });

  it('socialLinks getter parses JSON', () => {
    const inst = CandidateApplication.build({});
    inst.setDataValue('socialLinks', '{"linkedin":"https://linkedin.com/in/test"}');
    expect(inst.socialLinks).toEqual({ linkedin: 'https://linkedin.com/in/test' });
  });

  it('socialLinks getter returns null for null value', () => {
    const inst = CandidateApplication.build({});
    inst.setDataValue('socialLinks', null);
    expect(inst.socialLinks).toBeNull();
  });

  it('socialLinks setter serializes object', () => {
    const inst = CandidateApplication.build({});
    inst.socialLinks = { facebook: 'https://fb.com/test' };
    expect(inst.getDataValue('socialLinks')).toBe('{"facebook":"https://fb.com/test"}');
  });

  it('politicalPositions getter parses JSON', () => {
    const inst = CandidateApplication.build({});
    inst.setDataValue('politicalPositions', '{"Environment":"green energy"}');
    expect(inst.politicalPositions).toEqual({ Environment: 'green energy' });
  });

  it('politicalPositions setter serializes object', () => {
    const inst = CandidateApplication.build({});
    inst.politicalPositions = { Education: 'free tuition' };
    expect(inst.getDataValue('politicalPositions')).toBe('{"Education":"free tuition"}');
  });
});
