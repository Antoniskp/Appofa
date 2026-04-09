'use client';

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

/**
 * Social links grid section for the profile page.
 *
 * @param {Object} props
 * @param {Object} props.profileData
 * @param {Function} props.onSocialLinkChange - (key, value) => void
 */
export default function ProfileSocialLinksSection({ profileData, onSocialLinkChange }) {
  return (
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
  );
}
