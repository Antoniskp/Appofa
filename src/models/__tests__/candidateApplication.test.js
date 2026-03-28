/**
 * CandidateApplication model tests
 */
const { CandidateApplication } = require('../index');

describe('CandidateApplication Model', () => {
  it('has all required fields defined', () => {
    const fields = Object.keys(CandidateApplication.rawAttributes);
    const required = ['id', 'applicantUserId', 'fullName', 'constituencyId', 'bio',
      'contactEmail', 'socialLinks', 'politicalPositions', 'manifesto',
      'supportingStatement', 'status', 'reviewedByUserId', 'reviewedAt',
      'rejectionReason', 'candidateProfileId'];
    required.forEach((f) => expect(fields).toContain(f));
  });

  it('applicantUserId is required (allowNull: false)', () => {
    expect(CandidateApplication.rawAttributes.applicantUserId.allowNull).toBe(false);
  });

  it('supportingStatement is required (allowNull: false)', () => {
    expect(CandidateApplication.rawAttributes.supportingStatement.allowNull).toBe(false);
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
    expect(assocNames).toContain('candidateProfile');
  });

  it('applicant association is BelongsTo User', () => {
    const assoc = CandidateApplication.associations.applicant;
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('User');
  });

  it('candidateProfile association is BelongsTo CandidateProfile', () => {
    const assoc = CandidateApplication.associations.candidateProfile;
    expect(assoc.associationType).toBe('BelongsTo');
    expect(assoc.target.name).toBe('CandidateProfile');
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
