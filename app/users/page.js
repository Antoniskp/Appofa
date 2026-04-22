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
import { EXPERTISE_AREAS } from '@/lib/constants/expertiseAreas';
import LoginLink from '@/components/ui/LoginLink';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

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
    locationId: null,
  });

  const { data: usersData, loading, error } = useAsyncData(
    async () => {
      // Wait for auth to resolve before fetching
      if (authLoading) return null;

      if (!isAuthenticated) {
        return { data: { users: [], pagination: { totalPages: 1 } } };
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

      const usersRes = await authAPI.searchUsers(params);

      return {
        data: usersRes?.success ? usersRes.data : { users: [], pagination: { totalPages: 1 } },
      };
    },
    [page, filters, isAuthenticated, authLoading],
    {
      initialData: { users: [] },
      transform: (response) => {
        // If auth is still loading, response is null — preserve existing data
        if (response === null) return undefined;
        setTotalPages(response.data.pagination?.totalPages || 1);
        return {
          users: response.data.users || [],
        };
      }
    }
  );

  const users = usersData?.users || [];

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

  const { data: unclaimedProfilesData, loading: unclaimedProfilesLoading, error: unclaimedProfilesError } = useAsyncData(
    async () => {
      if (authLoading || isAuthenticated) return null;

      const response = await personAPI.getAll({ claimStatus: 'unclaimed', limit: 6 });
      return response?.data?.profiles || [];
    },
    [authLoading, isAuthenticated],
    {
      initialData: [],
    }
  );

  const unclaimedProfiles = Array.isArray(unclaimedProfilesData) ? unclaimedProfilesData : [];
  const showUnclaimedProfilesSection = !authLoading
    && !isAuthenticated
    && !unclaimedProfilesError
    && (unclaimedProfilesLoading || unclaimedProfiles.length > 0);

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
            <div className="flex items-center gap-2">
              {isAuthenticated && (user?.role === 'moderator' || user?.role === 'admin') && (
                <Link
                  href="/admin/persons/create"
                  className="inline-flex items-center px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                >
                  + Δημιουργία
                </Link>
              )}
              <Link
                href="/persons"
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
              >
                Πρόσωπα →
              </Link>
            </div>
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
              <LoginLink
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Σύνδεση
              </LoginLink>
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Εγγραφή
              </Link>
            </div>
          </div>
        )}

        {showUnclaimedProfilesSection && (
          <section className="mb-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="text-base font-semibold text-blue-900">🏛️ Δημόσια Προφίλ — Μήπως είστε εσείς;</h2>
                  <p className="mt-1 text-sm text-blue-900/90">
                    Αυτά τα προφίλ δημιουργούνται από χρήστες για να τοποθετήσουν πρόσωπα σε κυβερνητικές θέσεις, ή για να τα ψηφίσουν για ίδιες θέσεις — από φίλους και θαυμαστές. Δεν είναι λογαριασμοί χρηστών. Περιέχουν ελάχιστα δημόσια στοιχεία. Αν το προφίλ είναι δικό σας, μπορείτε να το διεκδικήσετε και να το συμπληρώσετε.
                  </p>
                </div>
              </div>
            </div>

            {unclaimedProfilesLoading ? (
              <SkeletonLoader type="card" count={6} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unclaimedProfiles.map((profile) => {
                    const fullName = [profile.firstNameNative, profile.lastNameNative].filter(Boolean).join(' ')
                      || profile.username
                      || 'Άγνωστο';
                    const initials = fullName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() || '')
                      .join('');
                    const claimPageUrl = `/persons/${profile.slug}/claim`;

                    return (
                      <div key={profile.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-start gap-3">
                          {profile.photo ? (
                            <img
                              src={profile.photo}
                              alt={fullName}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              {initials || '?'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">{fullName}</h3>
                              {profile.claimStatus === 'unclaimed' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Αδιεκδίτητο
                                </span>
                              )}
                            </div>

                            {profile.location?.name && (
                              <p className="mt-1 text-xs text-gray-500">{profile.location.name}</p>
                            )}

                            {Array.isArray(profile.expertiseArea) && profile.expertiseArea.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {profile.expertiseArea.map((area) => (
                                  <span key={area} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                              <LoginLink
                                redirectTo={claimPageUrl}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Είμαι εγώ →
                              </LoginLink>
                              <Link href={`/persons/${profile.slug}`} className="text-blue-600 underline text-sm">
                                Δείτε προφίλ
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-right">
                  <Link href="/persons?claimStatus=unclaimed" className="text-blue-600 hover:underline text-sm font-medium">
                    → Δείτε όλα τα δημόσια πρόσωπα
                  </Link>
                </div>
              </>
            )}
          </section>
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
              className="mb-4"
            />
            <div className="mb-8">
              <LocationFilterBreadcrumb
                value={filters.locationId}
                onChange={(locationId) => updateFilter('locationId', locationId)}
              />
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
                title="Σφάλμα φόρτωσης χρηστών"
                description={error}
                action={{
                  text: 'Δοκιμάστε ξανά',
                  onClick: () => window.location.reload()
                }}
              />
            )}

            {/* Users List */}
            {!loading && !error && users.length === 0 && (
              <EmptyState
                type="empty"
                title="Δεν βρέθηκαν χρήστες"
                description={filters.search 
                  ? "Κανένας χρήστης δεν ταιριάζει με την αναζήτησή σας. Δοκιμάστε διαφορετικό όρο." 
                  : "Δεν υπάρχουν διαθέσιμοι χρήστες."}
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
