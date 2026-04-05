'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, UserCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { personAPI, locationAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/ui/Pagination';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';

function ClaimStatusBadge({ status }) {
  if (status === 'unclaimed') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        Unclaimed
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
        Claim Pending
      </span>
    );
  }
  if (status === 'claimed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        <CheckBadgeIcon className="h-3 w-3" /> Verified
      </span>
    );
  }
  return null;
}

function PersonCard({ profile }) {
  return (
    <Link href={`/persons/${profile.slug}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {profile.photo ? (
            <img src={profile.photo} alt={profile.fullName} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          ) : (
            <UserCircleIcon className="w-14 h-14 text-gray-300 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 truncate">{profile.fullName}</h2>
              <ClaimStatusBadge status={profile.claimStatus} />
            </div>
            {profile.constituency && (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                {profile.constituency.name}
              </p>
            )}
            {profile.bio && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PersonsPage() {
  const {
    filters,
    page,
    totalPages,
    setTotalPages,
    handleFilterChange,
    nextPage,
    prevPage,
    goToPage
  } = useFilters({ search: '', constituencyId: '', claimStatus: '' });

  const { data: locations } = useAsyncData(
    async () => {
      const res = await locationAPI.getAll({ limit: 200 });
      return res.data || [];
    },
    [],
    { initialData: [] }
  );

  const { data: persons, loading, error } = useAsyncData(
    async () => {
      const params = { page, limit: 12 };
      if (filters.search) params.search = filters.search;
      if (filters.constituencyId) params.constituencyId = filters.constituencyId;
      if (filters.claimStatus) params.claimStatus = filters.claimStatus;
      const res = await personAPI.getAll(params);
      if (res.success) return res;
      return { data: { profiles: [], pagination: { totalPages: 1 } } };
    },
    [page, filters],
    {
      initialData: [],
      transform: (res) => {
        setTotalPages(res.data?.pagination?.totalPages || 1);
        return res.data?.profiles || [];
      }
    }
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Public Person Profiles</h1>
          <p className="mt-1 text-gray-500">Browse and discover public person profiles.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative w-full sm:flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.constituencyId}
            onChange={(e) => handleFilterChange('constituencyId', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Constituencies</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          <select
            value={filters.claimStatus}
            onChange={(e) => handleFilterChange('claimStatus', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="pending">Claim Pending</option>
            <option value="claimed">Verified</option>
          </select>
        </div>

        {loading && <SkeletonLoader count={6} type="card" />}
        {error && <p className="text-red-500 text-center py-8">Failed to load persons.</p>}

        {!loading && !error && persons.length === 0 && (
          <EmptyState message="No persons found." />
        )}

        {!loading && persons.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {persons.map((profile) => (
              <PersonCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onNext={nextPage}
              onPrevious={prevPage}
              onPageChange={goToPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
