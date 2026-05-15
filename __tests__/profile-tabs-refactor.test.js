const fs = require('fs');
const path = require('path');

describe('Profile page tab refactor', () => {
  const profilePagePath = path.join(__dirname, '..', 'app', 'profile', 'page.js');
  const profileHookPath = path.join(__dirname, '..', 'hooks', 'useProfileForm.js');

  it('profile page uses useProfileForm and renders tab components', () => {
    const source = fs.readFileSync(profilePagePath, 'utf8');

    expect(source).toContain("import { useProfileForm } from '@/hooks/useProfileForm';");
    expect(source).toContain("import ProfileTab from '@/app/profile/tabs/ProfileTab';");
    expect(source).toContain("import LocationPoliticsTab from '@/app/profile/tabs/LocationPoliticsTab';");
    expect(source).toContain("import SkillsTab from '@/app/profile/tabs/SkillsTab';");
    expect(source).toContain("import SettingsTab from '@/app/profile/tabs/SettingsTab';");
    expect(source).toContain("{ id: 'profile', label: 'Profile' }");
    expect(source).toContain("{ id: 'location-politics', label: 'Location & Politics' }");
    expect(source).toContain("{ id: 'skills', label: 'Skills & Interests' }");
    expect(source).toContain("{ id: 'settings', label: 'Settings' }");
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
});
