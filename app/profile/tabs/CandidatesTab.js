'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LocationSelector from '@/components/ui/LocationSelector';
import { useAsyncData } from '@/hooks/useAsyncData';
import { candidateRegistrationAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { POSITION_TYPE_LABELS } from '@/components/locations/LocationCandidatesTab';

const POSITION_OPTIONS = ['mayor', 'parliamentary', 'local_council', 'county_council', 'regional_council', 'other'];

const STATUS_STYLES = {
  submitted: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-700',
};

function emptyForm() {
  return {
    id: null,
    locationId: '',
    positionType: 'mayor',
    positionTitle: '',
    electionCycle: 'current',
    partyName: '',
    isIndependent: false,
    slogan: '',
    platform: '',
    websiteUrl: '',
    contactEmail: '',
  };
}

function toForm(registration) {
  return {
    id: registration.id,
    locationId: registration.locationId || registration.location?.id || '',
    positionType: registration.positionType || 'mayor',
    positionTitle: registration.positionTitle || '',
    electionCycle: registration.electionCycle || 'current',
    partyName: registration.partyName || '',
    isIndependent: Boolean(registration.isIndependent),
    slogan: registration.slogan || '',
    platform: registration.platform || '',
    websiteUrl: registration.websiteUrl || '',
    contactEmail: registration.contactEmail || '',
  };
}

export default function CandidatesTab() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState(null);

  const { data: registrations, loading, error, refetch } = useAsyncData(
    async () => {
      const res = await candidateRegistrationAPI.getMine({ status: 'all', limit: 100 });
      return res.data?.registrations || [];
    },
    [],
    { initialData: [] }
  );

  useEffect(() => {
    if (editing) setForm(toForm(editing));
  }, [editing]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!form.locationId) {
      toastError('Please select a location.');
      return;
    }
    setSaving(true);
    try {
      await candidateRegistrationAPI.update(form.id, {
        locationId: Number(form.locationId),
        positionType: form.positionType,
        positionTitle: form.positionTitle,
        electionCycle: form.electionCycle,
        partyName: form.partyName,
        isIndependent: form.isIndependent,
        slogan: form.slogan,
        platform: form.platform,
        websiteUrl: form.websiteUrl,
        contactEmail: form.contactEmail,
      });
      toastSuccess('Candidate registration updated and submitted for review.');
      setEditing(null);
      setForm(emptyForm());
      refetch();
    } catch (err) {
      toastError(err.message || 'Could not update candidate registration.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (registration) => {
    setArchivingId(registration.id);
    try {
      await candidateRegistrationAPI.archive(registration.id);
      toastSuccess('Candidate registration archived.');
      if (editing?.id === registration.id) setEditing(null);
      refetch();
    } catch (err) {
      toastError(err.message || 'Could not archive candidate registration.');
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">My Candidate Registrations</h2>
            <p className="mt-1 text-sm text-gray-600">Track review status, update rejected submissions, or archive old campaigns.</p>
          </div>
          <Link href="/candidates/register" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            New registration
          </Link>
        </div>
      </Card>

      {loading && <Card><p className="text-sm text-gray-500">Loading registrations...</p></Card>}
      {error && <Card><p className="text-sm text-red-600">Failed to load candidate registrations.</p></Card>}

      {!loading && registrations.length === 0 && (
        <Card>
          <p className="text-sm text-gray-600">You have not submitted any candidate registrations yet.</p>
        </Card>
      )}

      {!loading && registrations.length > 0 && (
        <div className="space-y-4">
          {registrations.map((registration) => (
            <Card key={registration.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {registration.positionTitle || POSITION_TYPE_LABELS[registration.positionType] || registration.positionType}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[registration.status] || 'bg-gray-100 text-gray-700'}`}>
                      {registration.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {registration.location?.name_local || registration.location?.name || 'No location'}
                    {registration.electionCycle ? ` · ${registration.electionCycle}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {registration.isIndependent ? 'Independent' : (registration.partyName || 'No party/list listed')}
                  </p>
                  {registration.reviewNotes && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      <span className="font-medium">Review note:</span> {registration.reviewNotes}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/candidate-registrations/${registration.id}`} className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View
                  </Link>
                  {registration.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => setEditing(registration)}
                      className="rounded border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                  )}
                  {registration.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => handleArchive(registration)}
                      disabled={archivingId === registration.id}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {archivingId === registration.id ? 'Archiving...' : 'Archive'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Card>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Edit Registration</h2>
                <p className="mt-1 text-sm text-gray-600">Saving changes sends this registration back to moderator review.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm());
                }}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
              <LocationSelector
                value={form.locationId}
                onChange={(value) => updateField('locationId', value || '')}
                placeholder="Select campaign location"
                allowClear
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Position</label>
                <select
                  value={form.positionType}
                  onChange={(event) => updateField('positionType', event.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {POSITION_OPTIONS.map((position) => (
                    <option key={position} value={position}>{POSITION_TYPE_LABELS[position]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Custom title</label>
                <input
                  value={form.positionTitle}
                  onChange={(event) => updateField('positionTitle', event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={160}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Election cycle</label>
                <input
                  value={form.electionCycle}
                  onChange={(event) => updateField('electionCycle', event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={80}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Party or list</label>
                <input
                  value={form.partyName}
                  onChange={(event) => updateField('partyName', event.target.value)}
                  disabled={form.isIndependent}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={160}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.isIndependent}
                onChange={(event) => updateField('isIndependent', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Independent candidate
            </label>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Campaign slogan</label>
              <input
                value={form.slogan}
                onChange={(event) => updateField('slogan', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={180}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Platform</label>
              <textarea
                value={form.platform}
                onChange={(event) => updateField('platform', event.target.value)}
                rows={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={5000}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Website</label>
                <input
                  value={form.websiteUrl}
                  onChange={(event) => updateField('websiteUrl', event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Public contact email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => updateField('contactEmail', event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                Save and submit
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
