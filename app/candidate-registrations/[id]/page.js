'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckBadgeIcon, MapPinIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { candidateRegistrationAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { POSITION_TYPE_LABELS } from '@/components/locations/LocationCandidatesTab';

function getCandidateName(candidate) {
  if (!candidate) return 'Candidate';
  return [candidate.firstNameNative, candidate.lastNameNative].filter(Boolean).join(' ').trim()
    || [candidate.firstNameEn, candidate.lastNameEn].filter(Boolean).join(' ').trim()
    || candidate.nickname
    || candidate.username
    || 'Candidate';
}

function getProfileHref(candidate) {
  if (!candidate) return null;
  if (candidate.slug) return `/persons/${candidate.slug}`;
  if (candidate.username) return `/users/${candidate.username}`;
  return `/users/${candidate.id}`;
}

export default function CandidateRegistrationDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: registration, loading, error } = useAsyncData(
    async () => {
      const res = await candidateRegistrationAPI.getById(id);
      return res.data?.registration || null;
    },
    [id],
    { initialData: null }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="app-container max-w-4xl">
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="app-container max-w-3xl">
          <div className="rounded-lg border border-red-200 bg-white p-6">
            <p className="text-red-700">Candidate registration not found or not public.</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-4 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const candidate = registration.candidate;
  const name = getCandidateName(candidate);
  const avatar = candidate?.avatarUrl || candidate?.avatar || candidate?.photo;
  const position = registration.positionTitle || POSITION_TYPE_LABELS[registration.positionType] || registration.positionType;
  const profileHref = getProfileHref(candidate);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="app-container max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/candidates" className="text-sm font-medium text-blue-700 hover:underline">
            Back to candidates
          </Link>
          {registration.location && (
            <Link href={`/locations/${registration.location.slug || registration.location.id}?tab=candidates#location-content`} className="text-sm font-medium text-blue-700 hover:underline">
              View location candidates
            </Link>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {avatar ? (
                <img src={avatar} alt={name} className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <UserCircleIcon className="h-24 w-24 text-gray-300" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
                  {candidate?.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      <CheckBadgeIcon className="h-4 w-4" />
                      Verified profile
                    </span>
                  )}
                </div>
                <p className="mt-2 text-lg font-medium text-blue-700">{position}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
                  {registration.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {registration.location.name_local || registration.location.name}
                    </span>
                  )}
                  {registration.electionCycle && <span>{registration.electionCycle}</span>}
                  <span>{registration.isIndependent ? 'Independent' : (registration.partyName || 'No party listed')}</span>
                </div>
                {registration.slogan && (
                  <p className="mt-5 text-xl font-semibold text-gray-900">{registration.slogan}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
            <main>
              <h2 className="text-lg font-semibold text-gray-900">Platform</h2>
              {registration.platform ? (
                <p className="mt-3 whitespace-pre-wrap leading-7 text-gray-700">{registration.platform}</p>
              ) : (
                <p className="mt-3 text-gray-500">No platform has been added yet.</p>
              )}
            </main>

            <aside className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <h2 className="font-semibold text-gray-900">Campaign links</h2>
                <div className="mt-3 space-y-2 text-sm">
                  {profileHref && (
                    <Link href={profileHref} className="block font-medium text-blue-700 hover:underline">
                      Public profile
                    </Link>
                  )}
                  {registration.websiteUrl && (
                    <a href={registration.websiteUrl} target="_blank" rel="noreferrer" className="block font-medium text-blue-700 hover:underline">
                      Website
                    </a>
                  )}
                  {registration.contactEmail && (
                    <a href={`mailto:${registration.contactEmail}`} className="block font-medium text-blue-700 hover:underline">
                      Contact email
                    </a>
                  )}
                  {!profileHref && !registration.websiteUrl && !registration.contactEmail && (
                    <p className="text-gray-500">No public links listed.</p>
                  )}
                </div>
              </div>
              {registration.status !== 'approved' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  This registration is visible to you because you own it or can moderate it. It is not public until approved.
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
