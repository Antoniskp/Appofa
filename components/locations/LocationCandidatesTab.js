'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckBadgeIcon, MapPinIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export const POSITION_TYPE_LABELS = {
  mayor: 'Mayor',
  parliamentary: 'Parliamentary',
  local_council: 'Local council',
  county_council: 'County council',
  regional_council: 'Regional council',
  other: 'Other position',
};

function getDisplayName(user, fallback = 'Candidate') {
  if (!user) return fallback;
  return [user.firstNameNative, user.lastNameNative].filter(Boolean).join(' ').trim()
    || [user.firstNameEn, user.lastNameEn].filter(Boolean).join(' ').trim()
    || user.nickname
    || user.username
    || fallback;
}

function getProfileHref(user) {
  if (!user) return '#';
  if (user.slug) return `/persons/${user.slug}`;
  if (user.username) return `/users/${user.username}`;
  return `/users/${user.id}`;
}

export function CandidateRegistrationCard({ registration }) {
  const t = useTranslations('candidates');
  const candidate = registration.candidate;
  const name = getDisplayName(candidate, t('card.candidate_fallback'));
  const position = registration.positionTitle || t(`position_types.${registration.positionType}`) || POSITION_TYPE_LABELS[registration.positionType] || registration.positionType;
  const avatar = candidate?.avatarUrl || candidate?.avatar || candidate?.photo;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-4">
        {avatar ? (
          <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
        ) : (
          <UserCircleIcon className="h-12 w-12 text-gray-300 flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={getProfileHref(candidate)} className="font-semibold text-gray-900 hover:text-blue-700">
              {name}
            </Link>
            {candidate?.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <CheckBadgeIcon className="h-3.5 w-3.5" />
                {t('card.verified')}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">{position}</span>
            {registration.electionCycle && <span>{registration.electionCycle}</span>}
            <span>{registration.isIndependent ? t('card.independent') : (registration.partyName || t('card.no_party'))}</span>
          </div>
          {registration.location && (
            <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <MapPinIcon className="h-3.5 w-3.5" />
              {registration.location.name_local || registration.location.name}
            </p>
          )}
          {registration.slogan && (
            <p className="mt-3 text-sm font-medium text-gray-800">{registration.slogan}</p>
          )}
          {registration.platform && (
            <p className="mt-2 text-sm leading-6 text-gray-600 line-clamp-3">{registration.platform}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href={`/candidate-registrations/${registration.id}`} className="font-medium text-blue-700 hover:text-blue-900">
              {t('card.view_campaign')}
            </Link>
            <Link href={getProfileHref(candidate)} className="font-medium text-blue-700 hover:text-blue-900">
              {t('card.view_profile')}
            </Link>
            {registration.websiteUrl && (
              <a href={registration.websiteUrl} target="_blank" rel="noreferrer" className="font-medium text-gray-700 hover:text-gray-900">
                {t('card.website')}
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function LocationCandidatesTab({ candidates = [], loading = false, locationIdentifier }) {
  const t = useTranslations('candidates');

  if (loading) {
    return <p className="text-center text-gray-400 py-8 animate-pulse">{t('tab.loading')}</p>;
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 px-5 py-8 text-center">
        <h3 className="text-base font-semibold text-gray-900">{t('tab.no_registrations_title')}</h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          {t('tab.no_registrations_description')}
        </p>
        <div className="mt-4">
          <Link
            href={`/candidates/register${locationIdentifier ? `?location=${encodeURIComponent(locationIdentifier)}` : ''}`}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            {t('tab.register_as_candidate')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link
          href={`/candidates/register${locationIdentifier ? `?location=${encodeURIComponent(locationIdentifier)}` : ''}`}
          className="inline-flex items-center rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
        >
          {t('tab.register_here')}
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {candidates.map((registration) => (
          <CandidateRegistrationCard key={registration.id} registration={registration} />
        ))}
      </div>
    </div>
  );
}
