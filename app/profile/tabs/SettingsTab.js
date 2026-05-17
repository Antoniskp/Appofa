'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import ProfilePrivacySection from '@/components/profile/ProfilePrivacySection';
import ProfileSecuritySection from '@/components/profile/ProfileSecuritySection';
import ProfileDangerZone from '@/components/profile/ProfileDangerZone';
import PushNotificationEnable from '@/components/notifications/PushNotificationEnable';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function SettingsTab({
  profileData,
  interactionSettings,
  savingInteraction,
  newsletterPreference,
  passwordData,
  hasPassword,
  showPasswordFields,
  githubLinked,
  googleLinked,
  oauthConfig,
  uploadedAvatarUrl,
  avatarSourceUpdating,
  handleNewsletterPreferenceToggle,
  handleInteractionSettingsChange,
  handleInteractionSettingsSave,
  handlePasswordChange,
  handlePasswordSubmit,
  togglePasswordSection,
  handleLinkGithub,
  handleUnlinkGithub,
  handleLinkGoogle,
  handleUnlinkGoogle,
  handleAvatarSourceChange,
  handleDeleteAccount,
}) {
  const tProfile = useTranslations('profile');

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('preferences')}</h2>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">{tProfile('newsletter_preference_title')}</p>
            <p className="text-xs text-gray-500 mt-0.5">{tProfile('newsletter_preference_description')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={newsletterPreference.subscribed}
            disabled={!newsletterPreference.loaded || newsletterPreference.saving}
            onClick={handleNewsletterPreferenceToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              newsletterPreference.subscribed ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                newsletterPreference.subscribed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {!newsletterPreference.loaded
            ? tProfile('newsletter_preference_loading')
            : newsletterPreference.saving
              ? tProfile('newsletter_preference_saving')
              : newsletterPreference.subscribed
                ? tProfile('newsletter_opted_in')
                : tProfile('newsletter_opted_out')}
        </p>
        <div className="mb-4 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700">{tProfile('push_notifications_title')}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {tProfile('push_notifications_description')}
          </p>
          <PushNotificationEnable />
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{tProfile('language')}</label>
        <LanguageSwitcher />
      </Card>

      <Card>
        <ProfilePrivacySection
          profileVisibility={interactionSettings.profileVisibility}
          profileCommentsEnabled={interactionSettings.profileCommentsEnabled}
          profileCommentsLocked={interactionSettings.profileCommentsLocked}
          onChange={handleInteractionSettingsChange}
          onSave={handleInteractionSettingsSave}
          saving={savingInteraction}
        />
      </Card>

      <Card>
        <ProfileSecuritySection
          passwordData={passwordData}
          hasPassword={hasPassword}
          onPasswordChange={handlePasswordChange}
          onPasswordSubmit={handlePasswordSubmit}
          showPasswordFields={showPasswordFields}
          onTogglePassword={togglePasswordSection}
          githubLinked={githubLinked}
          googleLinked={googleLinked}
          oauthConfig={oauthConfig}
          onLinkGithub={handleLinkGithub}
          onUnlinkGithub={handleUnlinkGithub}
          onLinkGoogle={handleLinkGoogle}
          onUnlinkGoogle={handleUnlinkGoogle}
          githubAvatar={profileData.githubAvatar}
          googleAvatar={profileData.googleAvatar}
          uploadedAvatar={uploadedAvatarUrl}
          activeAvatar={profileData.avatar}
          onAvatarSourceChange={handleAvatarSourceChange}
          avatarSourceUpdating={avatarSourceUpdating}
          avatarSourceLabels={{
            avatarSource: tProfile('avatar_source'),
            chooseAvatarSource: tProfile('choose_avatar_source'),
            activeAvatar: tProfile('active_avatar'),
            useAvatar: tProfile('use_avatar'),
            uploadedLabel: tProfile('uploaded_avatar'),
          }}
        />
      </Card>

      <Card>
        <ProfileDangerZone
          hasPassword={hasPassword}
          onDeleteAccount={handleDeleteAccount}
        />
      </Card>
    </div>
  );
}
