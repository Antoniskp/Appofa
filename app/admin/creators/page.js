'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Pagination from '@/components/ui/Pagination';
import { useAsyncData } from '@/hooks/useAsyncData';
import { tiktokCreatorAPI } from '@/lib/api/tiktokCreators';
import { videoPinAPI } from '@/lib/api/videoPins';
import { getVideoPinWatchUrl } from '@/lib/utils/videoPinMarkers';
import { tikTokProfileUrl } from '@/config/tiktokCreators';

const REVIEW_STATUSES = ['pending', 'approved', 'rejected'];
const STAFF_ROLES = ['admin', 'moderator'];
const actionClass = 'min-h-10 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-50';

function TikTokReviewQueue() {
  const t = useTranslations('tiktokCreators');
  const [view, setView] = useState('listings');
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState(null);
  const [notice, setNotice] = useState(null);
  const { data, loading, error, refetch } = useAsyncData(async () => {
    if (view === 'streams') {
      const res = await videoPinAPI.getAll({ include: 'all', contentType: 'live', sourceProvider: 'tiktok', status: 'pending' });
      return { items: res.data.videoPins, totalPages: 1 };
    }
    const res = await tiktokCreatorAPI.getReviewQueue({ status, page });
    return { items: res.data.creators, totalPages: res.data.totalPages };
  }, [page, status, view]);

  const review = async (item, nextStatus) => {
    setSavingId(item.id);
    setNotice(null);
    try {
      if (view === 'streams') await videoPinAPI.update(item.id, { status: nextStatus });
      else await tiktokCreatorAPI.review(item.id, { status: nextStatus, expectedStatus: item.status });
      setNotice({ error: false, text: t('review.saved') });
      if (page > 1 && data.items.length === 1) setPage(page - 1);
      else await refetch();
    } catch (err) {
      setNotice({ error: true, text: t(err.status === 409 ? 'review.changed' : 'review.error') });
      if (err.status === 409) await refetch();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AdminHeader title={t('review.title')} subtitle={t('review.subtitle')} />
      <Link href="/creators" className="text-sm font-semibold text-blue-700 hover:underline">{t('title')}</Link>
      <div className="my-4 flex flex-wrap gap-2">
        {['listings', 'streams'].map((value) => (
          <button key={value} type="button" aria-pressed={view === value} disabled={savingId !== null}
            className={`${actionClass} ${view === value ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => { setView(value); setPage(1); setNotice(null); }}>{t(`review.${value}`)}</button>
        ))}
      </div>
      {view === 'listings' && <label className="mb-4 flex items-center gap-3 text-sm font-medium">
        {t('review.status')}
        <select value={status} disabled={savingId !== null} onChange={(event) => { setStatus(event.target.value); setPage(1); setNotice(null); }}
          className="rounded-md border border-gray-300 bg-white px-3 py-2">
          {REVIEW_STATUSES.map((value) => <option key={value} value={value}>{t(`review.${value}`)}</option>)}
        </select>
      </label>}
      {notice && <p role={notice.error ? 'alert' : 'status'} className={`mb-4 text-sm ${notice.error ? 'text-red-800' : 'text-green-800'}`}>{notice.text}</p>}
      {loading ? <p role="status">{t('loading')}</p>
        : error ? <p role="alert">{t('loadError')} <button type="button" onClick={refetch} className="underline">{t('retry')}</button></p>
          : !data?.items.length ? <p>{t('review.empty')}</p>
            : <ul className="space-y-3">
              {data.items.map((item) => {
                const isStream = view === 'streams';
                const url = isStream ? getVideoPinWatchUrl(item) : tikTokProfileUrl(item.handle);
                const title = isStream ? item.title : item.displayName || `@${item.handle}`;
                const details = isStream ? (item.isExpired ? t('review.expired') : `${item.lat}, ${item.lng}`)
                  : [item.category && t(`categories.${item.category}`), item.location?.name_local || item.location?.name].filter(Boolean).join(' · ');
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
                    <div className="min-w-0 break-words">
                      <h2 className="font-semibold text-gray-900">{title}</h2>
                      {url && <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-700 hover:underline">
                        {isStream ? item.creatorHandle || t('openTikTok') : `@${item.handle}`}
                      </a>}
                      {details && <p className="text-sm text-gray-600">{details}</p>}
                    </div>
                    <div className="flex gap-2">
                      {item.status !== 'approved' && !item.isExpired && <button type="button" disabled={savingId !== null}
                        onClick={() => review(item, 'approved')} className={actionClass}>{t('review.approve')}</button>}
                      {item.status !== 'rejected' && <button type="button" disabled={savingId !== null}
                        onClick={() => review(item, isStream ? 'hidden' : 'rejected')} className={actionClass}>
                        {t(isStream || item.status === 'approved' ? 'review.hide' : 'review.reject')}
                      </button>}
                    </div>
                  </li>
                );
              })}
            </ul>}
      {!loading && !error && <Pagination currentPage={page} totalPages={data?.totalPages ?? 0} onPageChange={setPage}
        onPrevious={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />}
    </div>
  );
}

export default function AdminTikTokCreatorsPage() {
  return <ProtectedRoute allowedRoles={STAFF_ROLES}><AdminLayout><TikTokReviewQueue /></AdminLayout></ProtectedRoute>;
}
