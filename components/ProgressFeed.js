'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { suggestionAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import AlertMessage from '@/components/ui/AlertMessage';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function ProgressFeed({ preview = false }) {
  const t = useTranslations('democracy');
  const r = useTranslations('redesign');
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useAsyncData(() => suggestionAPI.getProgress(page), [page]);
  if (loading) return <SkeletonLoader count={3} />;
  if (error) return <div><AlertMessage message={error} /><button onClick={refetch} className="mt-3 min-h-11 underline">{t('retry')}</button></div>;
  const rows = data?.data || [];
  if (!rows.length) return <div className="rounded-2xl border border-dashed border-brand-border bg-white p-8"><p className="font-semibold">{t('emptyProgress')}</p><p className="mt-2 text-sm text-[#62666A]">{t('emptyProgressBody')}</p><Link className="mt-4 inline-block min-h-11 py-2 font-semibold text-copper" href="/suggestions">{t('proposals')} →</Link></div>;
  return <>
    <ol className="ml-2 border-l border-copper/40">{(preview ? rows.slice(0, 3) : rows).map(proposal => {
      const progress = proposal.progress;
      const event = progress.history?.at(-1);
      const date = event?.at || proposal.updatedAt;
      const evidenceUrl = /^https?:\/\//i.test(progress.evidenceUrl || '') ? progress.evidenceUrl : null;
      return <li key={proposal.id} className="relative pb-8 pl-7 last:pb-0 sm:pl-10"><span aria-hidden="true" className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-copper" /><article className="grid gap-4 rounded-xl bg-white p-5 sm:p-7 lg:grid-cols-[11rem_1fr] lg:gap-8">
        <div><time dateTime={date} className="text-sm text-[#62666A]">{new Date(date).toLocaleDateString(locale)}</time><p className="mt-2 text-sm font-semibold text-copper">{t(`stage_${progress.stage}`)}</p><p className="mt-2 text-sm text-[#62666A]">{proposal.location?.name || t('allCommunities')}</p></div>
        <div className="min-w-0"><h3 className="text-xl font-semibold"><Link href={`/suggestions/${proposal.id}`} className="hover:text-copper">{proposal.title} →</Link></h3><p className="mt-3 whitespace-pre-line break-words leading-relaxed text-[#62666A]">{progress.note}</p><p className="mt-4 text-sm text-[#62666A]">{event?.publisherRole ? r('reportedBy', { role: r(event.publisherRole === 'administrator' ? 'administrator' : 'author') }) : t('reportedShort')}</p>{evidenceUrl && <a href={evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-copper underline underline-offset-4">{r('evidence')} ↗</a>}</div>
      </article></li>;
    })}</ol>
    {!preview && <nav aria-label={t('pagination')} className="mt-8 flex flex-wrap items-center gap-4"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="min-h-11 rounded-lg border border-brand-border px-4 py-2 disabled:opacity-40">{t('previous')}</button><span>{page} / {data.pagination.totalPages}</span><button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="min-h-11 rounded-lg border border-brand-border px-4 py-2 disabled:opacity-40">{t('next')}</button></nav>}
  </>;
}
