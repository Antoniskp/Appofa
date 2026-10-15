'use client';

import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useAdminQueues } from '@/hooks/useAdminQueues';
import { useAsyncData } from '@/hooks/useAsyncData';
import { reportAPI } from '@/lib/api';
import { getVisibleAdminNavSections } from './adminNav';

export default function AdminQueues() {
  const t = useTranslations('adminWorkspace');
  const format = useFormatter();
  const { user } = useAuth();
  const { data, loading, refetch } = useAdminQueues(user?.role);
  const oldest = useAsyncData(async () => {
    const result = await reportAPI.getAll({ status: 'pending', page: 1, limit: 5, order: 'asc' });
    if (!result.success) throw new Error('Unavailable');
    return result.data.reports;
  }, [data], { initialData: [] });
  const queues = getVisibleAdminNavSections(user?.role).find((section) => section.label === 'Queues')?.items || [];
  return <section className="mb-8 space-y-4" aria-label={t('needsAttention')}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">{t('needsAttention')}</h2>
      <button onClick={refetch} disabled={loading} className="text-blue-700 underline disabled:opacity-50">{t('refresh')}</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {queues.map((queue) => <Link key={queue.href} href={`${queue.href}?status=${queue.href === '/admin/candidates' ? 'submitted' : 'pending'}`} className="rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-400">
        <span className="block text-sm text-gray-600">{t(`nav.${queue.label.replace(/[^a-zA-Z]/g, '')}`)}</span>
        <strong className="block text-3xl my-2">{data[queue.href] ?? (loading ? '…' : '—')}</strong>
        <span className="text-xs text-gray-500">{data[queue.href] == null ? t(loading ? 'loading' : 'unavailable') : t('awaitingReview')}</span>
      </Link>)}
    </div>
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold mb-3">{t('oldestReports')}</h3>
      {oldest.error ? <p role="alert">{t('unavailable')} <button className="text-blue-700 underline" onClick={oldest.refetch}>{t('retry')}</button></p>
        : oldest.loading ? <p role="status">{t('loading')}</p>
          : oldest.data.length ? <ul className="divide-y divide-gray-100">{oldest.data.map((report) => <li key={report.id} className="py-2 flex justify-between gap-3">
            <Link className="text-blue-700 underline" href={`/admin/reports?status=pending&order=asc&report=${report.id}`}>{t('reportNumber', { id: report.id })}</Link>
            <span className="text-sm text-gray-600">{format.relativeTime(new Date(report.createdAt))}</span>
          </li>)}</ul> : <p className="text-gray-500">{t('queueClear')}</p>}
    </div>
  </section>;
}
