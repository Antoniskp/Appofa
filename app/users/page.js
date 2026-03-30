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
        {/* Public CTA banners — 2-column responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Worthy Citizens CTA banner */}
          <div className="bg-white rounded-lg shadow-sm border border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Κορυφαίοι Πολίτες</p>
                <p className="text-xs text-gray-500">Αναγνωρισμένοι από την κοινότητα.</p>
              </div>
            </div>
            <Link
              href="/worthy-citizens"
              className="inline-flex items-center px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
            >
              Λίστα →
            </Link>
          </div>

          {/* Public Persons CTA banner */}
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">Δημόσια Πρόσωπα</p>
                <p className="text-xs text-gray-500">Προφίλ πολιτικών και αξιόλογων προσώπων.</p>
              </div>
            </div>
            <Link
              href="/persons"
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
            >
              Πρόσωπα →
            </Link>
          </div>
        </div>

        {/* User Statistics - slim inline strip */}
        {!statsLoading && userStats && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 py-2.5 px-4 flex items-center gap-6 flex-wrap">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Στατιστικά</span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Εγγεγραμμένοι</span>
              <span className="text-lg font-bold text-blue-600">{userStats.totalUsers}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Ορατοί</span>
              <span className="text-lg font-bold text-green-600">{userStats.searchableUsers}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Μη ορατοί</span>
              <span className="text-lg font-bold text-gray-500">{userStats.nonSearchableUsers}</span>
            </span>
          </div>
        )}

        {/* Login/Register links for non-authenticated users */}
        {!authLoading && !isAuthenticated && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-700 mb-4">
              Θέλετε να δείτε την πλήρη λίστα χρηστών και να συνδεθείτε με την κοινότητα;
            </p>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Σύνδεση
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Εγγραφή
              </Link>
            </div>
          </div>
        )}

        {/* Show user cards only for authenticated users */}
        {isAuthenticated && (
          <>
            {/* Role-based banners — grouped together */}
            <div className="mb-6 flex flex-col gap-3">
              {/* Create public person profile banner — shown only to moderators and admins */}
              {(user?.role === 'moderator' || user?.role === 'admin') && (
                <div className="bg-white rounded-lg shadow-sm border border-purple-200 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧑</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Δημιουργία Δημόσιου Προφίλ</p>
                      <p className="text-xs text-gray-500">Δημιουργήστε προφίλ για αξιόλογα πρόσωπα της κοινότητας.</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/persons/create"
                    className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                  >
                    Δημιουργία →
                  </Link>
                </div>
              )}

              {/* Candidate dashboard banner — shown only to users with candidate role */}
              {user?.role === 'candidate' && (
                <div className="bg-white rounded-lg shadow-sm border border-green-200 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏛️</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Πίνακας Υποψηφίου</p>
                      <p className="text-xs text-gray-500">Διαχειριστείτε το προφίλ σας ως ανεξάρτητος υποψήφιος.</p>
                    </div>
                  </div>
                  <Link
                    href="/candidates/dashboard"
                    className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                  >
                    Πίνακας →
                  </Link>
                </div>
              )}

              {/* Become a candidate banner — shown to authenticated users who are not yet candidates */}
              {!['candidate', 'admin', 'moderator'].includes(user?.role) && (
                <div className="bg-white rounded-lg shadow-sm border border-blue-200 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗳️</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Γίνετε Ανεξάρτητος Υποψήφιος</p>
                      <p className="text-xs text-gray-500">Υποβάλετε αίτηση για να συμμετάσχετε ως υποψήφιος.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Link
                      href="/become-a-candidate"
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                    >
                      Υποβολή →
                    </Link>
                    <Link href="/my-application" className="text-xs text-blue-500 hover:underline" aria-label="Δείτε την κατάσταση της αίτησής σας">
                       Δείτε την αίτησή σας →
                    </Link>
                  </div>
                </div>
              )}
            </div>

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
