'use client';

import { useState, useEffect, useCallback } from 'react';
import { organizationAPI, politicalAffiliationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ENDORSEMENT_LABELS, formatPoliticalPosition } from '@/lib/utils/politicalParties';
import {
  POLITICAL_AFFILIATION_STATUS,
  POLITICAL_AFFILIATION_STATUS_LABELS,
  formatPoliticalAffiliationStatus,
} from '@/lib/utils/politicalAffiliationStatus';
import ProfileManifestSection from '@/components/profile/ProfileManifestSection';

const ENDORSEMENT_OPTIONS = [
  { value: 'active', label: ENDORSEMENT_LABELS.active },
  { value: 'passive', label: ENDORSEMENT_LABELS.passive },
  { value: 'neutral', label: ENDORSEMENT_LABELS.neutral },
];

function PartyAvatar({ organization }) {
  if (organization?.logo) {
    return (
      <img
        src={organization.logo}
        alt={organization.name || 'Κόμμα'}
        className="h-10 w-10 rounded-full border border-gray-200 bg-white object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-full border border-gray-200 bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {(organization?.name || 'Κ').trim().charAt(0)}
    </div>
  );
}

function PoliticsLoadingState() {
  return (
    <div className="space-y-3" aria-live="polite" aria-label="Φόρτωση πολιτικών τοποθετήσεων">
      <div className="h-4 w-56 rounded bg-gray-200 animate-pulse" />
      <div className="h-16 rounded-lg border border-gray-100 bg-gray-50 animate-pulse" />
      <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
    </div>
  );
}

function normalizeOrganizations(response) {
  return response?.organizations || response?.data?.organizations || [];
}

function normalizeAffiliations(response) {
  return response?.affiliations || response?.data?.affiliations || [];
}

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
  onChange,
  manifests,
  onAccept,
  onWithdraw,
  manifestLoading,
}) {
  const { user } = useAuth();
  const userId = profileData?.id ?? user?.id;

  const [parties, setParties] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mutationError, setMutationError] = useState('');

  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('neutral');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const loadData = useCallback(async () => {
    if (!userId) {
      setParties([]);
      setAffiliations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [orgsRes, affRes] = await Promise.all([
        organizationAPI.getAll({ type: 'party', limit: 100 }),
        politicalAffiliationAPI.getAll(userId),
      ]);
      setParties(normalizeOrganizations(orgsRes));
      setAffiliations(normalizeAffiliations(affRes));
    } catch (err) {
      setError('Δεν μπορέσαμε να φορτώσουμε τις πολιτικές τοποθετήσεις. Δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const affiliatedOrgIds = new Set(
    affiliations
      .map((a) => Number(a.organizationId ?? a.organization?.id))
      .filter(Boolean)
  );
  const availableParties = parties.filter((p) => !affiliatedOrgIds.has(Number(p.id)));
  const politicalStatus = profileData?.politicalAffiliationStatus ||
    (affiliations.length > 0 || profileData?.partyId ? POLITICAL_AFFILIATION_STATUS.PARTY : '');
  const showPartyAffiliations = politicalStatus === POLITICAL_AFFILIATION_STATUS.PARTY;
  const explicitNonPartyStatus = politicalStatus && !showPartyAffiliations;

  function updateProfileField(name, value) {
    if (!onChange) return;
    onChange({ target: { name, value } });
  }

  function handlePoliticalStatusChange(event) {
    const value = event.target.value;
    updateProfileField('politicalAffiliationStatus', value);
    if (value !== POLITICAL_AFFILIATION_STATUS.OTHER) {
      updateProfileField('politicalAffiliationOtherText', '');
    }
  }

  async function handleAdd() {
    if (!userId || !selectedOrgId) return;
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
    if (!userId) return;
    setMutationError('');
    try {
      await politicalAffiliationAPI.update(userId, organizationId, endorsementLevel);
      await loadData();
    } catch {
      setMutationError('Σφάλμα κατά την ενημέρωση. Δοκιμάστε ξανά.');
    }
  }

  async function handleRemove(organizationId) {
    if (!userId) return;
    setMutationError('');
    try {
      await politicalAffiliationAPI.remove(userId, organizationId);
      await loadData();
    } catch {
      setMutationError('Σφάλμα κατά την αφαίρεση. Δοκιμάστε ξανά.');
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="profile-politics-heading" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 id="profile-politics-heading" className="text-base font-semibold text-gray-900">🏛️ Πολιτικές Τοποθετήσεις</h3>
            <p className="mt-1 text-sm text-gray-500">
              Προαιρετικές, αυτοδηλωμένες σχέσεις με πολιτικούς οργανισμούς. Δεν γίνεται αυτόματη ταξινόμηση.
            </p>
          </div>
          {!loading && !error && showPartyAffiliations && affiliations.length > 0 && (
            <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {affiliations.length} {affiliations.length === 1 ? 'τοποθέτηση' : 'τοποθετήσεις'}
            </span>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="text-sm font-medium text-gray-700">
            Δημόσια πολιτική επιλογή
            <select
              value={politicalStatus}
              onChange={handlePoliticalStatusChange}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Δεν έχει οριστεί</option>
              {Object.entries(POLITICAL_AFFILIATION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          {politicalStatus === POLITICAL_AFFILIATION_STATUS.OTHER && (
            <label className="text-sm font-medium text-gray-700">
              Περιγραφή
              <input
                type="text"
                maxLength={120}
                value={profileData?.politicalAffiliationOtherText || ''}
                onChange={(e) => updateProfileField('politicalAffiliationOtherText', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="π.χ. ανεξάρτητη κίνηση, τοπική παράταξη"
              />
            </label>
          )}
        </div>

        {loading ? (
          <PoliticsLoadingState />
        ) : error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="mt-3 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              Επανάληψη
            </button>
          </div>
        ) : !userId ? (
          <p className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            Το προφίλ δεν είναι ακόμη διαθέσιμο. Ανανεώστε τη σελίδα ή συνδεθείτε ξανά.
          </p>
        ) : (
          <div className="space-y-4">
            {mutationError && (
              <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{mutationError}</p>
            )}

            {affiliations.length > 0 ? (
              <ul className="space-y-3">
                {affiliations.map((aff) => {
                  const org = aff.organization;
                  const orgName = org?.name || 'Πολιτικός οργανισμός';
                  const posLabel = formatPoliticalPosition(org?.politicalPosition);
                  return (
                    <li
                      key={aff.id ?? aff.organizationId}
                      className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <PartyAvatar organization={org} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{orgName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {posLabel && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{posLabel}</span>
                            )}
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                              {ENDORSEMENT_LABELS[aff.endorsementLevel] || aff.endorsementLevel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="sr-only" htmlFor={`endorsement-${aff.organizationId}`}>Σχέση με {orgName}</label>
                        <select
                          id={`endorsement-${aff.organizationId}`}
                          value={aff.endorsementLevel}
                          onChange={(e) => handleUpdateLevel(aff.organizationId, e.target.value)}
                          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {ENDORSEMENT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemove(aff.organizationId)}
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          Αφαίρεση
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-800">Δεν έχεις προσθέσει πολιτική τοποθέτηση.</p>
                <p className="mt-1 text-sm text-gray-500">
                  Μπορείς να αφήσεις την ενότητα κενή ή να επιλέξεις μόνο σχέσεις που θέλεις να δηλώσεις δημόσια.
                </p>
              </div>
            )}

            {availableParties.length > 0 ? (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-800">Προσθήκη σχέσης</p>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Επιλογή κόμματος"
                  >
                    <option value="">Επιλογή κόμματος...</option>
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
                    aria-label="Τύπος σχέσης"
                  >
                    {ENDORSEMENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!selectedOrgId || adding}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    {adding ? 'Προσθήκη...' : 'Προσθήκη'}
                  </button>
                </div>
                {addError && <p className="text-xs text-red-600">{addError}</p>}
              </div>
            ) : (
              <p className="border-t border-gray-100 pt-4 text-sm text-gray-500">Δεν υπάρχουν άλλα διαθέσιμα κόμματα για προσθήκη.</p>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="profile-manifests-heading" className="space-y-3">
        <h3 id="profile-manifests-heading" className="text-base font-semibold text-gray-900">📜 Μανιφέστα</h3>
        <ProfileManifestSection
          manifests={manifests}
          onAccept={onAccept}
          onWithdraw={onWithdraw}
          loading={manifestLoading}
        />
      </section>
    </div>
  );
}
