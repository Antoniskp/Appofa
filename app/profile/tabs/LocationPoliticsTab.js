'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import ProfileLocationSection from '@/components/profile/ProfileLocationSection';
import ProfilePoliticsSection from '@/components/profile/ProfilePoliticsSection';

export default function LocationPoliticsTab({
  profileData,
  homeLocation,
  showHomeLocation,
  setShowHomeLocation,
  manifests,
  manifestLoading,
  handleProfileChange,
  handleLocationChange,
  handleManifestAccept,
  handleManifestWithdraw,
}) {
  const tProfile = useTranslations('profile');

  return (
    <div className="space-y-8">
      <Card>
        <h2 id="profile-location-heading" className="text-lg font-semibold text-gray-900 mb-4">{tProfile('location_nationality')}</h2>
        <ProfileLocationSection
          profileData={profileData}
          onChange={handleProfileChange}
          homeLocationId={profileData.homeLocationId}
          homeLocation={homeLocation}
          isOpen={showHomeLocation}
          onToggle={() => setShowHomeLocation((prev) => !prev)}
          onLocationChange={handleLocationChange}
        />
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('political_position')}</h2>
        <ProfilePoliticsSection
          profileData={profileData}
          onChange={handleProfileChange}
          manifests={manifests}
          onAccept={handleManifestAccept}
          onWithdraw={handleManifestWithdraw}
          manifestLoading={manifestLoading}
        />
      </Card>
    </div>
  );
}
