'use client';

import { useState } from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { manifestAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ui/Modal';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import ProtectedRoute from '@/components/ProtectedRoute';

const EMPTY_FORM = {
  slug: '',
  title: '',
  description: '',
  articleUrl: '',
  isActive: true,
  displayOrder: 0,
};

function ManifestsContent() {
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: manifests, loading, refetch } = useAsyncData(
    () => manifestAPI.getAllAdmin(),
    [],
    {
      initialData: [],
      transform: (res) => res?.data?.manifests || [],
    }
  );

  const openCreate = () => {
    setEditingSlug(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (manifest) => {
    setEditingSlug(manifest.slug);
    setForm({
      slug: manifest.slug,
      title: manifest.title,
      description: manifest.description || '',
      articleUrl: manifest.articleUrl,
      isActive: manifest.isActive,
      displayOrder: manifest.displayOrder ?? 0,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingSlug(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        displayOrder: parseInt(form.displayOrder, 10) || 0,
      };
      let res;
      if (editingSlug) {
        res = await manifestAPI.update(editingSlug, payload);
      } else {
        res = await manifestAPI.create(payload);
      }
      if (res?.success) {
        addToast(editingSlug ? 'Το μανιφέστο ενημερώθηκε.' : 'Το μανιφέστο δημιουργήθηκε.', { type: 'success' });
        cancelForm();
        refetch();
      } else {
        addToast(res?.message || 'Αποτυχία αποθήκευσης.', { type: 'error' });
      }
    } catch {
      addToast('Αποτυχία αποθήκευσης.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (manifest) => {
    try {
      const res = await manifestAPI.update(manifest.slug, { isActive: !manifest.isActive });
      if (res?.success) {
        addToast(
          !manifest.isActive ? 'Το μανιφέστο ενεργοποιήθηκε.' : 'Το μανιφέστο απενεργοποιήθηκε.',
          { type: 'success' }
        );
        refetch();
      } else {
        addToast(res?.message || 'Αποτυχία ενημέρωσης.', { type: 'error' });
      }
    } catch {
      addToast('Αποτυχία ενημέρωσης.', { type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await manifestAPI.remove(deleteTarget.slug);
      if (res?.success) {
        addToast('Το μανιφέστο διαγράφηκε.', { type: 'success' });
        setDeleteTarget(null);
        refetch();
      } else {
        addToast(res?.message || 'Αποτυχία διαγραφής.', { type: 'error' });
      }
    } catch {
      addToast('Αποτυχία διαγραφής.', { type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Διαχείριση Μανιφέστων"
        actionText="Νέο Μανιφέστο"
        onAction={openCreate}
      />

      {/* Create / Edit Form */}
      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingSlug ? 'Επεξεργασία Μανιφέστου' : 'Νέο Μανιφέστο'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="manifesto-general"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Τίτλος *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Μανιφέστο Αππόφασης"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Περιγραφή</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Σύντομη περιγραφή..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Άρθρου *</label>
                <input
                  type="url"
                  required
                  value={form.articleUrl}
                  onChange={(e) => setForm((f) => ({ ...f, articleUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.appofasi.gr/articles/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Σειρά Εμφάνισης</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={0}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isActive ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">{form.isActive ? 'Ενεργό' : 'Ανενεργό'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                Ακύρωση
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manifests Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader count={4} />
          </div>
        ) : manifests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">Δεν υπάρχουν μανιφέστα</p>
            <p className="text-sm">Δημιουργήστε το πρώτο μανιφέστο πατώντας «Νέο Μανιφέστο».</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Τίτλος / Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL Άρθρου</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Κατάσταση</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Σειρά</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Υποστηρικτές</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ενέργειες</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {manifests.map((manifest) => (
                  <tr key={manifest.slug} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{manifest.title}</div>
                      <div className="text-xs text-gray-500 font-mono">{manifest.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={manifest.articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate max-w-xs block"
                      >
                        {manifest.articleUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(manifest)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          manifest.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {manifest.isActive ? 'Ενεργό' : 'Ανενεργό'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{manifest.displayOrder}</td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{manifest.supportersCount ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(manifest)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Επεξεργασία"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(manifest)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Διαγραφή"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Διαγραφή Μανιφέστου"
        message={`Είστε σίγουροι ότι θέλετε να διαγράψετε το μανιφέστο "${deleteTarget?.title}"? Αυτή η ενέργεια δεν αναιρείται και θα διαγράψει και όλες τις αποδοχές.`}
        confirmText={deleting ? 'Διαγραφή...' : 'Διαγραφή'}
        cancelText="Ακύρωση"
        variant="danger"
      />
    </div>
  );
}

export default function AdminManifestsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'moderator']}>
      <AdminLayout>
        <ManifestsContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}
