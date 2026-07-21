const fs = require('fs');
const path = require('path');

describe('Profile page tab refactor', () => {
  const profilePagePath = path.join(__dirname, '..', 'app', 'profile', 'page.js');
  const publicProfilePagePath = path.join(__dirname, '..', 'app', 'users', '[username]', 'page.js');
  const publicProfileHeaderPath = path.join(__dirname, '..', 'components', 'profile', 'public', 'PublicProfileHeader.js');
  const profileHookPath = path.join(__dirname, '..', 'hooks', 'useProfileForm.js');
  const profilePoliticsSectionPath = path.join(__dirname, '..', 'components', 'profile', 'ProfilePoliticsSection.js');
  const politicalAffiliationStatusPath = path.join(__dirname, '..', 'lib', 'utils', 'politicalAffiliationStatus.js');
  const enMessagesPath = path.join(__dirname, '..', 'messages', 'en.json');
  const elMessagesPath = path.join(__dirname, '..', 'messages', 'el.json');
  const roMessagesPath = path.join(__dirname, '..', 'messages', 'ro.json');

  it('profile page uses useProfileForm and renders tab components', () => {
    const source = fs.readFileSync(profilePagePath, 'utf8');

    expect(source).toContain("import { useProfileForm } from '@/hooks/useProfileForm';");
    expect(source).toContain("import ProfileTab from '@/app/profile/tabs/ProfileTab';");
    expect(source).toContain("import LocationPoliticsTab from '@/app/profile/tabs/LocationPoliticsTab';");
    expect(source).toContain("import SkillsTab from '@/app/profile/tabs/SkillsTab';");
    expect(source).toContain("import SettingsTab from '@/app/profile/tabs/SettingsTab';");
    expect(source).toContain("{ id: 'profile', labelKey: 'tab_profile' }");
    expect(source).toContain("{ id: 'location-politics', labelKey: 'tab_location_politics' }");
    expect(source).toContain("{ id: 'skills', labelKey: 'tab_skills_interests' }");
    expect(source).toContain("{ id: 'settings', labelKey: 'tab_settings' }");
  });

  it('useProfileForm hook exports full profile form state and handlers', () => {
    const source = fs.readFileSync(profileHookPath, 'utf8');

    expect(source).toContain('export function useProfileForm()');
    expect(source).toContain('const [profileData, setProfileData] = useState');
    expect(source).toContain('const [manifestList, setManifestList] = useState([]);');
    expect(source).toContain('const handleProfileSubmit = async (event) =>');
    expect(source).toContain('const handleInteractionSettingsSave = async () =>');
    expect(source).toContain('const handleNewsletterPreferenceToggle = async () =>');
    expect(source).toContain('handleDeleteAccount');
    expect(source).toContain('handleAvatarSourceChange');
    expect(source).toContain('handleAddProfession');
    expect(source).toContain('handleAddInterest');
  });

  it('supports explicit political affiliation status options in the profile flow', () => {
    const hookSource = fs.readFileSync(profileHookPath, 'utf8');
    const politicsSource = fs.readFileSync(profilePoliticsSectionPath, 'utf8');
    const statusSource = fs.readFileSync(politicalAffiliationStatusPath, 'utf8');
    const publicProfileSource = fs.readFileSync(publicProfilePagePath, 'utf8');
    const publicProfileHeaderSource = fs.readFileSync(publicProfileHeaderPath, 'utf8');

    expect(hookSource).toContain('politicalAffiliationStatus');
    expect(hookSource).toContain('politicalAffiliationOtherText');
    expect(statusSource).toContain('PREFER_NOT_TO_SAY');
    expect(politicsSource).toContain('formatPoliticalAffiliationStatus');
    expect(publicProfileSource).toContain('PublicProfileHeader');
    expect(publicProfileHeaderSource).toContain('politicalStatusLabel');
    expect(publicProfileHeaderSource).toContain('showPoliticalAffiliations');
  });

  it('defines profile tab labels for supported locales', () => {
    const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
    const el = JSON.parse(fs.readFileSync(elMessagesPath, 'utf8'));
    const ro = JSON.parse(fs.readFileSync(roMessagesPath, 'utf8'));

    expect(en.profile.tab_profile).toBeTruthy();
    expect(en.profile.tab_location_politics).toBeTruthy();
    expect(en.profile.tab_skills_interests).toBeTruthy();
    expect(en.profile.tab_settings).toBeTruthy();

    expect(el.profile.tab_profile).toBeTruthy();
    expect(el.profile.tab_location_politics).toBeTruthy();
    expect(el.profile.tab_skills_interests).toBeTruthy();
    expect(el.profile.tab_settings).toBeTruthy();

    expect(ro.profile.tab_profile).toBeTruthy();
    expect(ro.profile.tab_location_politics).toBeTruthy();
    expect(ro.profile.tab_skills_interests).toBeTruthy();
    expect(ro.profile.tab_settings).toBeTruthy();
  });
});
