const fs = require('fs');
const path = require('path');

describe('Profile notifications UI wiring', () => {
  const profilePagePath = path.join(__dirname, '..', 'app', 'profile', 'page.js');
  const settingsTabPath = path.join(__dirname, '..', 'app', 'profile', 'tabs', 'SettingsTab.js');
  const enMessagesPath = path.join(__dirname, '..', 'messages', 'en.json');
  const elMessagesPath = path.join(__dirname, '..', 'messages', 'el.json');

  it('renders PushNotificationEnable in profile settings tab', () => {
    const source = fs.readFileSync(settingsTabPath, 'utf8');

    expect(source).toContain("import PushNotificationEnable from '@/components/notifications/PushNotificationEnable';");
    expect(source).toContain('<PushNotificationEnable />');
    expect(source).toContain("tProfile('push_notifications_title')");
    expect(source).toContain("tProfile('push_notifications_description')");
  });

  it('profile page uses SettingsTab in tabbed profile layout', () => {
    const source = fs.readFileSync(profilePagePath, 'utf8');

    expect(source).toContain("import SettingsTab from '@/app/profile/tabs/SettingsTab';");
    expect(source).toContain('<SettingsTab');
  });

  it('has push notification copy keys for both locales', () => {
    const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
    const el = JSON.parse(fs.readFileSync(elMessagesPath, 'utf8'));

    expect(en.profile.push_notifications_title).toBeTruthy();
    expect(en.profile.push_notifications_description).toBeTruthy();
    expect(el.profile.push_notifications_title).toBeTruthy();
    expect(el.profile.push_notifications_description).toBeTruthy();
  });
});
