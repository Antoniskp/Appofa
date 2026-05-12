'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';

function WorkerStatusContent() {
  const [healthResult, setHealthResult] = useState(null);
  const [snapshotResult, setSnapshotResult] = useState(null);
  const [healthError, setHealthError] = useState('');
  const [snapshotError, setSnapshotError] = useState('');
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [sendingSnapshot, setSendingSnapshot] = useState(false);

  const checkHealth = async () => {
    setLoadingHealth(true);
    setHealthError('');
    try {
      const response = await adminAPI.getWorkerHealthStatus();
      setHealthResult(response?.data || null);
    } catch (error) {
      setHealthResult(null);
      setHealthError(error.message || 'Worker health check failed.');
    } finally {
      setLoadingHealth(false);
    }
  };

  const sendTestSnapshot = async () => {
    setSendingSnapshot(true);
    setSnapshotError('');
    try {
      const testPayload = {
        type: 'appofa_mvp_test_snapshot',
        createdAt: new Date().toISOString(),
        source: 'admin-worker-status-page',
      };
      const response = await adminAPI.sendWorkerTestSnapshot(testPayload);
      setSnapshotResult(response?.data || null);
    } catch (error) {
      setSnapshotResult(null);
      setSnapshotError(error.message || 'Failed to send test snapshot.');
    } finally {
      setSendingSnapshot(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Worker Status</h1>
              <p className="text-gray-600">Debug connection to Appofasistis worker.</p>
            </div>
            <Link
              href="/admin"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-100 transition"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Worker health</h2>
              <button
                type="button"
                onClick={checkHealth}
                disabled={loadingHealth}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {loadingHealth ? 'Checking…' : 'Check health'}
              </button>
            </div>

            {healthError ? (
              <p className="text-sm text-red-600" role="alert">{healthError}</p>
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <p>Status code: <span className="font-medium">{healthResult?.status ?? '-'}</span></p>
                <p>Latency: <span className="font-medium">{healthResult?.latencyMs ?? '-'} ms</span></p>
                <p>Result: <span className="font-medium">{healthResult?.data ? 'Success' : 'No data'}</span></p>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Test snapshot</h2>
              <button
                type="button"
                onClick={sendTestSnapshot}
                disabled={sendingSnapshot}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60 transition"
              >
                {sendingSnapshot ? 'Sending…' : 'Send test snapshot'}
              </button>
            </div>

            {snapshotError ? (
              <p className="text-sm text-red-600" role="alert">{snapshotError}</p>
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <p>Status code: <span className="font-medium">{snapshotResult?.status ?? '-'}</span></p>
                <p>Latency: <span className="font-medium">{snapshotResult?.latencyMs ?? '-'} ms</span></p>
                <p>Result: <span className="font-medium">{snapshotResult?.data ? 'Success' : 'Not sent yet'}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function WorkerStatusPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <WorkerStatusContent />
    </ProtectedRoute>
  );
}
