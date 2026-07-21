'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authAPI, pollAPI, articleAPI } from '@/lib/api';
import CommentsThread from '@/components/comments/CommentsThread';
import { useAsyncData } from '@/hooks/useAsyncData';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import Pagination from '@/components/ui/Pagination';
import PollCard from '@/components/polls/PollCard';
import ArticleCard from '@/components/articles/ArticleCard';
import { useAuth } from '@/lib/auth-context';
import FollowButton from '@/components/follow/FollowButton';
import EndorsementPanel from '@/components/EndorsementPanel';
import PublicProfileHeader from '@/components/profile/public/PublicProfileHeader';
import PublicProfileOverview from '@/components/profile/public/PublicProfileOverview';
import PublicProfileBadges from '@/components/profile/public/PublicProfileBadges';
import { getProfileDisplayName } from '@/components/profile/public/profileDisplayUtils';

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

export default function PublicUserProfilePage() {
  const params = useParams();
  const username = params?.username;
  const { user: authUser, loading: authLoading } = useAuth();
  const tPublic = useTranslations('publicProfile');

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

  const profileTitle = getProfileDisplayName(user) || user?.username || '';
  const tabs = [
    { id: 'overview', label: tPublic('tab_overview') },
    { id: 'polls', label: tPublic('tab_polls') },
    { id: 'articles', label: tPublic('tab_articles') },
  ];
  const publicLabels = {
    memberSince: tPublic('member_since_prefix'),
    fallbackName: tPublic('fallback_name'),
    emptySummary: tPublic('empty_summary'),
    bio: tPublic('bio'),
    homeLocation: tPublic('home_location'),
    professions: tPublic('professions'),
    expertise: tPublic('expertise'),
    links: tPublic('links'),
    liveOnTwitch: tPublic('live_on_twitch'),
  };

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
              <PublicProfileHeader
                user={user}
                labels={publicLabels}
                action={(
                  <FollowButton
                    targetUserId={user.id}
                    onCountChange={() => setCountsKey((k) => k + 1)}
                  />
                )}
                counts={<FollowCounts key={countsKey} userId={user.id} username={user.username} />}
              />
            </Card>

            {/* Activity Tabs */}
            <div>
              <div className="flex border-b border-gray-200 mb-6">
                {tabs.map((tab) => (
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

              {activeTab === 'overview' && (
                <PublicProfileOverview user={user} labels={publicLabels} />
              )}

              {activeTab === 'polls' && <PollsTab userId={user.id} />}

              {activeTab === 'articles' && <ArticlesTab userId={user.id} />}
            </div>

            {/* Endorsements */}
            <EndorsementPanel targetUserId={user.id} />
            {/* Badges */}
            <PublicProfileBadges
              userId={user.id}
              labels={{
                title: tPublic('badges_title'),
                viewAll: tPublic('badges_view_all'),
                empty: tPublic('badges_empty'),
              }}
            />

            {/* Profile Comments */}
            <CommentsThread
              entityType="user_profile"
              entityId={user.id}
              commentsEnabled={user.profileCommentsEnabled !== false}
              commentsLocked={user.profileCommentsLocked === true}
              title={tPublic('wall_title')}
              composerPlaceholder={tPublic('wall_placeholder', { name: profileTitle || tPublic('fallback_name') })}
              emptyMessage={tPublic('wall_empty')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
