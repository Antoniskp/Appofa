'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import SkeletonLoader from '@/components/SkeletonLoader';
import Pagination from '@/components/Pagination';
import { useAuth } from '@/lib/auth-context';
import UserRow from '@/components/user/UserRow';

export default function FollowingPage() {
  const params = useParams();
  const username = params?.username;
  const { user: authUser, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!authUser;

  const [page, setPage] = useState(1);

  // First resolve the user by username to get their numeric ID
  const { data: profileUser, loading: profileLoading, error: profileError } = useAsyncData(
    async () => {
      if (!username || !isAuthenticated) return null;
      return authAPI.getPublicUserProfileByUsername(username);
    },
    [username, isAuthenticated],
    { initialData: null }
  );

  const userId = profileUser?.data?.user?.id ?? null;

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

  const isLoading = authLoading || profileLoading || loading;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="mb-6">
          <Link className="text-sm text-blue-600 hover:underline" href={`/users/${username}`}>
            ← Back to profile
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Following</h1>

          {isLoading && <SkeletonLoader type="list" count={5} />}

          {!authLoading && !isAuthenticated && (
            <EmptyState
              type="error"
              title="Sign in required"
              description="You must be logged in to view following."
              action={{ text: 'Log In', href: '/login' }}
            />
          )}

          {!authLoading && isAuthenticated && !isLoading && (profileError || error) && (
            <EmptyState
              type="error"
              title="Error"
              description={profileError || error}
              action={{ text: 'Back', href: `/users/${username}` }}
            />
          )}

          {!authLoading && isAuthenticated && !isLoading && !profileError && !error && users.length === 0 && (
            <EmptyState
              type="empty"
              title="Not following anyone"
              description="This user is not following anyone yet."
              action={{ text: 'Back to profile', href: `/users/${username}` }}
            />
          )}

          {!authLoading && isAuthenticated && !isLoading && !profileError && !error && users.length > 0 && (
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
