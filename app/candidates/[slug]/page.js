'use client';

import { use } from 'react';
import Link from 'next/link';
import { UserCircleIcon, MapPinIcon, EnvelopeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/solid';
import { candidateAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/SkeletonLoader';
import { positionLabel } from '@/lib/utils/candidatePositions';

export default function CandidateProfilePage({ params }) {
  const { slug } = use(params);
  const { user } = useAuth();

  const { data: profile, loading, error } = useAsyncData(
    async () => {
      const res = await candidateAPI.getBySlug(slug);
      return res.data?.profile || null;
    },
    [slug],
    { initialData: null }
  );

  if (loading) return <div className="app-container py-10"><SkeletonLoader count={1} type="card" /></div>;
  if (error || !profile) return (
    <div className="app-container py-10 text-center">
      <p className="text-red-500">Candidate not found.</p>
      <Link href="/candidates" className="mt-4 inline-block text-blue-600 hover:underline">← Back to candidates</Link>
    </div>
  );

  const socialLinksObj = profile.socialLinks || {};
  const politicalPositions = profile.politicalPositions || {};

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-3xl mx-auto">
        <Link href="/candidates" className="text-sm text-blue-600 hover:underline mb-4 inline-block">← All Candidates</Link>

        {/* Claim Banner */}
        {profile.claimStatus === 'unclaimed' && (
          <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm font-medium text-yellow-800">Is this you? Claim this profile →</p>
            </div>
            <Link
              href={`/candidates/${profile.slug}/claim`}
              className="inline-flex items-center px-3 py-1.5 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Claim Profile
            </Link>
          </div>
        )}

        {profile.claimStatus === 'pending' && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">Claim pending review by moderators.</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-5">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.fullName} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
              ) : (
                <UserCircleIcon className="w-20 h-20 text-gray-300 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
                  {profile.claimStatus === 'claimed' && (
                    <CheckBadgeIcon className="h-6 w-6 text-green-500" title="Verified Candidate" />
                  )}
                </div>
                {profile.constituency && (
                  <p className="mt-1 flex items-center gap-1 text-gray-500">
                    <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                    {profile.constituency.name}
                  </p>
                )}
                {profile.position && (
                  <p className="mt-1 text-sm font-medium text-blue-700">
                    {positionLabel(profile.position)}
                  </p>
                )}
                {profile.contactEmail && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
                    <a href={`mailto:${profile.contactEmail}`} className="hover:text-blue-600">{profile.contactEmail}</a>
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-5">
                <h2 className="text-base font-semibold text-gray-900 mb-2">Biography</h2>
                <p className="text-gray-700 whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            {/* Political Positions */}
            {politicalPositions && Object.keys(politicalPositions).length > 0 && (
              <div className="mt-5">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Political Positions</h2>
                <div className="space-y-3">
                  {Object.entries(politicalPositions).map(([topic, position]) => (
                    <div key={topic} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700">{topic}</p>
                      <p className="mt-1 text-sm text-gray-600">{position}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manifesto */}
            {profile.manifesto && (
              <div className="mt-5">
                <h2 className="text-base font-semibold text-gray-900 mb-2">Manifesto</h2>
                <p className="text-gray-700 whitespace-pre-line">{profile.manifesto}</p>
              </div>
            )}

            {/* Social Links */}
            {Object.keys(socialLinksObj).length > 0 && (
              <div className="mt-5">
                <h2 className="text-base font-semibold text-gray-900 mb-2">Social Links</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(socialLinksObj).map(([platform, url]) => (
                    url && (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <GlobeAltIcon className="h-4 w-4" />
                        {platform}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
