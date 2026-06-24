'use client';

import { useState, useEffect, useCallback } from 'react';
import { organizationAPI, politicalAffiliationAPI } from '@/lib/api';
import { ENDORSEMENT_LABELS, formatPoliticalPosition } from '@/lib/utils/politicalParties';
import ProfileManifestSection from '@/components/profile/ProfileManifestSection';

const ENDORSEMENT_OPTIONS = [
  { value: 'active', label: ENDORSEMENT_LABELS.active },
  { value: 'passive', label: ENDORSEMENT_LABELS.passive },
  { value: 'neutral', label: ENDORSEMENT_LABELS.neutral },
];

/**
 * Political positioning section for the profile page.
 * Uses the Organizations API (type='party') to fetch available parties
 * and UserPoliticalAffiliation to manage the user's affiliations.
 *
 * @param {Object} props
 * @param {Object} props.profileData - Current profile data (includes id)
 * @param {Array}  props.manifests
 * @param {Function} props.onAccept
 * @param {Function} props.onWithdraw
 * @param {boolean} props.manifestLoading
 */
export default function ProfilePoliticsSection({
  profileData,
  manifests,
  onAccept,
  onWithdraw,
  manifestLoading,
}) {
  const userId = profileData?.id;

  const [parties, setParties] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mutationError, setMutationError] = useState('');

  // Form state for adding a new affiliation
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('neutral');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const [orgsRes, affRes] = await Promise.all([
        organizationAPI.getAll({ type: 'party', limit: 100 }),
        politicalAffiliationAPI.getAll(userId),
      ]);
      setParties(orgsRes.organizations || []);
      setAffiliations(affRes.data?.affiliations || []);
    } catch (err) {
      setError('Σφάλμα κατά τη φόρτωση πολιτικών στοιχείων.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const affiliatedOrgIds = new Set(affiliations.map((a) => a.organizationId));
  const availableParties = parties.filter((p) => !affiliatedOrgIds.has(p.id));

  async function handleAdd() {
    if (!selectedOrgId) return;
    setAdding(true);
    setAddError('');
    try {
      await politicalAffiliationAPI.add(userId, {
        organizationId: Number(selectedOrgId),
        endorsementLevel: selectedLevel,
      });
      setSelectedOrgId('');
      setSelectedLevel('neutral');
      await loadData();
    } catch (err) {
      setAddError(err?.message || 'Σφάλμα κατά την προσθήκη.');
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdateLevel(organizationId, endorsementLevel) {
    setMutationError('');
    try {
      await politicalAffiliationAPI.update(userId, organizationId, endorsementLevel);
      await loadData();
    } catch {
      setMutationError('Σφάλμα κατά την ενημέρωση. Δοκιμάστε ξανά.');
    }
  }

  async function handleRemove(organizationId) {
    setMutationError('');
    try {
      await politicalAffiliationAPI.remove(userId, organizationId);
      await loadData();
    } catch {
      setMutationError('Σφάλμα κατά την αφαίρεση. Δοκιμάστε ξανά.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Political affiliations */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">🏛️ Πολιτικές Τοποθετήσεις</h3>

        {loading ? (
          <p className="text-sm text-gray-500">Φόρτωση…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <>
            {mutationError && (
              <p className="text-xs text-red-600 mb-2">{mutationError}</p>
            )}
            {/* Existing affiliations */}
            {affiliations.length > 0 && (
              <ul className="space-y-2 mb-4">
                {affiliations.map((aff) => {
                  const org = aff.organization;
                  const posLabel = formatPoliticalPosition(org?.politicalPosition);
                  return (
                    <li
                      key={aff.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white"
                    >
                      {org?.logo && (
                        <img
                          src={org.logo}
                          alt={org.name}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{org?.name}</p>
                        {posLabel && (
                          <p className="text-xs text-gray-500">{posLabel}</p>
                        )}
                      </div>
                      <select
                        value={aff.endorsementLevel}
                        onChange={(e) => handleUpdateLevel(aff.organizationId, e.target.value)}
                        className="text-xs rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {ENDORSEMENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemove(aff.organizationId)}
                        className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                        aria-label="Αφαίρεση"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Add new affiliation */}
            {availableParties.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Επιλογή κόμματος…</option>
                  {availableParties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.politicalPosition ? ` (${formatPoliticalPosition(p.politicalPosition)})` : ''}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {ENDORSEMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!selectedOrgId || adding}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {adding ? 'Προσθήκη…' : 'Προσθήκη'}
                </button>
              </div>
            )}
            {addError && <p className="text-xs text-red-600 mt-1">{addError}</p>}
            {affiliations.length === 0 && availableParties.length === 0 && !loading && (
              <p className="text-sm text-gray-500">Δεν βρέθηκαν κόμματα.</p>
            )}
          </>
        )}
      </div>

      {/* Manifests */}
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

