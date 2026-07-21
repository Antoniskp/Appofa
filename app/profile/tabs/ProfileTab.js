'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileCompleteness from '@/components/profile/ProfileCompleteness';
import ProfilePublicPreview from '@/components/profile/ProfilePublicPreview';
import ProfileBasicInfoForm from '@/components/profile/ProfileBasicInfoForm';
import ProfileBioSection from '@/components/profile/ProfileBioSection';
import ProfileSocialLinksSection from '@/components/profile/ProfileSocialLinksSection';
import ProfileTwitchSection from '@/components/profile/ProfileTwitchSection';

export default function ProfileTab({
  user,
  profileData,
  savedProfileData,
  followersCount,
  followingCount,
  displayBadge,
  interactionSettings,
  onNavigateToSection,
  handleProfileChange,
  handleAvatarUpload,
  handleSocialLinkChange,
}) {
  const tProfile = useTranslations('profile');

  return (
    <div className="space-y-8">
      <Card>
        <ProfileHeader
          username={profileData.username}
          firstNameNative={profileData.firstNameNative}
          lastNameNative={profileData.lastNameNative}
          firstNameEn={profileData.firstNameEn}
          lastNameEn={profileData.lastNameEn}
          nickname={profileData.nickname}
          email={user?.email}
          avatar={profileData.avatar}
          avatarColor={profileData.avatarColor}
          followersCount={followersCount}
          followingCount={followingCount}
        />
      </Card>

      <Card>
        <ProfileCompleteness
          user={user}
          profileData={profileData}
          displayBadge={displayBadge}
          interactionSettings={interactionSettings}
          onNavigateToSection={onNavigateToSection}
        />
      </Card>

      <ProfilePublicPreview
        user={user}
        profileData={profileData}
        displayBadge={displayBadge}
        interactionSettings={interactionSettings}
      />

      <Card>
        <h2 id="profile-basic-info-heading" className="text-lg font-semibold text-gray-900 mb-4">{tProfile('personal_info')}</h2>
        <ProfileBasicInfoForm
          profileData={profileData}
          onChange={handleProfileChange}
          currentUsername={savedProfileData?.username}
          onAvatarUploaded={handleAvatarUpload}
        />
      </Card>

      <Card>
        <h2 id="profile-about-heading" className="text-lg font-semibold text-gray-900 mb-4">{tProfile('about_contact')}</h2>
        <ProfileBioSection
          profileData={profileData}
          onChange={handleProfileChange}
        />
        <hr className="my-6 border-gray-200" />
        <h3 className="text-base font-semibold text-gray-900 mb-4">{tProfile('social_links')}</h3>
        <ProfileSocialLinksSection
          profileData={profileData}
          onSocialLinkChange={handleSocialLinkChange}
        />
      </Card>

      {(user?.isVerified || ['admin', 'moderator', 'editor'].includes(user?.role)) && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('twitch_channel')}</h2>
          <ProfileTwitchSection
            twitchChannel={profileData.twitchChannel}
            onChange={handleProfileChange}
          />
        </Card>
      )}
    </div>
  );
}
