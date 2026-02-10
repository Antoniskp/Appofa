'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useAuth } from '@/lib/auth-context';

const DEFAULT_AVATAR_COLOR = '#64748b';

export default function PublicUserProfilePage() {
  const params = useParams();
  const userId = params?.id;
  const { user: authUser, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!authUser;
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const { data: user, loading, error } = useAsyncData(
    async () => {
      if (!userId || !isAuthenticated) {
        return { data: { user: null } };
      }
      const response = await authAPI.getPublicUserProfile(userId);
      if (response.success) {
        return response;
      }
      return { data: { user: null } };
    },
    [userId, isAuthenticated],
    {
      initialData: null,
      transform: (response) => response.data.user || null
    }
  );

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatar]);

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.lastName || '';

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="mb-6">
          <Link className="text-sm text-blue-600 hover:underline" href="/users">
            Back to users
          </Link>
        </div>

        {authLoading && (
          <SkeletonLoader type="list" count={1} />
        )}

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
            action={{
              text: 'View Users',
              href: '/users'
            }}
          />
        )}

        {!authLoading && isAuthenticated && !loading && !error && !user && (
          <EmptyState
            type="empty"
            title="Profile Not Available"
            description="This user profile is not visible right now."
            action={{
              text: 'View Users',
              href: '/users'
            }}
          />
        )}

        {!authLoading && isAuthenticated && !loading && !error && user && (
          <Card>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
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

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {user.username}
                </h1>
                {displayName && (
                  <p className="text-sm text-gray-600 mt-1 truncate">{displayName}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
