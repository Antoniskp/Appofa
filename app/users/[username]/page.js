'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { authAPI, pollAPI, articleAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import SkeletonLoader from '@/components/SkeletonLoader';
import Pagination from '@/components/Pagination';
import PollCard from '@/components/PollCard';
import ArticleCard from '@/components/ArticleCard';
import { useAuth } from '@/lib/auth-context';
import FollowButton from '@/components/follow/FollowButton';

const DEFAULT_AVATAR_COLOR = '#64748b';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'polls', label: 'Polls' },
  { id: 'articles', label: 'Articles' },
];

function UserAvatar({ user }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatar]);

  return (
    <div
      className="h-24 w-24 rounded-full border border-gray-200 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0"
      style={{ backgroundColor: user.avatarColor || DEFAULT_AVATAR_COLOR }}
    >
      {user.avatar && !avatarLoadError ? (
        <img
          src={user.avatar}
          alt={user.username}
          className="h-full w-full rounded-full object-cover"
          onError={() => setAvatarLoadError(true)}
        />
      ) : (
        <span>{(user.username || 'U').charAt(0).toUpperCase()}</span>
      )}
    </div>
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
    <div className="flex gap-4 mt-2 text-sm text-gray-600">
      <Link
        href={`/users/${username}/followers`}
        className="hover:text-blue-600 hover:underline"
      >
        <span className="font-semibold text-gray-900">{counts.followersCount}</span>{' '}
        {counts.followersCount === 1 ? 'Follower' : 'Followers'}
      </Link>
      <Link
        href={`/users/${username}/following`}
        className="hover:text-blue-600 hover:underline"
      >
        <span className="font-semibold text-gray-900">{counts.followingCount}</span>{' '}
        Following
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
  const isAuthenticated = !authLoading && !!authUser;

  const [activeTab, setActiveTab] = useState('overview');

  const { data: user, loading, error } = useAsyncData(
    async () => {
      if (!username || !isAuthenticated) {
        return { data: { user: null } };
      }
      const response = await authAPI.getPublicUserProfileByUsername(username);
      if (response.success) {
        return response;
      }
      return { data: { user: null } };
    },
    [username, isAuthenticated],
    {
      initialData: null,
      transform: (response) => response.data.user || null
    }
  );

  const [countsKey, setCountsKey] = useState(0);

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.lastName || '';

  const getLocationBreadcrumb = (location) => {
    if (!location) return null;
    const parts = [];
    let current = location;
    while (current) {
      parts.unshift(current.name);
      current = current.parent;
    }
    return parts.join(' → ');
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

        {!authLoading && !isAuthenticated && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Please sign in</h1>
            <p className="text-gray-600 mb-6">
              Only registered users can view profiles. Log in or create an account to continue.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        )}

        {!authLoading && isAuthenticated && loading && (
          <SkeletonLoader type="list" count={1} />
        )}

        {!authLoading && isAuthenticated && !loading && error && (
          <EmptyState
            type="error"
            title="User Not Found"
            description={error}
            action={{ text: 'View Users', href: '/users' }}
          />
        )}

        {!authLoading && isAuthenticated && !loading && !error && !user && (
          <EmptyState
            type="empty"
            title="Profile Not Available"
            description="This user profile is not visible right now."
            action={{ text: 'View Users', href: '/users' }}
          />
        )}

        {!authLoading && isAuthenticated && !loading && !error && user && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <UserAvatar user={user} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 truncate">
                      {user.username}
                    </h1>
                    {user.role && (
                      <Badge variant={user.role === 'admin' ? 'danger' : 'primary'} size="sm">
                        {user.role}
                      </Badge>
                    )}
                    <FollowButton
                      targetUserId={user.id}
                      onCountChange={() => setCountsKey((k) => k + 1)}
                    />
                  </div>
                  {displayName && (
                    <p className="text-sm text-gray-600 mt-1 truncate">{displayName}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  <FollowCounts key={countsKey} userId={user.id} username={user.username} />
                </div>
              </div>
            </Card>

            {user.homeLocation && (
              <Card>
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Home location</h2>
                <p className="text-sm text-gray-600">
                  {getLocationBreadcrumb(user.homeLocation)}
                </p>
              </Card>
            )}

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

              {activeTab === 'overview' && (
                <Card>
                  <p className="text-sm text-gray-600">
                    Select a tab above to view this user&apos;s polls or articles.
                  </p>
                </Card>
              )}

              {activeTab === 'polls' && <PollsTab userId={user.id} />}

              {activeTab === 'articles' && <ArticlesTab userId={user.id} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
