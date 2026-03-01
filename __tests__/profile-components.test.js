// Basic tests for profile components

const ProfileHeader = require('../components/profile/ProfileHeader');
const ProfileBasicInfoForm = require('../components/profile/ProfileBasicInfoForm');
const ProfileHomeLocationSection = require('../components/profile/ProfileHomeLocationSection');
const ProfilePrivacySection = require('../components/profile/ProfilePrivacySection');
const ProfileSecuritySection = require('../components/profile/ProfileSecuritySection');

describe('Profile components', () => {
  it('ProfileHeader should be defined', () => {
    expect(ProfileHeader).toBeDefined();
  });

  it('ProfileHeader should export a function or object (React component)', () => {
    const type = typeof ProfileHeader.default || typeof ProfileHeader;
    expect(['function', 'object']).toContain(type);
  });

  it('ProfileBasicInfoForm should be defined', () => {
    expect(ProfileBasicInfoForm).toBeDefined();
  });

  it('ProfileBasicInfoForm should export a function or object (React component)', () => {
    const type = typeof ProfileBasicInfoForm.default || typeof ProfileBasicInfoForm;
    expect(['function', 'object']).toContain(type);
  });

  it('ProfileHomeLocationSection should be defined', () => {
    expect(ProfileHomeLocationSection).toBeDefined();
  });

  it('ProfileHomeLocationSection should export a function or object (React component)', () => {
    const type = typeof ProfileHomeLocationSection.default || typeof ProfileHomeLocationSection;
    expect(['function', 'object']).toContain(type);
  });

  it('ProfilePrivacySection should be defined', () => {
    expect(ProfilePrivacySection).toBeDefined();
  });

  it('ProfilePrivacySection should export a function or object (React component)', () => {
    const type = typeof ProfilePrivacySection.default || typeof ProfilePrivacySection;
    expect(['function', 'object']).toContain(type);
  });

  it('ProfileSecuritySection should be defined', () => {
    expect(ProfileSecuritySection).toBeDefined();
  });

  it('ProfileSecuritySection should export a function or object (React component)', () => {
    const type = typeof ProfileSecuritySection.default || typeof ProfileSecuritySection;
    expect(['function', 'object']).toContain(type);
  });
});
