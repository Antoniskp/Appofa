'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import EmptyState from '@/components/EmptyState';
import SkeletonLoader from '@/components/SkeletonLoader';
import Pagination from '@/components/Pagination';
import { useAuth } from '@/lib/auth-context';

const DEFAULT_AVATAR_COLOR = '#64748b';

function UserRow({ user }) {
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.lastName || '';

  return (
    <Link href={`/users/${user.id}`} className="block hover:bg-gray-50 transition-colors rounded-lg">
      <div className="flex items-center gap-4 px-4 py-3">
        <div
          className="h-10 w-10 rounded-full border border-gray-200 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{user.username}</span>
            {user.role && (
              <Badge variant={user.role === 'admin' ? 'danger' : 'primary'} size="sm">
                {user.role}
              </Badge>
            )}
          </div>
          {displayName && (
            <p className="text-xs text-gray-500 truncate">{displayName}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function FollowingPage() {
  const params = useParams();
  const userId = params?.id;
  const { user: authUser, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!authUser;

  const [page, setPage] = useState(1);

  const { data, loading, error } = useAsyncData(
    async () => {
      if (!userId || !isAuthenticated) return null;
      return authAPI.getFollowing(userId, { page, limit: 20 });
    },
    [userId, isAuthenticated, page],
    { initialData: null }
  );

  const users = data?.data?.users ?? [];
  const pagination = data?.data?.pagination ?? null;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="mb-6">
          <Link className="text-sm text-blue-600 hover:underline" href={`/users/${userId}`}>
            ← Back to profile
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Following</h1>

          {(authLoading || loading) && <SkeletonLoader type="list" count={5} />}

          {!authLoading && !isAuthenticated && (
            <EmptyState
              type="error"
              title="Sign in required"
              description="You must be logged in to view following."
              action={{ text: 'Log In', href: '/login' }}
            />
          )}

          {!authLoading && isAuthenticated && !loading && error && (
            <EmptyState
              type="error"
              title="Error"
              description={error}
              action={{ text: 'Back', href: `/users/${userId}` }}
            />
          )}

          {!authLoading && isAuthenticated && !loading && !error && users.length === 0 && (
            <EmptyState
              type="empty"
              title="Not following anyone"
              description="This user is not following anyone yet."
              action={{ text: 'Back to profile', href: `/users/${userId}` }}
            />
          )}

          {!authLoading && isAuthenticated && !loading && !error && users.length > 0 && (
            <Card>
              <div className="divide-y divide-gray-100">
                {users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </div>
              {pagination && (
                <div className="mt-4">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                    onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  />
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
