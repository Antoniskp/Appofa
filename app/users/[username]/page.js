'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { authAPI, pollAPI, articleAPI, badgeAPI } from '@/lib/api';
import CommentsThread from '@/components/comments/CommentsThread';
import { useAsyncData } from '@/hooks/useAsyncData';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import UserAvatar from '@/components/user/UserAvatar';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import Pagination from '@/components/ui/Pagination';
import PollCard from '@/components/polls/PollCard';
import ArticleCard from '@/components/articles/ArticleCard';
import { useAuth } from '@/lib/auth-context';
import FollowButton from '@/components/follow/FollowButton';
import EndorsementPanel from '@/components/EndorsementPanel';
import { getPartyById, formatPoliticalPosition } from '@/lib/utils/politicalParties';
import {
  POLITICAL_AFFILIATION_STATUS,
  formatPoliticalAffiliationStatus,
} from '@/lib/utils/politicalAffiliationStatus';
import { getExpertiseTagLabel, resolveProfessionLabel } from '@/lib/utils/professionTaxonomy';
import TwitchEmbed from '@/components/profile/TwitchEmbed';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'polls', label: 'Polls' },
  { id: 'articles', label: 'Articles' },
];

const TIER_EMOJI = { bronze: '🥉', silver: '🥈', gold: '🥇' };

function getLocationBreadcrumb(location) {
  if (!location) return null;
  const parts = [];
  let current = location;
  while (current) {
    parts.unshift(current.name);
    current = current.parent;
  }
  return parts.join(' → ');
}

function BadgeImage({ slug, tier }) {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return <span className="text-2xl">{TIER_EMOJI[tier] || '🏅'}</span>;
  }
  return (
    <img
      src={`/images/badges/${slug}-${tier}.svg`}
      alt={`${slug} ${tier}`}
      className="w-10 h-10 object-contain"
      onError={() => setImgError(true)}
    />
  );
}

