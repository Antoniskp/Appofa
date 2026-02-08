'use client';

import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import UserCard from '@/components/UserCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/Pagination';
import FilterBar from '@/components/FilterBar';
import Link from 'next/link';

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
    [page, filters],
    {
      initialData: [],
      transform: (response) => {
        setTotalPages(response.data.pagination?.totalPages || 1);
        return response.data.users || [];
      }
    }
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
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
