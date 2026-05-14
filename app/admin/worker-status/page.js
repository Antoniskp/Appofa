'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ToastProvider';
import { adminAPI } from '@/lib/api';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

function WorkerStatusContent() {
  const { success: showSuccess } = useToast();
  const [healthResult, setHealthResult] = useState(null);
  const [snapshotResult, setSnapshotResult] = useState(null);
  const [workerTokens, setWorkerTokens] = useState([]);
  const [healthError, setHealthError] = useState('');
  const [snapshotError, setSnapshotError] = useState('');
  const [tokensError, setTokensError] = useState('');
  const [createError, setCreateError] = useState('');
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [sendingSnapshot, setSendingSnapshot] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [creatingToken, setCreatingToken] = useState(false);
  const [createdToken, setCreatedToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [revokingTokenId, setRevokingTokenId] = useState(null);
  const createdTokenInputRef = useRef(null);
  const copyResetTimeoutRef = useRef(null);

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

  const loadWorkerTokens = async () => {
    setLoadingTokens(true);
    setTokensError('');
    try {
      const response = await adminAPI.listWorkerTokens();
      setWorkerTokens(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setWorkerTokens([]);
      setTokensError(error.message || 'Failed to load worker tokens.');
    } finally {
      setLoadingTokens(false);
    }
  };

  const resetCreateModalState = () => {
    setIsCreateModalOpen(false);
    setTokenName('');
    setCreatingToken(false);
    setCreateError('');
    setCreatedToken('');
    setCopiedToken(false);
    if (copyResetTimeoutRef.current) {
      clearTimeout(copyResetTimeoutRef.current);
      copyResetTimeoutRef.current = null;
    }
  };

  const handleCreateToken = async (event) => {
    event.preventDefault();
    setCreatingToken(true);
    setCreateError('');
    try {
      const response = await adminAPI.createWorkerToken({ name: tokenName.trim() });
      setCreatedToken(response?.data?.token || '');
      await loadWorkerTokens();
    } catch (error) {
      setCreateError(error.message || 'Failed to create worker token.');
    } finally {
      setCreatingToken(false);
    }
  };

  const handleCopyToken = async () => {
    if (!createdToken) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(createdToken);
      } else if (createdTokenInputRef.current) {
        createdTokenInputRef.current.focus();
        createdTokenInputRef.current.select();
        document.execCommand('copy');
      }
      setCopiedToken(true);
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
      copyResetTimeoutRef.current = setTimeout(() => {
        setCopiedToken(false);
        copyResetTimeoutRef.current = null;
      }, 1500);
    } catch {
      setCreateError('Copy failed. Please select and copy the token manually.');
    }
  };

  const handleRevokeToken = async (token) => {
    const confirmed = window.confirm(
      `Revoke token '${token.name}'? This cannot be undone and will immediately invalidate the token.`
    );
    if (!confirmed) return;

    setRevokingTokenId(token.id);
    setTokensError('');
    try {
      await adminAPI.revokeWorkerToken(token.id);
      showSuccess(`Token '${token.name}' revoked successfully.`);
      await loadWorkerTokens();
    } catch (error) {
      setTokensError(error.message || 'Failed to revoke worker token.');
    } finally {
      setRevokingTokenId(null);
    }
  };

  useEffect(() => {
    checkHealth();
    loadWorkerTokens();
  }, []);

  useEffect(() => {
    if (!createdToken || !createdTokenInputRef.current) return;
    createdTokenInputRef.current.focus();
    createdTokenInputRef.current.select();
  }, [createdToken]);

  useEffect(() => () => {
    if (copyResetTimeoutRef.current) {
      clearTimeout(copyResetTimeoutRef.current);
    }
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

          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Worker Tokens</h2>
                <p className="text-sm text-gray-600">Manage API tokens for worker authentication</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateError('');
                  setCreatedToken('');
                  setCopiedToken(false);
                  setTokenName('');
                  setIsCreateModalOpen(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Create Token
              </button>
            </div>

            {tokensError ? (
              <p className="text-sm text-red-600" role="alert">{tokensError}</p>
            ) : null}

            {loadingTokens ? (
              <p className="text-sm text-gray-600">Loading tokens...</p>
            ) : workerTokens.length === 0 ? (
              <p className="text-sm text-gray-600">
                No worker tokens created yet. Click &apos;Create Token&apos; to generate one.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Token Name</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Last Used</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {workerTokens.map((token) => {
                      const isRevoked = Boolean(token.revoked_at);
                      const isRevoking = revokingTokenId === token.id;
                      return (
                        <tr key={token.id}>
                          <td className="px-4 py-3 text-gray-900">{token.name}</td>
                          <td className="px-4 py-3 text-gray-700">{formatDateTime(token.created_at)}</td>
                          <td className="px-4 py-3 text-gray-700">{formatDateTime(token.last_used_at)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                isRevoked
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {isRevoked ? 'Revoked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!isRevoked ? (
                              <button
                                type="button"
                                onClick={() => handleRevokeToken(token)}
                                disabled={isRevoking}
                                className="border border-red-300 text-red-700 px-3 py-1.5 rounded hover:bg-red-50 disabled:opacity-60 transition"
                              >
                                {isRevoking ? 'Revoking...' : 'Revoke'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={resetCreateModalState}
        title="Create Worker Token"
        size="md"
        footer={createdToken ? (
          <button
            type="button"
            onClick={resetCreateModalState}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Close
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={resetCreateModalState}
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-worker-token-form"
              disabled={creatingToken}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {creatingToken ? 'Creating...' : 'Create Token'}
            </button>
          </>
        )}
      >
        {createdToken ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              ⚠️ <strong>Save this token now!</strong> You won&apos;t be able to see it again.
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="created-worker-token">
                Generated token
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="created-worker-token"
                  ref={createdTokenInputRef}
                  type="text"
                  readOnly
                  value={createdToken}
                  className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900"
                />
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="shrink-0 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  {copiedToken ? 'Copied!' : 'Copy Token'}
                </button>
              </div>
            </div>
            {createError ? (
              <p className="text-sm text-red-600" role="alert">{createError}</p>
            ) : null}
          </div>
        ) : (
          <form id="create-worker-token-form" onSubmit={handleCreateToken} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="worker-token-name">
                Token Name
              </label>
              <input
                id="worker-token-name"
                type="text"
                value={tokenName}
                onChange={(event) => setTokenName(event.target.value)}
                required
                maxLength={100}
                placeholder="e.g., PC Worker #1"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            {createError ? (
              <p className="text-sm text-red-600" role="alert">{createError}</p>
            ) : null}
          </form>
        )}
      </Modal>
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
