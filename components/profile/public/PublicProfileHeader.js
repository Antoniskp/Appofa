'use client';

import Badge from '@/components/ui/Badge';
import UserAvatar from '@/components/user/UserAvatar';
import { getPartyById, formatPoliticalPosition } from '@/lib/utils/politicalParties';
import {
  POLITICAL_AFFILIATION_STATUS,
  formatPoliticalAffiliationStatus,
} from '@/lib/utils/politicalAffiliationStatus';
import { getMemberSinceLabel, getProfileDisplayName } from './profileDisplayUtils';

export default function PublicProfileHeader({
  user,
  action,
  counts,
  preview = false,
  labels = {},
}) {
  const displayName = getProfileDisplayName(user);
  const profileTitle = displayName || user?.username || labels.fallbackName || '';
  const memberSince = getMemberSinceLabel(user?.createdAt);
  const politicalStatusLabel = formatPoliticalAffiliationStatus(
    user?.politicalAffiliationStatus,
    user?.politicalAffiliationOtherText
  );
  const showPoliticalAffiliations = !user?.politicalAffiliationStatus ||
    user.politicalAffiliationStatus === POLITICAL_AFFILIATION_STATUS.PARTY;

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <UserAvatar user={user} size="h-24 w-24" textSize="text-2xl" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {profileTitle}
            </h1>
            {user?.username && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">@{user.username}</p>
            )}
          </div>
          {!preview && action}
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-3">
          {preview && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {labels.previewBadge || 'Preview'}
            </span>
          )}
          {user?.role && (
            <Badge variant={user.role === 'admin' ? 'danger' : 'primary'} size="sm">
              {user.role}
            </Badge>
          )}
          {!showPoliticalAffiliations && politicalStatusLabel ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {politicalStatusLabel}
            </span>
          ) : user?.politicalAffiliations && user.politicalAffiliations.length > 0
            ? user.politicalAffiliations.map((aff) => {
                const org = aff.organization;
                if (!org) return null;
                return (
                  <span
                    key={aff.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                    title={formatPoliticalPosition(org.politicalPosition) ?? undefined}
                  >
                    {org.logo && (
                      <img src={org.logo} alt={org.name} className="h-3 w-3 rounded-full object-cover flex-shrink-0" />
                    )}
                    {org.name}
                  </span>
                );
              })
            : user?.partyId && (() => {
                const party = getPartyById(user.partyId);
                return party ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${party.colorLight}`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: party.color }}
                    />
                    {party.abbreviation}
                  </span>
                ) : null;
              })()}
        </div>

        {user?.nickname && displayName && user.nickname !== displayName && (
          <p className="text-sm text-gray-600 mt-3 truncate">{user.nickname}</p>
        )}

        {memberSince && (
          <p className="text-xs text-gray-500 mt-3">
            {labels.memberSince || 'Member since'} {memberSince}
          </p>
        )}

        {counts}
      </div>
    </div>
  );
}
