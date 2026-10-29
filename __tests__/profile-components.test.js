// Basic tests for profile components
jest.mock('next-intl');

const ProfileHeader = require('../components/profile/ProfileHeader');
const ProfileCompleteness = require('../components/profile/ProfileCompleteness');
const ProfileBasicInfoForm = require('../components/profile/ProfileBasicInfoForm');
const ProfileHomeLocationSection = require('../components/profile/ProfileHomeLocationSection');
const ProfilePrivacySection = require('../components/profile/ProfilePrivacySection');
const ProfileSecuritySection = require('../components/profile/ProfileSecuritySection');
const ProfileDangerZone = require('../components/profile/ProfileDangerZone');

describe('Profile components', () => {
  it('ProfileHeader should be defined', () => {
    expect(ProfileHeader).toBeDefined();
  });

  it('ProfileHeader should export a function or object (React component)', () => {
    const type = typeof (ProfileHeader.default || ProfileHeader);
    expect(['function', 'object']).toContain(type);
  });

  it('ProfileCompleteness should be defined', () => {
    expect(ProfileCompleteness).toBeDefined();
  });

  it('ProfileCompleteness should export a function or object (React component)', () => {
    const type = typeof (ProfileCompleteness.default || ProfileCompleteness);
    expect(['function', 'object']).toContain(type);
  });

  it('ProfileBasicInfoForm should be defined', () => {
    expect(ProfileBasicInfoForm).toBeDefined();
  });

  it('ProfileBasicInfoForm should export a function or object (React component)', () => {
    const type = typeof (ProfileBasicInfoForm.default || ProfileBasicInfoForm);
    expect(['function', 'object']).toContain(type);
  });

  it('ProfileHomeLocationSection should be defined', () => {
    expect(ProfileHomeLocationSection).toBeDefined();
  });

  it('ProfileHomeLocationSection should export a function or object (React component)', () => {
    const type = typeof (ProfileHomeLocationSection.default || ProfileHomeLocationSection);
    expect(['function', 'object']).toContain(type);
  });

  it('ProfilePrivacySection should be defined', () => {
    expect(ProfilePrivacySection).toBeDefined();
  });

  it('ProfilePrivacySection should export a function or object (React component)', () => {
    const type = typeof (ProfilePrivacySection.default || ProfilePrivacySection);
    expect(['function', 'object']).toContain(type);
  });

  it('ProfileSecuritySection should be defined', () => {
    expect(ProfileSecuritySection).toBeDefined();
  });

  it('ProfileSecuritySection should export a function or object (React component)', () => {
    const type = typeof (ProfileSecuritySection.default || ProfileSecuritySection);
    expect(['function', 'object']).toContain(type);
  });

  it('ProfileDangerZone should be defined', () => {
    expect(ProfileDangerZone).toBeDefined();
  });

  it('ProfileDangerZone should export a function or object (React component)', () => {
    const type = typeof (ProfileDangerZone.default || ProfileDangerZone);
    expect(['function', 'object']).toContain(type);
  });
});
