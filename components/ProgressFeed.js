'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { suggestionAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import AlertMessage from '@/components/ui/AlertMessage';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function ProgressFeed({ preview = false }) {
  const t = useTranslations('democracy');
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useAsyncData(() => suggestionAPI.getProgress(page), [page]);
  if (loading) return <SkeletonLoader count={3} />;
  if (error) return <div><AlertMessage message={error} /><button onClick={refetch} className="mt-3 underline">{t('retry')}</button></div>;
  const rows = data?.data || [];
  if (!rows.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8"><p className="font-semibold text-slate-800">{t('emptyProgress')}</p><p className="mt-2 text-sm text-slate-600">{t('emptyProgressBody')}</p><Link className="mt-4 inline-block font-semibold text-teal-800" href="/suggestions">{t('proposals')} →</Link></div>;
  return <>
    <div className="grid gap-4 md:grid-cols-3">{(preview ? rows.slice(0, 3) : rows).map(proposal => <Link key={proposal.id} href={`/suggestions/${proposal.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-600 hover:shadow-md">
      <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">{t(`stage_${proposal.progress.stage}`)}</span>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{proposal.title}</h3>
      <p className="mt-2 text-sm text-slate-600">{proposal.location?.name || t('allCommunities')}</p>
      <p className="mt-3 line-clamp-3 text-sm text-slate-700">{proposal.progress.note}</p>
      <p className="mt-4 text-xs text-slate-500">{t('reportedShort')} · {new Date(proposal.updatedAt).toLocaleDateString()}</p>
    </Link>)}</div>
    {!preview && <nav aria-label={t('pagination')} className="mt-6 flex items-center gap-4"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">{t('previous')}</button><span>{page} / {data.pagination.totalPages}</span><button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">{t('next')}</button></nav>}
  </>;
}
