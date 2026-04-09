'use client';

import { getAllParties } from '@/lib/utils/politicalParties';
import ProfileManifestSection from '@/components/profile/ProfileManifestSection';

/**
 * Political positioning section for the profile page.
 * Contains the party selector and manifests.
 *
 * @param {Object} props
 * @param {Object} props.profileData
 * @param {Function} props.onChange
 * @param {Array} props.manifests
 * @param {Function} props.onAccept
 * @param {Function} props.onWithdraw
 * @param {boolean} props.manifestLoading
 */
export default function ProfilePoliticsSection({
  profileData,
  onChange,
  manifests,
  onAccept,
  onWithdraw,
  manifestLoading,
}) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="partyId" className="block text-sm font-medium text-gray-700 mb-1">
          Κόμμα <span className="text-gray-400 text-xs">(προαιρετικό)</span>
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
        <h3 className="text-base font-semibold text-gray-900 mb-3">📜 Μανιφέστα</h3>
        <ProfileManifestSection
          manifests={manifests}
          onAccept={onAccept}
          onWithdraw={onWithdraw}
          loading={manifestLoading}
        />
      </div>
    </div>
  );
}