function UserBadgesSection({ userId }) {
  const [badges, setBadges] = useState(null);

  useEffect(() => {
    if (!userId) return;
    badgeAPI.getUserBadges(userId)
      .then((res) => {
        if (res?.data?.badges) setBadges(res.data.badges);
        else setBadges([]);
      })
      .catch(() => setBadges([]));
  }, [userId]);

  if (badges === null) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">Badges</h2>
        <Link href="/platform/badges" className="text-xs text-blue-600 hover:underline">
          Δείτε όλα τα badges →
        </Link>
      </div>
      {badges.length === 0 ? (
        <p className="text-sm text-gray-500">Δεν έχει κερδηθεί κανένα badge ακόμα.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {badges.map((b) => (
            <div
              key={`${b.badgeSlug}-${b.tier}`}
              className="flex flex-col items-center gap-1 min-w-[64px]"
              title={`${b.name || b.badgeSlug} — ${b.label || b.tier}`}
            >
              <BadgeImage slug={b.badgeSlug} tier={b.tier} />
              <span className="text-xs text-gray-600 text-center leading-tight">{b.name || b.badgeSlug}</span>
              <span className="text-xs text-gray-400 capitalize">{b.label || b.tier}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function FollowCounts({ userId, username }) {
  const [counts, setCounts] = useState(null);

  const fetchCounts = useCallback(() => {
    authAPI.getFollowCounts(userId)
      .then((res) => {
        if (res?.data) setCounts(res.data);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (userId) fetchCounts();
  }, [userId, fetchCounts]);

  if (!counts) return null;

  return (
    <div className="grid grid-cols-2 gap-2 mt-4 sm:max-w-sm">
      <Link
        href={`/users/${username}/followers`}
        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 hover:border-blue-200 hover:bg-blue-50"
      >
        <span className="block text-base font-semibold text-gray-900">{counts.followersCount}</span>
        <span className="block text-xs text-gray-500">
          {counts.followersCount === 1 ? 'Follower' : 'Followers'}
        </span>
      </Link>
      <Link
        href={`/users/${username}/following`}
        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 hover:border-blue-200 hover:bg-blue-50"
      >
        <span className="block text-base font-semibold text-gray-900">{counts.followingCount}</span>
        <span className="block text-xs text-gray-500">Following</span>
      </Link>
    </div>
  );
}

function PollsTab({ userId }) {
  const [page, setPage] = useState(1);
  const limit = 9;

  const { data, loading, error } = useAsyncData(
    async () => {
      if (!userId) return null;
      return pollAPI.getAll({ creatorId: userId, page, limit });
    },
    [userId, page],
    { initialData: null }
  );

  const polls = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  if (loading) return <SkeletonLoader type="card" count={3} />;
  if (error) return (
    <EmptyState type="error" title="Error loading polls" description={error} />
  );
  if (!polls.length) return (
    <EmptyState type="empty" title="No polls yet" description="This user has not created any polls." />
  );

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} variant="grid" />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onPrevious={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
    </div>
  );
}

function ArticlesTab({ userId }) {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, loading, error } = useAsyncData(
    async () => {
      if (!userId) return null;
      return articleAPI.getAll({ authorId: userId, status: 'published', page, limit });
    },
    [userId, page],
    { initialData: null }
  );

  const articles = Array.isArray(data?.data?.articles) ? data.data.articles : [];
  const totalPages = data?.data?.pagination?.totalPages ?? 1;

  if (loading) return <SkeletonLoader type="list" count={3} />;
  if (error) return (
    <EmptyState type="error" title="Error loading articles" description={error} />
  );
  if (!articles.length) return (
    <EmptyState type="empty" title="No articles yet" description="This user has not published any articles." />
  );

  return (
    <div>
      <div className="space-y-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="list" />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onPrevious={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
    </div>
  );
}

function ProfileOverview({ user }) {
  const homeLocation = getLocationBreadcrumb(user.homeLocation);
  const hasProfessions = user.professions && user.professions.length > 0;
  const hasExpertise = user.expertiseArea && user.expertiseArea.length > 0;
  const hasSocialLinks = user.socialLinks && Object.values(user.socialLinks).some(Boolean);
  const hasOverview = user.bio || homeLocation || hasProfessions || hasExpertise || hasSocialLinks || user.twitchChannel;

  if (!hasOverview) {
    return (
      <Card>
        <p className="text-sm text-gray-600">
          This profile does not have a public summary yet.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-5">
        {user.bio && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Bio</h2>
            <p className="text-sm text-gray-600 whitespace-pre-line">{user.bio}</p>
          </section>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {homeLocation && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-1">Home location</h2>
              <p className="text-sm text-gray-600">{homeLocation}</p>
            </section>
          )}

          {hasProfessions && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Επαγγελματική Ταυτότητα</h2>
              <div className="flex flex-wrap gap-2">
                {user.professions.map((entry, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {resolveProfessionLabel(entry)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {hasExpertise && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Τομείς Εμπειρογνωμοσύνης</h2>
              <div className="flex flex-wrap gap-2">
                {user.expertiseArea.map((area) => (
                  <span key={area} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                    {getExpertiseTagLabel(area)}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {hasSocialLinks && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Links</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(user.socialLinks).map(([key, url]) =>
                url ? (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline capitalize"
                  >
                    {key}
                  </a>
                ) : null
              )}
            </div>
          </section>
        )}

        {user.twitchChannel && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Live on Twitch —{' '}
              <a
                href={`https://www.twitch.tv/${user.twitchChannel}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                twitch.tv/{user.twitchChannel}
              </a>
            </h2>
            <TwitchEmbed channel={user.twitchChannel} />
          </section>
        )}
      </div>
    </Card>
  );
}

export default function PublicUserProfilePage() {
  const params = useParams();
  const username = params?.username;
  const { user: authUser, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');

  const { data: user, loading, error } = useAsyncData(
    async () => {
      if (!username) {
        return { data: { user: null } };
      }
      const response = await authAPI.getPublicUserProfileByUsername(username);
      if (response.success) {
        return response;
      }
      return { data: { user: null } };
    },
    [username, authUser?.id],
    {
      initialData: null,
      transform: (response) => response.data.user || null
    }
  );

  const [countsKey, setCountsKey] = useState(0);

  const displayName = user?.firstNameNative && user?.lastNameNative
    ? `${user.firstNameNative} ${user.lastNameNative}`
    : user?.firstNameNative || user?.lastNameNative || '';
  const profileTitle = displayName || user?.nickname || user?.username || '';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
    : null;
  const politicalStatusLabel = formatPoliticalAffiliationStatus(
    user?.politicalAffiliationStatus,
    user?.politicalAffiliationOtherText
  );
  const showPoliticalAffiliations = !user?.politicalAffiliationStatus ||
    user.politicalAffiliationStatus === POLITICAL_AFFILIATION_STATUS.PARTY;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="mb-6">
          <Link className="text-sm text-blue-600 hover:underline" href="/users">
            ← Back to users
          </Link>
        </div>

        {authLoading && <SkeletonLoader type="list" count={1} />}

        {!authLoading && loading && (
          <SkeletonLoader type="list" count={1} />
        )}

        {!authLoading && !loading && error && (
          <EmptyState
            type="error"
            title="User Not Found"
            description={error}
            action={{ text: 'View Users', href: '/users' }}
          />
        )}

        {!authLoading && !loading && !error && !user && (
          <EmptyState
            type="empty"
            title="Profile Not Available"
            description="This user profile is not visible right now."
            action={{ text: 'View Users', href: '/users' }}
          />
        )}

        {!authLoading && !loading && !error && user && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <UserAvatar user={user} size="h-24 w-24" textSize="text-2xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <h1 className="text-2xl font-bold text-gray-900 truncate">
                        {profileTitle}
                      </h1>
                      {user.username && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">@{user.username}</p>
                      )}
                    </div>
                    <FollowButton
                      targetUserId={user.id}
                      onCountChange={() => setCountsKey((k) => k + 1)}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {user.role && (
                      <Badge variant={user.role === 'admin' ? 'danger' : 'primary'} size="sm">
                        {user.role}
                      </Badge>
                    )}
                    {!showPoliticalAffiliations && politicalStatusLabel ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {politicalStatusLabel}
                      </span>
                    ) : user.politicalAffiliations && user.politicalAffiliations.length > 0
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
                      : user.partyId && (() => {
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

                  {user.nickname && displayName && (
                    <p className="text-sm text-gray-600 mt-3 truncate">{user.nickname}</p>
                  )}

                  {memberSince && (
                    <p className="text-xs text-gray-500 mt-3">Member since {memberSince}</p>
                  )}
                  <FollowCounts key={countsKey} userId={user.id} username={user.username} />
                </div>
              </div>
            </Card>

            {/* Activity Tabs */}
            <div>
              <div className="flex border-b border-gray-200 mb-6">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && <ProfileOverview user={user} />}

              {activeTab === 'polls' && <PollsTab userId={user.id} />}

              {activeTab === 'articles' && <ArticlesTab userId={user.id} />}
            </div>

            {/* Endorsements */}
            <EndorsementPanel targetUserId={user.id} />
            {/* Badges */}
            <UserBadgesSection userId={user.id} />

            {/* Profile Comments */}
            <CommentsThread
              entityType="user_profile"
              entityId={user.id}
              commentsEnabled={user.profileCommentsEnabled !== false}
              commentsLocked={user.profileCommentsLocked === true}
              title="Wall"
              composerPlaceholder={`Post on ${profileTitle || 'this profile'}'s wall...`}
              emptyMessage="No wall posts yet."
            />
          </div>
        )}
      </div>
    </div>
  );
}
