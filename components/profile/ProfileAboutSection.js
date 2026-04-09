'use client';

import { getAllParties } from '@/lib/utils/politicalParties';
import NationalitySelector from '@/components/ui/NationalitySelector';

const SOCIAL_LINK_KEYS = ['website', 'x', 'twitter', 'instagram', 'facebook', 'linkedin', 'github', 'youtube', 'tiktok'];

const SOCIAL_LINK_LABELS = {
  website: 'Website URL',
  x: 'X (Twitter) profile URL',
  twitter: 'Twitter profile URL',
  instagram: 'Instagram profile URL',
  facebook: 'Facebook profile URL',
  linkedin: 'LinkedIn profile URL',
  github: 'GitHub profile URL',
  youtube: 'YouTube channel URL',
  tiktok: 'TikTok profile URL',
};

function calculateAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

/**
 * About & Contact section: bio (with live preview), mobile phone, date of birth,
 * political party, and social links.
 *
 * @param {Object} props
 * @param {Object} props.profileData
 * @param {Function} props.onChange
 * @param {Function} props.onSocialLinkChange
 */
export default function ProfileAboutSection({ profileData, onChange, onSocialLinkChange }) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
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
        {profileData.bio && (
          <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-500 mb-1">Preview</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{profileData.bio}</p>
          </div>
        )}
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
        <label htmlFor="partyId" className="block text-sm font-medium text-gray-700 mb-1">
          Πολιτική Τοποθέτηση <span className="text-gray-400 text-xs">(προαιρετικό)</span>
        </label>
        <select
          id="partyId"
          name="partyId"
          value={profileData.partyId || ''}
          onChange={(e) => onChange({ target: { name: 'partyId', value: e.target.value || null } })}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Κανένα / Δεν επιθυμώ</option>
          {getAllParties().map((party) => (
            <option key={party.id} value={party.id}>{party.abbreviation} — {party.name}</option>
          ))}
        </select>
      </div>
      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">Social links</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOCIAL_LINK_KEYS.map((key) => (
            <div key={key}>
              <label htmlFor={`social-${key}`} className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {key}
              </label>
              <input
                id={`social-${key}`}
                type="url"
                aria-label={SOCIAL_LINK_LABELS[key] || `${key} profile URL`}
                value={(profileData.socialLinks && profileData.socialLinks[key]) || ''}
                onChange={(e) => onSocialLinkChange(key, e.target.value)}
                placeholder={`https://${key === 'website' ? 'example.com' : key + '.com/yourprofile'}`}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
