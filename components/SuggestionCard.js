'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import { TruncatedTextTooltip } from '@/components/ui/Tooltip';
import InlineSuggestionVote from '@/components/InlineSuggestionVote';
import UserAvatar from '@/components/user/UserAvatar';

const TYPE_LABELS = {
  idea: 'Ιδέα',
  problem: 'Πρόβλημα',
  problem_request: 'Ερώτημα',
  location_suggestion: 'Τοποθεσία',
};

const TYPE_VARIANTS = {
  idea: 'primary',
  problem: 'warning',
  problem_request: 'danger',
  location_suggestion: 'success',
};

function OrgAvatar({ org, size = 'h-6 w-6' }) {
  if (org.logo) {
    return (
      <img
        src={org.logo}
        alt={org.name}
        className={`${size} rounded object-cover border border-gray-200 flex-shrink-0`}
      />
    );
  }
  return (
    <span className={`${size} rounded bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0`}>
      <BuildingOffice2Icon className="h-3.5 w-3.5 text-gray-400" />
    </span>
  );
}

export default function SuggestionCard({ suggestion }) {
  const tCommon = useTranslations('common');

  const isOfficialOrgSuggestion = Boolean(suggestion.isOfficialPost && suggestion.organization);
  const showLocationBadge = suggestion.location && suggestion.voteRestriction !== 'locals_only';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <Link href={`/suggestions/${suggestion.id}`} className="block flex-1">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant={TYPE_VARIANTS[suggestion.type] || 'default'}>
            {TYPE_LABELS[suggestion.type] || suggestion.type}
          </Badge>
          {suggestion.category && (
            <Badge variant="purple">{suggestion.category}</Badge>
          )}
          {suggestion.voteRestriction === 'locals_only' && suggestion.location && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              📍 {suggestion.location.name}
            </span>
          )}
          {showLocationBadge && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              📍 {suggestion.location.name}
            </span>
          )}
          {Array.isArray(suggestion.tags) && suggestion.tags.map((t) => (
            <Badge key={t} variant="purple">{t}</Badge>
          ))}
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-3">
          <TruncatedTextTooltip maxLines={2}>
            {suggestion.title}
          </TruncatedTextTooltip>
        </h3>
      </Link>
      <div className="mt-auto flex flex-wrap items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100 gap-3">
        <div className="flex items-center gap-2">
          {isOfficialOrgSuggestion ? (
            <>
              <OrgAvatar org={suggestion.organization} size="h-6 w-6" />
              <span className="font-medium text-gray-700">{suggestion.organization.name}</span>
            </>
          ) : (
            <>
              {suggestion.author && (
                <>
                  <UserAvatar user={suggestion.author} size="h-6 w-6" textSize="text-xs" showBadges={false} />
                  <span>{suggestion.author.username}</span>
                </>
              )}
              {!suggestion.author && (
                <span>{suggestion.hideCreator ? tCommon('anonymous') : tCommon('unknown')}</span>
              )}
            </>
          )}
          {suggestion.createdAt && (
            <span className="text-xs text-gray-400">
              {new Date(suggestion.createdAt).toLocaleDateString('el-GR')}
            </span>
          )}
        </div>
        <InlineSuggestionVote
          suggestionId={suggestion.id}
          type={suggestion.type}
          initialUpvotes={suggestion.upvotes ?? 0}
          initialDownvotes={suggestion.downvotes ?? 0}
          initialMyVote={suggestion.myVote ?? null}
        />
      </div>
    </div>
  );
}
