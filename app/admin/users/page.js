'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrashIcon, ShieldCheckIcon, UserGroupIcon, ShieldExclamationIcon, UserIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI, locationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import { StatsCard } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import Modal from '@/components/ui/Modal';
import Tooltip from '@/components/ui/Tooltip';
import { TooltipIconButton } from '@/components/ui/Tooltip';
import Pagination from '@/components/ui/Pagination';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';

const USERS_PER_PAGE = 20;

function AdminUsersContent() {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [page, setPage] = useState(1);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [roleChangeNewRole, setRoleChangeNewRole] = useState('');
  const [selectedLocationForRole, setSelectedLocationForRole] = useState('');
  const [verifyingUserId, setVerifyingUserId] = useState(null);
  const [moderatorLocationOverrides, setModeratorLocationOverrides] = useState({});

  // Fetch users with server-side pagination and filtering
  const { data: usersData, loading, refetch } = useAsyncData(
    async () => {
      const params = { page, limit: USERS_PER_PAGE };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (roleFilter) params.role = roleFilter;
      if (verifiedFilter) params.verified = verifiedFilter;
      const response = await authAPI.getAdminUsers(params);
      if (response.success) {
        return response.data;
      }
      return { users: [], stats: null, pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    },
    [page, searchQuery, roleFilter, verifiedFilter],
    {
      initialData: { users: [], stats: null, pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } },
    }
  );

  const users = usersData?.users || [];
  const stats = usersData?.stats || { total: 0, byRole: {} };
  const pagination = usersData?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 };

  // Fetch locations for moderator assignment (sorted alphabetically)
  const { data: locations } = useAsyncData(
    async () => {
      const response = await locationAPI.getAll({ limit: 500 });
      if (response.success) {
        const locs = response.locations || [];
        return locs.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'el'));
      }
      return [];
    },
    [],
    { initialData: [] }
  );

  // Handle search submit (debounced by Enter or button)
  const handleSearch = (e) => {
    e?.preventDefault?.();
    setSearchQuery(searchInput);
    setPage(1);
  };

  // Role change
  const handleRoleChange = async (targetUser, newRole) => {
    if (newRole === 'moderator') {
      setRoleChangeTarget(targetUser);
      setRoleChangeNewRole(newRole);
      const defaultLocationId = targetUser.homeLocationId ? String(targetUser.homeLocationId) : '';
      setSelectedLocationForRole(defaultLocationId);
      setRoleChangeDialogOpen(true);
      return;
    }

    try {
      const response = await authAPI.updateUserRole(targetUser.id, newRole);
      if (response.success) {
        await refetch();
        addToast('Ο ρόλος ενημερώθηκε επιτυχώς!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Αποτυχία αλλαγής ρόλου: ${error.message}`, { type: 'error' });
    }
  };

  const confirmRoleChange = async () => {
    if (!roleChangeTarget || !roleChangeNewRole) return;

    let locationId;
    if (roleChangeNewRole === 'moderator') {
      const parsed = Number.parseInt(selectedLocationForRole, 10);
      if (!Number.isInteger(parsed) || parsed < 1) {
        addToast('Απαιτείται έγκυρη τοποθεσία για τον ρόλο συντονιστή.', { type: 'error' });
        return;
      }
      locationId = parsed;
    }

    setRoleChangeDialogOpen(false);
    try {
      const response = await authAPI.updateUserRole(roleChangeTarget.id, roleChangeNewRole, locationId);
      if (response.success) {
        await refetch();
        addToast('Ο ρόλος ενημερώθηκε επιτυχώς!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Αποτυχία αλλαγής ρόλου: ${error.message}`, { type: 'error' });
    } finally {
      setRoleChangeTarget(null);
      setRoleChangeNewRole('');
      setSelectedLocationForRole('');
    }
  };

  // Moderator location change
  const handleModeratorLocationChange = async (targetUser, nextLocationId) => {
    const parsed = Number.parseInt(nextLocationId, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      addToast('Επιλέξτε έγκυρη τοποθεσία.', { type: 'error' });
      return;
    }

    try {
      const response = await authAPI.updateUserRole(targetUser.id, 'moderator', parsed);
      if (response.success) {
        setModeratorLocationOverrides((prev) => ({ ...prev, [targetUser.id]: parsed }));
        await refetch();
        addToast('Η τοποθεσία συντονιστή ενημερώθηκε!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Αποτυχία ενημέρωσης: ${error.message}`, { type: 'error' });
    }
  };

  const getModeratorLocationOptions = (targetUser) => {
    const baseLocations = Array.isArray(locations) ? locations : [];
    const overriddenLocationId = moderatorLocationOverrides[targetUser?.id];
    const effectiveHomeLocationId = overriddenLocationId || targetUser?.homeLocationId;

    if (!effectiveHomeLocationId) return baseLocations;

    const hasCurrentLocation = baseLocations.some(
      (location) => Number(location.id) === Number(effectiveHomeLocationId)
    );

    if (hasCurrentLocation) return baseLocations;

    if (!overriddenLocationId && targetUser.homeLocation?.id && targetUser.homeLocation?.name) {
      return [
        { id: targetUser.homeLocation.id, name: targetUser.homeLocation.name, type: targetUser.homeLocation.type, slug: targetUser.homeLocation.slug },
        ...baseLocations
      ];
    }

    return [
      { id: effectiveHomeLocationId, name: `Location #${effectiveHomeLocationId}` },
      ...baseLocations
    ];
  };

  // Verify user
  const handleVerifyUser = async (targetUser, isVerified) => {
    setVerifyingUserId(targetUser.id);
    try {
      const response = await authAPI.verifyUser(targetUser.id, isVerified);
      if (response.success) {
        await refetch();
        addToast(isVerified ? 'Ο χρήστης επαληθεύτηκε!' : 'Η επαλήθευση αφαιρέθηκε!', { type: 'success' });
      }
    } catch (error) {
      addToast(`Αποτυχία ενημέρωσης: ${error.message}`, { type: 'error' });
    } finally {
      setVerifyingUserId(null);
    }
  };

  const canVerifyUser = (targetUser) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'moderator' && user.homeLocationId && targetUser.homeLocationId) return true;
    return false;
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await authAPI.adminDeleteUser(deleteTarget.id);
      await refetch();
      addToast('Ο χρήστης διαγράφηκε επιτυχώς.', { type: 'success' });
    } catch (error) {
      addToast(`Αποτυχία διαγραφής: ${error.message}`, { type: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const ROLE_LABELS = {
    admin: 'Διαχειριστής',
    moderator: 'Συντονιστής',
    editor: 'Αρθρογράφος',
    viewer: 'Χρήστης',
    candidate: 'Υποψήφιος',
  };

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container">
          <AdminHeader title="Διαχείριση Χρηστών" subtitle={`${pagination.totalItems} χρήστες συνολικά`} />

          {/* Stats Cards */}
          {stats?.byRole && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <StatsCard title="Σύνολο" value={stats.total || 0} icon={UserGroupIcon} />
              <StatsCard title="Διαχειριστές" value={stats.byRole.admin || 0} icon={ShieldCheckIcon} />
              <StatsCard title="Συντονιστές" value={stats.byRole.moderator || 0} icon={ShieldExclamationIcon} />
              <StatsCard title="Αρθρογράφοι" value={stats.byRole.editor || 0} icon={UserIcon} />
              <StatsCard title="Χρήστες" value={stats.byRole.viewer || 0} icon={UserIcon} />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="userSearch" className="block text-xs font-medium text-gray-500 mb-1">Αναζήτηση</label>
                <input
                  id="userSearch"
                  type="text"
                  placeholder="Όνομα, email, username..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="roleFilter" className="block text-xs font-medium text-gray-500 mb-1">Ρόλος</label>
                <select
                  id="roleFilter"
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Όλοι</option>
                  <option value="admin">Διαχειριστής</option>
                  <option value="moderator">Συντονιστής</option>
                  <option value="editor">Αρθρογράφος</option>
                  <option value="viewer">Χρήστης</option>
                </select>
              </div>
              <div>
                <label htmlFor="verifiedFilter" className="block text-xs font-medium text-gray-500 mb-1">Επαλήθευση</label>
                <select
                  id="verifiedFilter"
                  value={verifiedFilter}
                  onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Όλοι</option>
                  <option value="true">Επαληθευμένοι</option>
                  <option value="false">Μη επαληθευμένοι</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Αναζήτηση
              </button>
              {(searchQuery || roleFilter || verifiedFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setRoleFilter('');
                    setVerifiedFilter('');
                    setPage(1);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Καθαρισμός
                </button>
              )}
            </form>
          </div>

          {/* Users Table */}
          {loading && <SkeletonLoader count={5} type="card" />}

          {!loading && users.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
              Δεν βρέθηκαν χρήστες.
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Χρήστης</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Ρόλος</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Τοποθεσία Συντονιστή</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Τοποθεσία</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Εγγραφή</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Κατάσταση</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        {/* Username + Name */}
                        <td className="px-4 py-3">
                          <Link href={`/profile/${u.username}`} className="font-medium text-gray-900 hover:text-blue-600">
                            {u.username}
                          </Link>
                          <p className="text-xs text-gray-400">
                            {[u.firstNameNative, u.lastNameNative].filter(Boolean).join(' ') || '—'}
                          </p>

                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <Tooltip content="Αλλαγή ρόλου χρήστη" position="top">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                              <option value="viewer">Χρήστης</option>
                              <option value="editor">Αρθρογράφος</option>
                              <option value="moderator">Συντονιστής</option>
                              <option value="admin">Διαχειριστής</option>
                            </select>
                          </Tooltip>
                        </td>

                        {/* Moderator Location */}
                        <td className="px-4 py-3">
                          {u.role === 'moderator' ? (
                            <select
                              value={String(moderatorLocationOverrides[u.id] || u.homeLocationId || '')}
                              onChange={(e) => handleModeratorLocationChange(u, e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-sm max-w-[200px]"
                            >
                              <option value="">Επιλογή τοποθεσίας</option>
                              {getModeratorLocationOptions(u).map((loc) => (
                                <option key={loc.id} value={String(loc.id)}>
                                  {loc.name} (#{loc.id})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>

                        {/* Home Location */}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {u.homeLocation?.name || '—'}
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(u.createdAt).toLocaleDateString('el-GR')}
                        </td>

                        {/* Verified status */}
                        <td className="px-4 py-3">
                          {canVerifyUser(u) ? (
                            <button
                              onClick={() => handleVerifyUser(u, !u.isVerified)}
                              disabled={verifyingUserId === u.id}
                              className={`px-2 py-1 text-xs rounded border transition ${
                                u.isVerified
                                  ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {verifyingUserId === u.id
                                ? '...'
                                : u.isVerified ? '✓ Επαληθευμένος' : 'Επαλήθευση'}
                            </button>
                          ) : (
                            <span className={`text-xs ${u.isVerified ? 'text-blue-600' : 'text-gray-400'}`}>
                              {u.isVerified ? '✓ Επαληθευμένος' : '—'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          {user?.role === 'admin' && u.role !== 'admin' && u.id !== user?.id && (
                            <TooltipIconButton
                              icon={TrashIcon}
                              tooltip="Διαγραφή χρήστη"
                              onClick={() => {
                                setDeleteTarget(u);
                                setDeleteDialogOpen(true);
                              }}
                              variant="danger"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setPage(p)}
                onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Role Change Dialog */}
      <Modal
        isOpen={roleChangeDialogOpen}
        onClose={() => {
          setRoleChangeDialogOpen(false);
          setRoleChangeTarget(null);
          setRoleChangeNewRole('');
          setSelectedLocationForRole('');
        }}
        title="Αντιστοίχιση Τοποθεσίας Συντονιστή"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setRoleChangeDialogOpen(false);
                setRoleChangeTarget(null);
                setRoleChangeNewRole('');
                setSelectedLocationForRole('');
              }}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Ακύρωση
            </button>
            <button
              type="button"
              onClick={confirmRoleChange}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Επιβεβαίωση
            </button>
          </>
        }
      >
        <label htmlFor="roleLocationSelect" className="text-gray-700 mb-2 block">
          Επιλέξτε τοποθεσία για τον συντονιστή:
        </label>
        <select
          id="roleLocationSelect"
          aria-label="Τοποθεσία συντονιστή"
          value={selectedLocationForRole}
          onChange={(e) => setSelectedLocationForRole(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Επιλέξτε τοποθεσία</option>
          {(locations ?? []).map((loc) => (
            <option key={loc.id} value={String(loc.id)}>
              {loc.name} (#{loc.id})
            </option>
          ))}
        </select>
      </Modal>

      {/* Delete User Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDeleteUser}
        title="Διαγραφή Χρήστη"
        message={`Είστε σίγουροι ότι θέλετε να διαγράψετε μόνιμα τον χρήστη "${deleteTarget?.username}"; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.`}
        confirmText="Διαγραφή"
        cancelText="Ακύρωση"
        variant="danger"
      />
    </AdminLayout>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}
