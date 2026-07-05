'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { candidateRegistrationAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import Button from '@/components/ui/Button';
import { POSITION_TYPE_LABELS } from '@/components/locations/LocationCandidatesTab';

const POSITION_OPTIONS_BY_LOCATION_TYPE = {
  international: ['other'],
  country: ['parliamentary', 'regional_council', 'other'],
  prefecture: ['county_council', 'regional_council', 'parliamentary', 'other'],
  municipality: ['mayor', 'local_council', 'other'],
};

function buildLocationChain(homeLocation) {
  const chain = [];
  const seen = new Set();
  let current = homeLocation;

  while (current?.id && !seen.has(current.id)) {
    chain.push(current);
    seen.add(current.id);
    current = current.parent;
  }

  return chain;
}

function getPositionOptions(locationType) {
  return POSITION_OPTIONS_BY_LOCATION_TYPE[locationType] || ['other'];
}

export default function CandidateRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [initialLocationLoading, setInitialLocationLoading] = useState(false);
  const [form, setForm] = useState({
    locationId: '',
    positionType: 'other',
    positionTitle: '',
    electionCycle: 'current',
    partyName: '',
    isIndependent: false,
    slogan: '',
    platform: '',
    websiteUrl: '',
    contactEmail: '',
  });
  const locationOptions = useMemo(() => buildLocationChain(user?.homeLocation), [user?.homeLocation]);
  const selectedLocation = locationOptions.find((location) => String(location.id) === String(form.locationId));
  const positionOptions = getPositionOptions(selectedLocation?.type);

  useEffect(() => {
    if (!user || form.locationId || locationOptions.length === 0) return;
    const defaultLocation = locationOptions[0];
    setForm((prev) => ({
      ...prev,
      locationId: defaultLocation.id,
      positionType: getPositionOptions(defaultLocation.type)[0],
    }));
  }, [user, form.locationId, locationOptions]);

  useEffect(() => {
    const locationParam = searchParams.get('location');
    if (!locationParam || locationOptions.length === 0) return;

    let cancelled = false;
    setInitialLocationLoading(true);
    locationAPI.getById(locationParam)
      .then((res) => {
        if (cancelled || !res?.success || !res.location?.id) return;
        const scopedLocation = locationOptions.find((location) => Number(location.id) === Number(res.location.id));
        if (scopedLocation) {
          setForm((prev) => ({
            ...prev,
            locationId: scopedLocation.id,
            positionType: getPositionOptions(scopedLocation.type).includes(prev.positionType)
              ? prev.positionType
              : getPositionOptions(scopedLocation.type)[0],
          }));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setInitialLocationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, locationOptions]);

  useEffect(() => {
    if (!selectedLocation) return;
    const availablePositions = getPositionOptions(selectedLocation.type);
    if (!availablePositions.includes(form.positionType)) {
      updateField('positionType', availablePositions[0]);
    }
  }, [selectedLocation, form.positionType]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (!form.locationId) {
      toastError('Please select a location.');
      return;
    }
    if (!selectedLocation) {
      toastError('Please choose one of your profile locations.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await candidateRegistrationAPI.create({
        ...form,
        locationId: Number(form.locationId),
      });
      const locationSlug = response.data?.registration?.location?.slug;
      toastSuccess('Candidate registration submitted for review.');
      router.push(locationSlug ? `/locations/${locationSlug}?tab=candidates#location-content` : '/candidates');
    } catch (err) {
      toastError(err.message || 'Could not register candidate profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="app-container">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="app-container max-w-2xl">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h1 className="text-2xl font-bold text-gray-900">Register as a candidate</h1>
            <p className="mt-2 text-gray-600">Log in first so your candidate listing can be attached to your profile.</p>
            <div className="mt-5 flex gap-3">
              <Link href="/login" className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
                Log in
              </Link>
              <Link href="/register" className="rounded border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="app-container max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Register as a candidate</h1>
          <p className="mt-1 text-gray-600">Submit a campaign listing for moderator review before it appears on location pages.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          {locationOptions.length === 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Set your home location on your profile before registering as a candidate.
              <Link href="/profile" className="ml-1 font-medium text-amber-950 underline">
                Update profile
              </Link>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Location *</label>
            <select
              value={form.locationId}
              onChange={(event) => updateField('locationId', event.target.value)}
              disabled={initialLocationLoading || locationOptions.length === 0}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {locationOptions.length === 0 ? (
                <option value="">No profile location set</option>
              ) : (
                locationOptions.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name_local || location.name} ({location.type})
                  </option>
                ))
              )}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Candidate registrations are limited to your home location and its parent locations.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Position *</label>
              <select
                value={form.positionType}
                onChange={(event) => updateField('positionType', event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {positionOptions.map((position) => (
                  <option key={position} value={position}>{POSITION_TYPE_LABELS[position]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Custom title</label>
              <input
                value={form.positionTitle}
                onChange={(event) => updateField('positionTitle', event.target.value)}
                placeholder="e.g. Mayor of Athens"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                placeholder="current, 2027, local 2028..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={80}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Party or list</label>
              <input
                value={form.partyName}
                onChange={(event) => updateField('partyName', event.target.value)}
                placeholder="Leave blank if independent"
                disabled={form.isIndependent}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              placeholder="One short line people will remember"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={180}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Platform</label>
            <textarea
              value={form.platform}
              onChange={(event) => updateField('platform', event.target.value)}
              rows={6}
              placeholder="Describe your priorities, local problems you want to solve, and what residents should expect from you."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Public contact email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(event) => updateField('contactEmail', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <Link href="/candidates" className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
              Cancel
            </Link>
            <Button type="submit" loading={submitting} disabled={locationOptions.length === 0}>
              Submit for review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
