'use client';

import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card from '@/components/ui/Card';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { useProfileForm } from '@/hooks/useProfileForm';
import ProfileTab from '@/app/profile/tabs/ProfileTab';
import LocationPoliticsTab from '@/app/profile/tabs/LocationPoliticsTab';
import SkillsTab from '@/app/profile/tabs/SkillsTab';
import SettingsTab from '@/app/profile/tabs/SettingsTab';

const PROFILE_TABS = [
  { id: 'profile', labelKey: 'tab_profile' },
  { id: 'location-politics', labelKey: 'tab_location_politics' },
  { id: 'skills', labelKey: 'tab_skills_interests' },
  { id: 'settings', labelKey: 'tab_settings' },
];

function ProfileContent() {
  const tProfile = useTranslations('profile');
  const [activeTab, setActiveTab] = useState('profile');

  const {
    loading,
    user,
    oauthConfig,
    profileData,
    savedProfileData,
    isDirty,
    isSaving,
    homeLocation,
    showHomeLocation,
    badgeProgress,
    badgeEvaluating,
    displayBadge,
    savingDisplayBadge,
    interactionSettings,
    savingInteraction,
    newsletterPreference,
    passwordData,
    showPasswordFields,
    githubLinked,
    googleLinked,
    avatarSourceUpdating,
    uploadedAvatarUrl,
    hasPassword,
    profPicker,
    intPicker,
    followersCount,
    followingCount,
    manifestLoading,
    manifests,
    setShowHomeLocation,
    setProfPicker,
    setIntPicker,
    handleProfileChange,
    handleProfileSubmit,
    handlePasswordChange,
    handlePasswordSubmit,
    handleSocialLinkChange,
    handleInteractionSettingsChange,
    handleInteractionSettingsSave,
    handleNewsletterPreferenceToggle,
    handleManifestAccept,
    handleManifestWithdraw,
    handleEvaluateBadges,
    handleSelectDisplayBadge,
    handleClearDisplayBadge,
    handleAvatarSourceChange,
    handleAvatarUpload,
    handleLocationChange,
    handleLinkGithub,
    handleUnlinkGithub,
    handleLinkGoogle,
    handleUnlinkGoogle,
    handleDeleteAccount,
    togglePasswordSection,
    handleAddProfession,
    handleRemoveProfession,
    handleAddExpertise,
    handleRemoveExpertise,
    handleAddInterest,
    handleRemoveInterest,
  } = useProfileForm();

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Card>
            <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </Card>
          <Card>
            <SkeletonLoader type="form" count={1} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-gray-50/95 backdrop-blur border-b border-gray-200 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto">
            {PROFILE_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-3 px-1 text-sm font-medium border-b-2 transition ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tProfile(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            profileData={profileData}
            savedProfileData={savedProfileData}
            followersCount={followersCount}
            followingCount={followingCount}
            handleProfileChange={handleProfileChange}
            handleAvatarUpload={handleAvatarUpload}
            handleSocialLinkChange={handleSocialLinkChange}
          />
        )}

        {activeTab === 'location-politics' && (
          <LocationPoliticsTab
            profileData={profileData}
            homeLocation={homeLocation}
            showHomeLocation={showHomeLocation}
            setShowHomeLocation={setShowHomeLocation}
            manifests={manifests}
            manifestLoading={manifestLoading}
            handleProfileChange={handleProfileChange}
            handleLocationChange={handleLocationChange}
            handleManifestAccept={handleManifestAccept}
            handleManifestWithdraw={handleManifestWithdraw}
          />
        )}

        {activeTab === 'skills' && (
          <SkillsTab
            profileData={profileData}
            profPicker={profPicker}
            intPicker={intPicker}
            badgeProgress={badgeProgress}
            badgeEvaluating={badgeEvaluating}
            displayBadge={displayBadge}
            savingDisplayBadge={savingDisplayBadge}
            setProfPicker={setProfPicker}
            setIntPicker={setIntPicker}
            handleAddProfession={handleAddProfession}
            handleRemoveProfession={handleRemoveProfession}
            handleAddExpertise={handleAddExpertise}
            handleRemoveExpertise={handleRemoveExpertise}
            handleAddInterest={handleAddInterest}
            handleRemoveInterest={handleRemoveInterest}
            handleEvaluateBadges={handleEvaluateBadges}
            handleSelectDisplayBadge={handleSelectDisplayBadge}
            handleClearDisplayBadge={handleClearDisplayBadge}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            profileData={profileData}
            interactionSettings={interactionSettings}
            savingInteraction={savingInteraction}
            newsletterPreference={newsletterPreference}
            passwordData={passwordData}
            hasPassword={hasPassword}
            showPasswordFields={showPasswordFields}
            githubLinked={githubLinked}
            googleLinked={googleLinked}
            oauthConfig={oauthConfig}
            uploadedAvatarUrl={uploadedAvatarUrl}
            avatarSourceUpdating={avatarSourceUpdating}
            handleNewsletterPreferenceToggle={handleNewsletterPreferenceToggle}
            handleInteractionSettingsChange={handleInteractionSettingsChange}
            handleInteractionSettingsSave={handleInteractionSettingsSave}
            handlePasswordChange={handlePasswordChange}
            handlePasswordSubmit={handlePasswordSubmit}
            togglePasswordSection={togglePasswordSection}
            handleLinkGithub={handleLinkGithub}
            handleUnlinkGithub={handleUnlinkGithub}
            handleLinkGoogle={handleLinkGoogle}
            handleUnlinkGoogle={handleUnlinkGoogle}
            handleAvatarSourceChange={handleAvatarSourceChange}
            handleDeleteAccount={handleDeleteAccount}
          />
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {isDirty ? (
            <p className="text-sm text-amber-600 font-medium">● {tProfile('unsaved_changes')}</p>
          ) : (
            <p className="text-sm text-gray-400">{tProfile('all_changes_saved')}</p>
          )}
          <button
            type="button"
            onClick={handleProfileSubmit}
            disabled={isSaving || !isDirty}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSaving ? tProfile('saving') : tProfile('save_changes')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator', 'editor', 'viewer']}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <SkeletonLoader />
        </div>
      }>
        <ProfileContent />
      </Suspense>
    </ProtectedRoute>
  );
}
