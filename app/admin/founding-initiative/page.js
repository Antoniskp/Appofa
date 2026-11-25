'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import Pagination from '@/components/ui/Pagination';
import AlertMessage from '@/components/ui/AlertMessage';
import { useAsyncData } from '@/hooks/useAsyncData';
import { foundingInitiativeAPI } from '@/lib/api/foundingInitiative';

const statuses = ['requested', 'contacted', 'received'];
const allowedRoles = ['admin'];

function FoundingRequests() {
  const t = useTranslations('foundingInitiative');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState(false);
  const { data, loading, error, refetch } = useAsyncData(() => foundingInitiativeAPI.listInterests(page, filter), [page, filter]);

  async function saveStatus(event, userId) {
    event.preventDefault();
    const status = new FormData(event.currentTarget).get('signingStatus');
    setSaving(true);
    setSaveError('');
    setNotice(false);
    try {
      await foundingInitiativeAPI.updateSigningStatus(userId, status);
      await refetch();
      setNotice(true);
    } catch (err) {
      setSaveError(err.status === 404 ? t('requestGone') : t('saveError'));
      if (err.status === 404) await refetch();
    } finally {
      setSaving(false);
    }
  }

  return <AdminLayout>
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <AdminHeader title={t('adminTitle')} subtitle={t('adminIntro')} />
      <Link href="/founding-initiative" className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-800 underline">{t('openPublicPage')}</Link>
      <div className="mt-3 space-y-4">
        <label className="block text-sm font-medium text-slate-800">{t('filterRequests')}
          <select value={filter} onChange={event => { setFilter(event.target.value); setPage(1); setNotice(false); setSaveError(''); }} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2">
            {['all', ...statuses, 'volunteer'].map(item => <option key={item} value={item}>{t(`status_${item}`)}</option>)}
          </select>
        </label>
        {notice && <p role="status" className="text-sm text-teal-900">{t('statusSaved')}</p>}
        {saveError && <AlertMessage message={saveError} />}
        {loading ? <p role="status" className="text-sm text-slate-600">{t('loading')}</p> : error ? (
          <div><AlertMessage message={t('loadError')} /><button type="button" onClick={refetch} className="mt-2 min-h-11 text-sm font-semibold text-teal-800 underline">{t('retry')}</button></div>
        ) : data?.data?.length ? (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {data.data.map(row => <li key={row.userId} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="break-words font-semibold text-slate-900">{row.participant.username}</p>
                <a href={`mailto:${encodeURIComponent(row.participant.email)}`} className="break-all text-sm text-teal-800 underline">{row.participant.email}</a>
                {row.wantsToVolunteer && <p className="mt-1 text-xs text-slate-600">{t('status_volunteer')}</p>}
                {row.wantsToSign && <p className="mt-1 text-xs text-slate-600">{t('preferredMethod', { method: t(`method_${row.signingPreference || 'either'}`) })}</p>}
              </div>
              {row.wantsToSign && <form key={row.signingStatus} onSubmit={event => saveStatus(event, row.userId)} className="flex flex-wrap items-end gap-2">
                <label className="text-sm font-medium text-slate-800">{t('signingStatus')}
                  <select name="signingStatus" defaultValue={row.signingStatus} disabled={saving} className="mt-1 block min-h-10 rounded-lg border border-slate-300 bg-white px-2">
                    {statuses.map(status => <option key={status} value={status}>{t(`status_${status}`)}</option>)}
                  </select>
                </label>
                <button disabled={saving} className="min-h-10 rounded-lg border border-teal-300 px-3 text-sm font-semibold text-teal-900 hover:bg-teal-50 disabled:opacity-60">{t('saveStatus')}</button>
              </form>}
            </li>)}
          </ul>
        ) : <p className="rounded-xl border border-slate-200 bg-white p-4 text-slate-600">{t('noRequests')}</p>}
        {!loading && !error && data?.pagination?.totalPages > 1 && <Pagination currentPage={page} totalPages={data.pagination.totalPages} onPageChange={setPage} onPrevious={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
        {!loading && !error && page > 1 && data?.pagination?.totalPages < page && <button type="button" onClick={() => setPage(1)} className="min-h-11 text-sm font-semibold text-teal-800 underline">{t('firstPage')}</button>}
      </div>
    </div>
  </AdminLayout>;
}

export default function FoundingInitiativeAdminPage() {
  return <ProtectedRoute allowedRoles={allowedRoles}><FoundingRequests /></ProtectedRoute>;
}
