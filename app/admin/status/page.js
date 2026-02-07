'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/api';
import Badge from '@/components/Badge';

const statusStyles = {
  healthy: 'bg-green-50 border-green-200 text-green-800',
  unhealthy: 'bg-red-50 border-red-200 text-red-800',
  unknown: 'bg-gray-50 border-gray-200 text-gray-700'
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

  const renderCheckCard = (key, check) => (
    <div key={key} className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </h3>
        <Badge variant={check.status === 'healthy' ? 'success' : 'danger'}>
          {check.status === 'healthy' ? '✓' : '✗'} {check.status}
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
        {check.error && <p className="text-red-600">Error: {check.error}</p>}
      </div>
    </div>
  );

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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(infrastructureChecks).map(([key, check]) => 
                  renderCheckCard(key, check)
                )}
              </div>
            </div>

            {/* Functional Checks Section */}
            {Object.keys(functionalChecks).length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">Functional Checks</h2>
                  <Badge variant="info">Feature Tests</Badge>
                </div>
                
                {/* Article CRUD Operations */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-l-4 border-blue-500 pl-3">
                    Article CRUD Operations
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {['articleRead', 'articleCreate', 'articleUpdate', 'articleDelete'].map(key => 
                      functionalChecks[key] && renderCheckCard(key, functionalChecks[key])
                    )}
                  </div>
                </div>

                {/* Frontpage Functionality */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-l-4 border-purple-500 pl-3">
                    Frontpage Functionality
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {['frontpageQuery', 'frontpageFiltering'].map(key => 
                      functionalChecks[key] && renderCheckCard(key, functionalChecks[key])
                    )}
                  </div>
                </div>

                {/* Authentication */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-l-4 border-green-500 pl-3">
                    Authentication
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {['authValidation', 'sessionValidation'].map(key => 
                      functionalChecks[key] && renderCheckCard(key, functionalChecks[key])
                    )}
                  </div>
                </div>

                {/* Location Management */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-l-4 border-yellow-500 pl-3">
                    Location Management
                  </h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {['locationRead', 'locationCreate', 'locationArticleLink'].map(key => 
                      functionalChecks[key] && renderCheckCard(key, functionalChecks[key])
                    )}
                  </div>
                </div>

                {/* News Approval Workflows */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-l-4 border-red-500 pl-3">
                    News Approval Workflows
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {['newsApprovalRead', 'newsStatusTransition'].map(key => 
                      functionalChecks[key] && renderCheckCard(key, functionalChecks[key])
                    )}
                  </div>
                </div>
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
