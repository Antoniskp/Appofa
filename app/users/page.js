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

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Worthy Citizens CTA banner */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-amber-200 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-semibold text-gray-800">Κορυφαίοι Πολίτες</p>
              <p className="text-sm text-gray-500">Δείτε ποιοι πολίτες αναγνωρίζονται από την κοινότητα.</p>
            </div>
          </div>
          <Link
            href="/worthy-citizens"
            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
          >
            Δείτε τη λίστα →
          </Link>
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
            {/* Create public person profile banner — shown only to moderators and admins */}
            {(user?.role === 'moderator' || user?.role === 'admin') && (
              <div className="mb-6 bg-white rounded-lg shadow-sm border border-purple-200 p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧑</span>
                  <div>
                    <p className="font-semibold text-gray-800">Δημιουργία Δημόσιου Προφίλ Προσώπου</p>
                    <p className="text-sm text-gray-500">Ως συντονιστής, μπορείτε να δημιουργήσετε δημόσια προφίλ για αξιόλογα πρόσωπα της κοινότητας.</p>
                  </div>
                </div>
                <Link
                  href="/admin/candidates/new"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                >
                  Δημιουργία Προφίλ →
                </Link>
              </div>
            )}

            {/* Candidate dashboard banner — shown only to users with candidate role */}
            {user?.role === 'candidate' && (
              <div className="mb-6 bg-white rounded-lg shadow-sm border border-green-200 p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <p className="font-semibold text-gray-800">Πίνακας Υποψηφίου</p>
                    <p className="text-sm text-gray-500">Διαχειριστείτε το προφίλ σας ως ανεξάρτητος υποψήφιος.</p>
                  </div>
                </div>
                <Link
                  href="/candidates/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                >
                  Πίνακας →
                </Link>
              </div>
            )}

            {/* Become a candidate banner — shown to authenticated users who are not yet candidates */}
            {user?.role !== 'candidate' && (
              <div className="mb-6 bg-white rounded-lg shadow-sm border border-blue-200 p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🗳️</span>
                  <div>
                    <p className="font-semibold text-gray-800">Γίνετε Ανεξάρτητος Υποψήφιος</p>
                    <p className="text-sm text-gray-500">Υποβάλετε αίτηση για να συμμετάσχετε ως υποψήφιος στην πλατφόρμα.</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Link
                    href="/become-a-candidate"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                  >
                    Υποβολή Αίτησης →
                  </Link>
                  <Link href="/my-application" className="text-xs text-blue-500 hover:underline">
                    Έχετε ήδη υποβάλει αίτηση; Δείτε την κατάστασή της →
                  </Link>
                </div>
              </div>
            )}

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
