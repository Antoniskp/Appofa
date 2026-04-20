'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ToastProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { useAsyncData } from '@/hooks/useAsyncData';
import { geoAdminAPI } from '@/lib/api';

const PERIODS = [
  { key: '7d', label: '7 ημέρες' },
  { key: '30d', label: '30 ημέρες' },
  { key: 'all', label: 'Όλο το ιστορικό' },
];

const STATUS_META = {
  unlocked: { label: 'Ξεκλείδωτη', className: 'bg-emerald-100 text-emerald-700' },
  funding: { label: 'Χρηματοδότηση', className: 'bg-amber-100 text-amber-700' },
  locked: { label: 'Κλειδωμένη', className: 'bg-gray-200 text-gray-700' },
  none: { label: 'Χωρίς εγγραφή', className: 'bg-blue-100 text-blue-700' },
};

const countryCodeToFlag = (code) =>
  code ? [...code.toUpperCase()].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('') : '🌍';

const euro = (value) => Number(value || 0).toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function GeoAdminContent() {
  const router = useRouter();
  const { isAdmin } = usePermissions();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('traffic');
  const [period, setPeriod] = useState('7d');
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fundingForm, setFundingForm] = useState({
    id: null,
    locationId: '',
    goalAmount: '500',
    donationUrl: '',
    status: 'locked',
    notes: '',
  });

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, router]);

  const { data: visits, loading: visitsLoading, refetch: refetchVisits } = useAsyncData(
    async () => {
      const res = await geoAdminAPI.getVisits({ period });
      if (!res?.success) throw new Error(res?.message || 'Αποτυχία φόρτωσης επισκεψιμότητας.');
      return res.data || { totalVisits: 0, byCountry: [], topPaths: [] };
    },
    [period],
    {
      initialData: { totalVisits: 0, byCountry: [], topPaths: [] },
      onError: (message) => addToast(message || 'Αποτυχία φόρτωσης επισκεψιμότητας.', { type: 'error' }),
    }
  );

  const { data: countries, loading: countriesLoading, refetch: refetchCountries } = useAsyncData(
    async () => {
      const res = await geoAdminAPI.getCountries();
      if (!res?.success) throw new Error(res?.message || 'Αποτυχία φόρτωσης χωρών.');
      return res.data || [];
    },
    [],
    {
      initialData: [],
      onError: (message) => addToast(message || 'Αποτυχία φόρτωσης χωρών.', { type: 'error' }),
    }
  );

  const { data: fundingRecords, loading: fundingLoading, refetch: refetchFunding } = useAsyncData(
    async () => {
      const res = await geoAdminAPI.listFunding();
      if (!res?.success) throw new Error(res?.message || 'Αποτυχία φόρτωσης χρηματοδοτήσεων.');
      return res.data || [];
    },
    [],
    {
      initialData: [],
      onError: (message) => addToast(message || 'Αποτυχία φόρτωσης χρηματοδοτήσεων.', { type: 'error' }),
    }
  );

  const summary = useMemo(() => {
    const byCountry = visits?.byCountry || [];
    return {
      totalVisits: visits?.totalVisits || 0,
      uniqueCountries: byCountry.length,
      authenticated: byCountry.reduce((sum, row) => sum + Number(row.authenticated || 0), 0),
      diaspora: byCountry.reduce((sum, row) => sum + Number(row.diaspora || 0), 0),
    };
  }, [visits]);

  const availableCreateCountries = useMemo(
    () => (countries || []).filter((row) => row.locationId && !row.funding),
    [countries]
  );

  const closeFundingModal = () => {
    setIsFundingModalOpen(false);
    setFundingForm({
      id: null,
      locationId: '',
      goalAmount: '500',
      donationUrl: '',
      status: 'locked',
      notes: '',
    });
  };

  const openCreateModal = (locationId = '') => {
    setFundingForm({
      id: null,
      locationId: locationId ? String(locationId) : '',
      goalAmount: '500',
      donationUrl: '',
      status: 'locked',
      notes: '',
    });
    setIsFundingModalOpen(true);
  };

  const openEditModal = (record) => {
    setFundingForm({
      id: record.id,
      locationId: String(record.locationId || ''),
      goalAmount: String(record.goalAmount ?? 500),
      donationUrl: record.donationUrl || '',
      status: record.status || 'locked',
      notes: record.notes || '',
    });
    setIsFundingModalOpen(true);
  };

  const refreshCountryData = async () => {
    await Promise.all([refetchCountries(), refetchFunding(), refetchVisits()]);
  };

  const handleSaveFunding = async () => {
    const goalAmount = Number(fundingForm.goalAmount);
    if (!fundingForm.id && !fundingForm.locationId) {
      addToast('Επιλέξτε χώρα.', { type: 'error' });
      return;
    }
    if (!Number.isFinite(goalAmount) || goalAmount <= 0) {
      addToast('Ο στόχος πρέπει να είναι θετικός αριθμός.', { type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      if (fundingForm.id) {
        await geoAdminAPI.updateFunding(fundingForm.id, {
          goalAmount,
          donationUrl: fundingForm.donationUrl || null,
          status: fundingForm.status,
          notes: fundingForm.notes || null,
        });
      } else {
        const created = await geoAdminAPI.createFunding({
          locationId: Number(fundingForm.locationId),
          goalAmount,
          donationUrl: fundingForm.donationUrl || null,
          notes: fundingForm.notes || null,
        });
        if (fundingForm.status !== 'locked' && created?.data?.id) {
          await geoAdminAPI.updateFunding(created.data.id, { status: fundingForm.status });
        }
      }

      await refreshCountryData();
      closeFundingModal();
      addToast('Η εγγραφή χρηματοδότησης αποθηκεύτηκε.', { type: 'success' });
    } catch (error) {
      addToast(error.message || 'Αποτυχία αποθήκευσης.', { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFunding = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await geoAdminAPI.deleteFunding(deleteTarget.id);
      await refreshCountryData();
      addToast('Η εγγραφή χρηματοδότησης διαγράφηκε.', { type: 'success' });
    } catch (error) {
      addToast(error.message || 'Αποτυχία διαγραφής.', { type: 'error' });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminHeader title="Γεωγραφικά & Χώρες" subtitle="Επισκεψιμότητα ανά χώρα, διασπορά και χρηματοδότηση." />

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('traffic')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'traffic'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Επισκεψιμότητα
          </button>
          <button
            onClick={() => setActiveTab('countries')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'countries'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Διαχείριση Χωρών
          </button>
        </div>

        {activeTab === 'traffic' ? (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPeriod(item.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === item.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Συνολικές Επισκέψεις', value: summary.totalVisits },
                { label: 'Μοναδικές Χώρες', value: summary.uniqueCountries },
                { label: 'Συνδεδεμένοι Χρήστες', value: summary.authenticated },
                { label: 'Διασπορά', value: summary.diaspora },
              ].map((card) => (
                <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            {visitsLoading ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <SkeletonLoader count={3} />
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 font-semibold">Χώρες</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Χώρα</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Επισκέψεις</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Συνδεδεμένοι</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Διασπορά</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">% του Συνόλου</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(visits?.byCountry || []).map((row) => {
                          const pct = summary.totalVisits > 0 ? ((Number(row.visits || 0) / summary.totalVisits) * 100) : 0;
                          return (
                            <tr key={row.countryCode || row.countryName} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {countryCodeToFlag(row.countryCode)} {row.countryName || row.countryCode || 'Άγνωστη χώρα'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.visits || 0}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.authenticated || 0}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{row.diaspora || 0}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{pct.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                        {(visits?.byCountry || []).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Δεν υπάρχουν δεδομένα.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 font-semibold">Κορυφαίες Διαδρομές</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Διαδρομή</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Επισκέψεις</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(visits?.topPaths || []).map((row) => (
                          <tr key={row.path} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 break-all">{row.path}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.visits || 0}</td>
                          </tr>
                        ))}
                        {(visits?.topPaths || []).length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-4 py-6 text-center text-sm text-gray-500">Δεν υπάρχουν δεδομένα.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold">Χώρες (Σύνοψη)</h2>
              </div>
              {countriesLoading ? (
                <div className="p-6">
                  <SkeletonLoader count={2} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Χώρα</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Επισκέψεις</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Έχει Περιεχόμενο</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Κατάσταση χρηματοδότησης</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ενέργειες</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(countries || []).map((row) => {
                        const statusKey = row.funding?.status || 'none';
                        const statusMeta = STATUS_META[statusKey] || STATUS_META.none;
                        return (
                          <tr key={`${row.countryCode}-${row.countryName}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {countryCodeToFlag(row.countryCode)} {row.countryName || row.countryCode || 'Άγνωστη χώρα'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.totalVisits || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.hasContent ? '✅' : '❌'}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.className}`}>
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {row.locationId ? (
                                row.funding ? (
                                  <button
                                    onClick={() => {
                                      const record = (fundingRecords || []).find((item) => item.locationId === row.locationId);
                                      if (record) openEditModal(record);
                                    }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                                  >
                                    ✏️ Επεξεργασία
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openCreateModal(row.locationId)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50"
                                  >
                                    ➕ Δημιουργία
                                  </button>
                                )
                              ) : (
                                <span className="text-xs text-gray-400">Χωρίς location</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {(countries || []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">Δεν υπάρχουν δεδομένα.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold">Εγγραφές Χρηματοδότησης</h2>
                <button
                  onClick={() => openCreateModal('')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  ➕ Νέα εγγραφή
                </button>
              </div>
              {fundingLoading ? (
                <div className="p-6">
                  <SkeletonLoader count={2} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Χώρα</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Στόχος (€)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Συγκεντρώθηκαν (€)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Δωρητές</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Κατάσταση</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ξεκλειδώθηκε</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ενέργειες</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(fundingRecords || []).map((record) => {
                        const goal = Number(record.goalAmount || 0);
                        const current = Number(record.currentAmount || 0);
                        const pct = Math.min(100, goal > 0 ? (current / goal) * 100 : 0);
                        const statusMeta = STATUS_META[record.status] || STATUS_META.locked;
                        return (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {countryCodeToFlag(record.location?.code)} {record.location?.name || '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{euro(goal)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 min-w-[220px]">
                              <div className="font-medium">{euro(current)}</div>
                              <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{record.donorCount || 0}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.className}`}>
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {record.unlockedAt ? new Date(record.unlockedAt).toLocaleDateString('el-GR') : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => openEditModal(record)}
                                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs"
                                  title="Επεξεργασία"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(record)}
                                  className="px-2.5 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs"
                                  title="Διαγραφή"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {(fundingRecords || []).length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">Δεν υπάρχουν εγγραφές.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <Modal
        isOpen={isFundingModalOpen}
        onClose={closeFundingModal}
        title={fundingForm.id ? 'Επεξεργασία χρηματοδότησης' : 'Δημιουργία χρηματοδότησης'}
        size="md"
        footer={(
          <>
            <button
              type="button"
              onClick={closeFundingModal}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
            >
              Ακύρωση
            </button>
            <button
              type="button"
              onClick={handleSaveFunding}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {isSaving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          {!fundingForm.id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Χώρα</label>
              <select
                value={fundingForm.locationId}
                onChange={(e) => setFundingForm((prev) => ({ ...prev, locationId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Επιλέξτε χώρα</option>
                {availableCreateCountries.map((row) => (
                  <option key={row.locationId} value={row.locationId}>
                    {row.countryName} ({row.countryCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Στόχος (€)</label>
            <input
              type="number"
              min="1"
              value={fundingForm.goalAmount}
              onChange={(e) => setFundingForm((prev) => ({ ...prev, goalAmount: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Συνδρομή URL</label>
            <input
              type="text"
              value={fundingForm.donationUrl}
              onChange={(e) => setFundingForm((prev) => ({ ...prev, donationUrl: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={fundingForm.status}
              onChange={(e) => setFundingForm((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="locked">Κλειδωμένη</option>
              <option value="funding">Χρηματοδότηση</option>
              <option value="unlocked">Ξεκλείδωτη</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Σημειώσεις</label>
            <textarea
              rows={4}
              value={fundingForm.notes}
              onChange={(e) => setFundingForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFunding}
        title="Διαγραφή χρηματοδότησης"
        message={`Να διαγραφεί η εγγραφή για ${deleteTarget?.location?.name || 'αυτή τη χώρα'};`}
        confirmText={isDeleting ? 'Διαγραφή...' : 'Διαγραφή'}
        cancelText="Ακύρωση"
        variant="danger"
      />
    </div>
  );
}

export default function AdminGeoPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout>
        <GeoAdminContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}
