'use client';

import { useState } from 'react';
import Link from 'next/link';
import { pollAPI } from '@/lib/api';
import PollCard from '@/components/PollCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import FilterBar from '@/components/FilterBar';
import Button from '@/components/Button';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import { useAuth } from '@/lib/auth-context';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

export default function PollsPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const {
    filters,
    page,
    totalPages,
    setTotalPages,
    handleFilterChange,
    nextPage,
    prevPage,
    goToPage,
  } = useFilters({
    status: '',
    myPolls: false,
  });

  const { data: polls, loading, error } = useAsyncData(
    async () => {
      const params = {
        page,
        limit: 12,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== false) delete params[key];
      });

      // Convert myPolls to creatorId filter
      if (filters.myPolls && user) {
        params.creatorId = user.id;
        delete params.myPolls;
      }

      const response = await pollAPI.getAll(params);
      if (response.success) {
        return response;
      }
      return { data: { polls: [], pagination: { totalPages: 1 } } };
    },
    [page, filters, user],
    {
      initialData: [],
      transform: (response) => {
        setTotalPages(response.data?.pagination?.totalPages || 1);
        return response.data?.polls || [];
      }
    }
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ψηφοφορίες</h1>
            <p className="text-gray-600">
              Συμμετέχετε σε ψηφοφορίες και δείτε τα αποτελέσματα
            </p>
          </div>
          {user && (
            <Link href="/polls/create" className="mt-4 md:mt-0">
              <Button variant="primary" size="md">
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Δημιουργία Ψηφοφορίας
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          filterConfig={[
            {
              name: 'status',
              label: 'Κατάσταση',
              type: 'select',
              options: [
                { value: '', label: 'Όλες οι ψηφοφορίες' },
                { value: 'open', label: 'Ανοιχτές' },
                { value: 'active', label: 'Ενεργές' },
                { value: 'closed', label: 'Κλειστές' },
              ],
              placeholder: 'Όλες οι καταστάσεις',
            },
          ]}
        />

        {/* My Polls Toggle */}
        {user && (
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.myPolls}
                onChange={(e) => handleFilterChange('myPolls', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Εμφάνιση μόνο των ψηφοφοριών μου</span>
            </label>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="mb-6 flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Πλέγμα
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Λίστα
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            <SkeletonLoader type="card" count={6} />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">Σφάλμα κατά τη φόρτωση των ψηφοφοριών: {error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && polls.length === 0 && (
          <EmptyState
            type="custom"
            title="Δεν βρέθηκαν ψηφοφορίες"
            description={
              filters.myPolls 
                ? "Δεν έχετε δημιουργήσει ακόμα ψηφοφορίες"
                : "Δεν υπάρχουν ψηφοφορίες αυτή τη στιγμή"
            }
            action={
              user && (
                <Link href="/polls/create">
                  <Button variant="primary">
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Δημιουργήστε την πρώτη σας ψηφοφορία
                  </Button>
                </Link>
              )
            }
          />
        )}

        {/* Polls Grid/List */}
        {!loading && !error && polls.length > 0 && (
          <>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8'
              : 'space-y-4 mb-8'
            }>
              {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} variant={viewMode} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={goToPage}
                onNext={nextPage}
                onPrev={prevPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
