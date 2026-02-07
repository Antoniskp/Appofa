'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import Badge from '@/components/Badge';

const statusStyles = {
  healthy: 'bg-green-50 border-green-200 text-green-800',
  unhealthy: 'bg-red-50 border-red-200 text-red-800',
  unknown: 'bg-gray-50 border-gray-200 text-gray-700'
};

// Utility function to format camelCase to Title Case
const formatCheckName = (name) => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Tailwind class mappings for color-coded sections
const borderColorClasses = {
  blue: 'border-blue-500',
  purple: 'border-purple-500',
  green: 'border-green-500',
  yellow: 'border-yellow-500',
  red: 'border-red-500'
};

// Grid column mappings based on number of items
const gridColsMap = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3'
};

function HealthStatusContent() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadHealth = async () => {
    try {
      setErrorMessage('');
      setLoading(true);
      const response = await adminAPI.getHealthStatus();
      setHealth(response);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load health status.');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const overallStatus = health?.status || 'unknown';
  const statusClass = statusStyles[overallStatus] || statusStyles.unknown;

  const infrastructureChecks = health?.infrastructureChecks || {};
  const functionalChecks = health?.functionalChecks || {};

  // Organize functional checks by category
  const functionalCheckGroups = useMemo(() => ({
    articleCrud: {
      title: 'Article CRUD Operations',
      color: 'blue',
      checks: ['articleRead', 'articleCreate', 'articleUpdate', 'articleDelete']
    },
    frontpage: {
      title: 'Frontpage Functionality',
      color: 'purple',
      checks: ['frontpageQuery', 'frontpageFiltering']
    },
    authentication: {
      title: 'Authentication',
      color: 'green',
      checks: ['authValidation', 'sessionValidation']
    },
    locations: {
      title: 'Location Management',
      color: 'yellow',
      checks: ['locationRead', 'locationCreate', 'locationArticleLink']
    },
    newsApproval: {
      title: 'News Approval Workflows',
      color: 'red',
      checks: ['newsApprovalRead', 'newsStatusTransition']
    }
  }), []);

  const renderCheckCard = (key, check) => {
    const isHealthy = check.status === 'healthy';
    
    return (
      <div key={key} className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {formatCheckName(key)}
          </h3>
          <Badge variant={isHealthy ? 'success' : 'danger'}>
            <span aria-label={isHealthy ? 'Healthy' : 'Unhealthy'}>
              {isHealthy ? '✓' : '✗'}
            </span>
            {' '}
            {check.status}
          </Badge>
        </div>
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          {check.message && <p>{check.message}</p>}
          {typeof check.count === 'number' && <p>Count: {check.count}</p>}
          {typeof check.activeUsers === 'number' && <p>Active Users: {check.activeUsers}</p>}
          {typeof check.publishedCount === 'number' && <p>Published: {check.publishedCount}</p>}
          {typeof check.categoryCount === 'number' && <p>Categories: {check.categoryCount}</p>}
          {typeof check.linkCount === 'number' && <p>Links: {check.linkCount}</p>}
          {typeof check.pendingNews === 'number' && <p>Pending News: {check.pendingNews}</p>}
          {typeof check.approvedNews === 'number' && <p>Approved News: {check.approvedNews}</p>}
          {typeof check.totalNewsArticles === 'number' && <p>Total News: {check.totalNewsArticles}</p>}
          {typeof check.draftCount === 'number' && <p>Draft Articles: {check.draftCount}</p>}
          {check.sampleId && <p>Sample ID: {check.sampleId}</p>}
          {check.userId && <p>User ID: {check.userId}</p>}
          {check.role && <p>Role: {check.role}</p>}
          <p className="font-medium">Response Time: {check.responseTimeMs ?? '-'} ms</p>
          {check.error && (
            <p className="text-red-600 font-medium" role="alert">
              Error: {check.error}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
            <p className="text-gray-600">Review the latest status of core services and functional checks.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadHealth}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              type="button"
              aria-label="Refresh health status"
            >
              Refresh
            </button>
            <Link
              href="/admin"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-100 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">Running health checks...</p>
          </div>
        ) : errorMessage ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
            {errorMessage}
          </div>
        ) : (
          <>
            <div className={`border rounded-lg p-6 ${statusClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Overall Status: {overallStatus}</h2>
                  <p className="text-sm">
                    Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : '-'}
                  </p>
                </div>
                <div className="text-sm">
                  <p>API Response: {health?.responseTimeMs ?? '-'} ms</p>
                  <p>Uptime: {health?.uptime ? `${Math.floor(health.uptime)}s` : '-'}</p>
                </div>
              </div>
            </div>

            {/* Infrastructure Checks Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">Infrastructure Checks</h2>
                <Badge variant="info">Core Services</Badge>
              </div>
              {Object.keys(infrastructureChecks).length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                  No infrastructure checks available
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(infrastructureChecks).map(([key, check]) => 
                    renderCheckCard(key, check)
                  )}
                </div>
              )}
            </div>

            {/* Functional Checks Section */}
            {Object.keys(functionalChecks).length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">Functional Checks</h2>
                  <Badge variant="info">Feature Tests</Badge>
                </div>
                
                {Object.entries(functionalCheckGroups).map(([groupKey, group]) => {
                  // Filter only checks that exist in functionalChecks
                  const availableChecks = group.checks.filter(key => functionalChecks[key]);
                  
                  // Skip rendering this group if no checks are available
                  if (availableChecks.length === 0) return null;
                  
                  // Determine grid columns based on number of checks
                  const gridColsClass = gridColsMap[availableChecks.length] || 'md:grid-cols-2 lg:grid-cols-4';
                  
                  return (
                    <div key={groupKey} className="space-y-3">
                      <h3 className={`text-lg font-semibold text-gray-800 border-l-4 ${borderColorClasses[group.color]} pl-3`}>
                        {group.title}
                        <span className="sr-only"> - {availableChecks.length} check{availableChecks.length !== 1 ? 's' : ''}</span>
                      </h3>
                      <div className={`grid gap-4 ${gridColsClass}`}>
                        {availableChecks.map(key => 
                          renderCheckCard(key, functionalChecks[key])
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function HealthStatusPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <HealthStatusContent />
    </ProtectedRoute>
  );
}
