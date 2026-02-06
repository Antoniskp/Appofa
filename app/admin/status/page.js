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

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
            <p className="text-gray-600">Review the latest status of core services and checks.</p>
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

            <div className="grid gap-4 md:grid-cols-2">
              {health?.checks &&
                Object.entries(health.checks).map(([key, check]) => (
                  <div key={key} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold capitalize">{key}</h3>
                      <Badge variant={check.status === 'healthy' ? 'success' : 'danger'}>
                        {check.status}
                      </Badge>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                      {check.message && <p>{check.message}</p>}
                      {typeof check.count === 'number' && <p>Count: {check.count}</p>}
                      <p>Response Time: {check.responseTimeMs ?? '-'} ms</p>
                      {check.error && <p className="text-red-600">Error: {check.error}</p>}
                    </div>
                  </div>
                ))}
            </div>
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
