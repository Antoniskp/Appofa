'use client';

import { authAPI, endorsementAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import UserCard from '@/components/UserCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/Pagination';
import FilterBar from '@/components/FilterBar';
import Badge from '@/components/Badge';
import Link from 'next/link';

const DEFAULT_AVATAR_COLOR = '#64748b';

const TOP_RATED_COUNT = 5;

function TopRatedCard({ user, rank }) {
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || '';

  return (
    <Link
      href={`/users/${user.username}`}
      className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <span className="text-2xl font-bold text-amber-400 w-8 text-center">{rank}</span>
      <div
        className="h-12 w-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold"
        style={{ backgroundColor: user.avatarColor || DEFAULT_AVATAR_COLOR }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span>{(user.username || 'U').charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{user.username}</span>
          {user.role && user.role !== 'viewer' && (
            <Badge variant={user.role === 'admin' ? 'danger' : 'primary'} size="sm">
              {user.role}
            </Badge>
          )}
        </div>
        {displayName && (
          <p className="text-sm text-gray-500 truncate">{displayName}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-2xl font-bold text-blue-600">{user.endorsementCount}</p>
        <p className="text-xs text-gray-500">εγκρίσεις</p>
      </div>
    </Link>
  );
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !authLoading && !!user;

  const {
    filters,
    page,
    totalPages,
    setTotalPages,
    updateFilter,
    nextPage,
    prevPage,
    goToPage,
  } = useFilters({
    search: '',
  });

  const { data: users, loading, error } = useAsyncData(
    async () => {
      if (!isAuthenticated) {
        return { data: { users: [], pagination: { totalPages: 1 } } };
      }
      const params = {
        page,
        limit: 20,
        ...filters,
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await authAPI.searchUsers(params);
      if (response.success) {
        return response;
      }
      return { data: { users: [], pagination: { totalPages: 1 } } };
    },
    [page, filters, isAuthenticated],
    {
      initialData: [],
      transform: (response) => {
        setTotalPages(response.data.pagination?.totalPages || 1);
        return response.data.users || [];
      }
    }
  );

  // Fetch public user statistics
  const { data: userStats, loading: statsLoading } = useAsyncData(
    async () => {
      const response = await authAPI.getPublicUserStats();
      if (response.success) {
        return response.data;
      }
      return null;
    },
    [],
    {
      initialData: null
    }
  );

  // Fetch top rated users (by endorsements)
  const { data: topRatedUsers, loading: topRatedLoading } = useAsyncData(
    async () => {
      const response = await endorsementAPI.getLeaderboard({ page: 1 });
      if (response.success) {
        return response.data.users.slice(0, TOP_RATED_COUNT);
      }
      return [];
    },
    [],
    { initialData: [] }
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Top Rated Users - shown to everyone */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">🏆 Κορυφαίοι Πολίτες</h2>
              <p className="text-sm text-gray-500 mt-1">Πολίτες αναγνωρισμένοι από την κοινότητα για τη γνώση και την εμπειρία τους.</p>
            </div>
            <Link
              href="/worthy-citizens"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
            >
              Δείτε όλους →
            </Link>
          </div>
          {topRatedLoading ? (
            <div className="space-y-3">
              <SkeletonLoader type="card" count={3} />
            </div>
          ) : topRatedUsers.length === 0 ? (
            <p className="text-sm text-gray-500">Δεν υπάρχουν ακόμα εγκρίσεις.</p>
          ) : (
            <div className="space-y-3">
              {topRatedUsers.map((u, index) => (
                <TopRatedCard key={u.id} user={u} rank={index + 1} />
              ))}
            </div>
          )}
        </div>

        {/* User Statistics - shown to everyone */}
        {!statsLoading && userStats && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Community Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Registered users</p>
                <p className="text-3xl font-bold text-blue-600">{userStats.totalUsers}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Visible users</p>
                <p className="text-3xl font-bold text-green-600">{userStats.searchableUsers}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Invisible users</p>
                <p className="text-3xl font-bold text-gray-600">{userStats.nonSearchableUsers}</p>
              </div>
            </div>
          </div>
        )}

        {/* Login/Register links for non-authenticated users */}
        {!authLoading && !isAuthenticated && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-700 mb-4">
              Want to see the full list of users and connect with the community?
            </p>
            <div className="flex gap-4">
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

        {/* Show user cards only for authenticated users */}
        {isAuthenticated && (
          <>
            {/* Search using FilterBar */}
            <FilterBar
              filters={filters}
              onChange={(e) => updateFilter(e.target.name, e.target.value)}
              filterConfig={[
                {
                  name: 'search',
                  label: 'Αναζήτηση',
                  type: 'text',
                  placeholder: 'Αναζήτηση χρηστών...',
                },
              ]}
              className="mb-8"
            />

            {/* Loading State */}
            {loading && (
              <div className="space-y-6">
                <SkeletonLoader type="list" count={5} />
              </div>
            )}

            {/* Error State */}
            {error && (
              <EmptyState
                type="error"
                title="Error Loading Users"
                description={error}
                action={{
                  text: 'Try Again',
                  onClick: () => window.location.reload()
                }}
              />
            )}

            {/* Users List */}
            {!loading && !error && users.length === 0 && (
              <EmptyState
                type="empty"
                title="No Users Found"
                description={filters.search 
                  ? "No users match your search. Try a different search term." 
                  : "No users available to display."}
              />
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>

            {/* Pagination */}
            {!loading && !error && users.length > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={goToPage}
                onPrevious={prevPage}
                onNext={nextPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
