'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { pollAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import PollCard from '@/components/PollCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/Pagination';
import FilterBar from '@/components/FilterBar';
import articleCategories from '@/config/articleCategories.json';

export default function PollsPage() {
  const { user } = useAuth();
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
    type: '',
    category: '',
    tag: '',
    search: '',
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
        if (!params[key]) delete params[key];
      });

      const response = await pollAPI.getAll(params);
      if (response.success) {
        return response;
      }
      return { data: [], pagination: { totalPages: 1 } };
    },
    [page, filters],
    {
      initialData: [],
      transform: (response) => {
        setTotalPages(response.pagination?.totalPages || 1);
        return response.data || [];
      }
    }
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
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
                { value: '', label: 'Όλες' },
                { value: 'active', label: 'Ενεργές' },
                { value: 'closed', label: 'Κλειστές' },
              ],
            },
            {
              name: 'type',
              label: 'Τύπος',
              type: 'select',
              options: [
                { value: '', label: 'Όλοι' },
                { value: 'simple', label: 'Απλή' },
                { value: 'complex', label: 'Σύνθετη' },
              ],
            },
            {
              name: 'category',
              label: 'Κατηγορία',
              type: 'select',
              options: [
                { value: '', label: 'Όλες' },
                ...(articleCategories.pollCategories || []).map(cat => ({ value: cat, label: cat })),
              ],
            },
            {
              name: 'tag',
              label: 'Tag',
              type: 'text',
              placeholder: 'Filter by tag',
            },
            {
              name: 'search',
              label: 'Αναζήτηση',
              type: 'text',
              placeholder: 'Αναζήτηση δημοσκοπήσεων...',
            },
          ]}
          className="mb-8"
        />

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <EmptyState
            type="error"
            title="Σφάλμα Φόρτωσης Δημοσκοπήσεων"
            description={error}
            action={{
              text: 'Δοκιμάστε Ξανά',
              onClick: () => window.location.reload()
            }}
          />
        )}

        {/* Empty State */}
        {!loading && !error && polls.length === 0 && (
          <EmptyState
            type="empty"
            title="Δεν Βρέθηκαν Δημοσκοπήσεις"
            description="Δεν υπάρχουν δημοσκοπήσεις που να ταιριάζουν με τα κριτήρια αναζήτησης σας."
            action={user ? {
              text: 'Δημιουργήστε μια Δημοσκόπηση',
              onClick: () => window.location.href = '/polls/create'
            } : undefined}
          />
        )}

        {/* Polls Grid */}
        {!loading && !error && polls.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} variant="grid" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && polls.length > 0 && (
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
