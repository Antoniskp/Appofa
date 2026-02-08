'use client';

import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import UserCard from '@/components/UserCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useFilters } from '@/hooks/useFilters';
import Pagination from '@/components/Pagination';
import { MagnifyingGlassIcon, UsersIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { EyeIcon, SignalIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [sessionId] = useState(() => {
    // Generate a cryptographically secure session ID for this browser session
    if (typeof window !== 'undefined') {
      let sid = sessionStorage.getItem('sessionId');
      if (!sid) {
        // Use crypto.randomUUID if available, otherwise fallback
        if (window.crypto && window.crypto.randomUUID) {
          sid = window.crypto.randomUUID();
        } else {
          sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
        }
        sessionStorage.setItem('sessionId', sid);
      }
      return sid;
    }
    return null;
  });
  
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

  // Fetch user statistics (available to all users) - refresh every 30 seconds
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useAsyncData(
    async () => {
      const response = await authAPI.getPublicUserStats();
      if (response.success) {
        return response.data;
      }
      return { total: 0, active: 0, onlineUsers: 0, anonymousVisitors: 0 };
    },
    [],
    {
      initialData: { total: 0, active: 0, onlineUsers: 0, anonymousVisitors: 0 }
    }
  );

  // Send heartbeat to track active session
  useEffect(() => {
    if (!sessionId) return;

    const sendHeartbeat = async () => {
      try {
        await authAPI.sendHeartbeat(sessionId);
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 60 seconds
    const heartbeatInterval = setInterval(sendHeartbeat, 60000);

    // Refresh stats every 30 seconds
    const statsInterval = setInterval(() => {
      refetchStats();
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(statsInterval);
    };
  }, [sessionId, refetchStats]);

  // Only fetch users when authenticated
  const { data: users, loading, error } = useAsyncData(
    async () => {
      // Don't fetch users if not authenticated
      if (!user) {
        return [];
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
    [page, filters, user],
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

        {/* User Statistics */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-12 w-12 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Registered Users</p>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-12 w-12 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SignalIcon className="h-12 w-12 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Online Now</p>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats.onlineUsers || 0}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Logged in users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-12 w-12 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Visitors</p>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{stats.anonymousVisitors || 0}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Browsing now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Not Logged In: Show Login/Register Links */}
        {!authLoading && !user && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Community</h2>
            <p className="text-gray-600 mb-6">
              Sign in or create an account to view and connect with other users
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

        {/* Logged In: Show Search and User Cards */}
        {!authLoading && user && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
