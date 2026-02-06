'use client';

import { authAPI } from '@/lib/api';
import UserCard from '@/components/UserCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/Pagination';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function UsersPage() {
  const {
    filters,
    page,
    totalPages,
    setTotalPages,
    updateFilter,
    resetFilters,
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
          <p className="text-gray-600">Find and connect with other users</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users by username..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

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
      </div>
    </div>
  );
}
