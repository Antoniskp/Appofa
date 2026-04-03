'use client';

import { authAPI, personAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import UserCard from '@/components/UserCard';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/ui/Pagination';
import FilterBar from '@/components/ui/FilterBar';
import Link from 'next/link';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { EXPERTISE_AREAS } from '@/lib/constants/expertiseAreas';

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
    expertiseArea: '',
  });

  const { data: usersData, loading, error } = useAsyncData(
    async () => {
      // Wait for auth to resolve before fetching
      if (authLoading) return null;

      if (!isAuthenticated) {
        return { data: { users: [], pagination: { totalPages: 1 } }, persons: [] };
      }
      const params = {
        page,
        limit: 20,
        ...filters,
      };
      
      // Remove empty filters (but keep valid falsy values like 0)
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      // Fetch users and (when searching) public person profiles in parallel
      const [usersResponse, personsResponse] = await Promise.allSettled([
        authAPI.searchUsers(params),
        filters.search
          ? personAPI.getAll({ search: filters.search, limit: 20 })
          : Promise.resolve(null),
      ]);

      const usersRes = usersResponse.status === 'fulfilled' ? usersResponse.value : null;
      const personsRes = personsResponse.status === 'fulfilled' ? personsResponse.value : null;

      return {
        data: usersRes?.success ? usersRes.data : { users: [], pagination: { totalPages: 1 } },
        persons: personsRes?.success ? (personsRes.data?.profiles || []) : [],
      };
    },
    [page, filters, isAuthenticated, authLoading],
    {
      initialData: { users: [], persons: [] },
      transform: (response) => {
        // If auth is still loading, response is null — preserve existing data
        if (response === null) return undefined;
        setTotalPages(response.data.pagination?.totalPages || 1);
        return {
          users: response.data.users || [],
          persons: response.persons || [],
        };
      }
    }
  );

  const users = usersData?.users || [];
  const persons = usersData?.persons || [];

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
                {
                  name: 'expertiseArea',
                  label: 'Τομέας',
                  type: 'select',
                  placeholder: 'Όλοι οι τομείς',
                  options: [
                    { value: '', label: 'Όλοι οι τομείς' },
                    ...EXPERTISE_AREAS.map((area) => ({ value: area, label: area })),
                  ],
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

            {/* Public Person Profiles — shown when search is active */}
            {!loading && filters.search && persons.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Δημόσια Πρόσωπα</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {persons.map((profile) => (
                    <Link
                      key={profile.id}
                      href={`/persons/${profile.slug}`}
                      className="block bg-white rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {profile.photo ? (
                            <img
                              src={profile.photo}
                              alt={`${profile.firstName} ${profile.lastName}`}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <UserCircleIcon className="w-12 h-12 text-gray-300 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-semibold text-gray-900 truncate">
                                {profile.firstName} {profile.lastName}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                📋 Δημόσιο Προφίλ
                              </span>
                            </div>
                            {profile.bio && (
                              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{profile.bio}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
