'use client';

import NationalitySelector from '@/components/ui/NationalitySelector';
import ProfileHomeLocationSection from '@/components/profile/ProfileHomeLocationSection';

/**
 * Location & nationality section for the profile page.
 *
 * @param {Object} props
 * @param {Object} props.profileData
 * @param {Function} props.onChange
 * @param {number|null} props.homeLocationId
 * @param {Object|null} props.homeLocation
 * @param {boolean} props.isOpen
 * @param {Function} props.onToggle
 * @param {Function} props.onLocationChange
 */
export default function ProfileLocationSection({
  profileData,
  onChange,
  homeLocationId,
  homeLocation,
  isOpen,
  onToggle,
  onLocationChange,
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">
          Nationality
        </label>
        <NationalitySelector
          id="nationality"
          name="nationality"
          value={profileData.nationality || ''}
          onChange={(code) => onChange({ target: { name: 'nationality', value: code } })}
        />
      </div>
      <ProfileHomeLocationSection
        homeLocationId={homeLocationId}
        homeLocation={homeLocation}
        isOpen={isOpen}
        onToggle={onToggle}
        onLocationChange={onLocationChange}
      />
    </div>
  );
}
