'use client';

import Link from 'next/link';
import { UserCircleIcon, MapPinIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import { getExpertiseTagLabel, resolveProfessionLabel } from '@/lib/utils/professionTaxonomy';

function ClaimStatusBadge({ status, t }) {
  if (status === 'claimed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        <CheckBadgeIcon className="h-3 w-3" />
        {t('claimed')}
      </span>
    );
  }
  if (status === 'unclaimed') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        {t('unclaimed')}
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
        {t('pending')}
      </span>
    );
  }
  return null;
}

export default function PersonCard({ profile }) {
  const t = useTranslations('users');
  const displayName =
    profile.firstNameNative && profile.lastNameNative
      ? `${profile.firstNameNative} ${profile.lastNameNative}`
      : profile.firstNameEn && profile.lastNameEn
        ? `${profile.firstNameEn} ${profile.lastNameEn}`
        : profile.fullName || '';

  const photo = profile.avatar || profile.photo;
  const professions = Array.isArray(profile.professions) ? profile.professions : [];
  const primaryProfession = professions.length > 0 ? resolveProfessionLabel(professions[0]) : null;
  const expertiseTagIds = Array.isArray(profile.expertiseArea) ? profile.expertiseArea : [];
  const visibleTags = expertiseTagIds.slice(0, 3);
  const location = profile.homeLocation?.name || profile.constituency?.name || null;
  const href = profile.slug ? `/persons/${profile.slug}` : '#';

  return (
    <Link
      href={href}
      className="group block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-5 h-full"
    >
      <div className="flex items-start gap-4">
        {photo ? (
          <img
            src={photo}
            alt={displayName}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-gray-100"
          />
        ) : (
          <UserCircleIcon className="w-14 h-14 text-gray-300 flex-shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
              {displayName}
            </h2>
            <ClaimStatusBadge status={profile.claimStatus} t={t} />
          </div>

          {location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 truncate">
              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
              {location}
            </p>
          )}

          {primaryProfession && (
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 truncate">
              <BriefcaseIcon className="h-4 w-4 flex-shrink-0" />
              {primaryProfession}
            </p>
          )}

          {visibleTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700"
                >
                  {getExpertiseTagLabel(tag)}
                </span>
              ))}
            </div>
          )}

          {profile.bio && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
