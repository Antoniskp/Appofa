'use client';

function calculateAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

const today = new Date().toISOString().split('T')[0];

/**
 * Bio, date of birth, and mobile phone section for the profile page.
 *
 * @param {Object} props
 * @param {Object} props.profileData
 * @param {Function} props.onChange
 */
export default function ProfileBioSection({ profileData, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Bio <span className="text-gray-400 text-xs">(max 280 chars)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          value={profileData.bio}
          onChange={onChange}
          maxLength={280}
          rows={3}
          placeholder="Tell us a bit about yourself..."
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-400 mt-1">{(profileData.bio || '').length}/280</p>
      </div>
      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
          Date of birth <span className="text-gray-400 text-xs">(private)</span>
        </label>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          value={profileData.dateOfBirth || ''}
          onChange={onChange}
          max={today}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {profileData.dateOfBirth && calculateAge(profileData.dateOfBirth) !== null && (
          <p className="text-xs text-gray-500 mt-1">Age: {calculateAge(profileData.dateOfBirth)}</p>
        )}
      </div>
      <div>
        <label htmlFor="mobileTel" className="block text-sm font-medium text-gray-700 mb-1">
          Mobile phone <span className="text-gray-400 text-xs">(private)</span>
        </label>
        <input
          id="mobileTel"
          name="mobileTel"
          type="tel"
          value={profileData.mobileTel}
          onChange={onChange}
          maxLength={30}
          placeholder="+1 555 000 0000"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
