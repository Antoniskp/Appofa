'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowPathIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { tikTokProfileUrl } from '@/config/tiktokCreators';
import { buildTikTokCreatorEmbedUrl } from '@/lib/utils/tiktokEmbed';

export default function TikTokCreatorCard({ creator }) {
  const t = useTranslations('tiktokCreators');
  const locale = useLocale();
  const [refreshAt, setRefreshAt] = useState(null);
  const [loadedRefreshAt, setLoadedRefreshAt] = useState(null);
  const handle = `@${creator.handle}`;
  const refreshing = refreshAt !== loadedRefreshAt;

  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
      <div className="flex-1 p-4">
        {creator.category && <span className="mb-2 inline-block rounded-full bg-ivory px-2.5 py-1 text-xs font-semibold text-copper">{t(`categories.${creator.category}`)}</span>}
        <h3 className="break-words text-lg font-bold text-charcoal">{creator.displayName || handle}</h3>
        {creator.displayName && <p className="break-words text-sm text-gray-600">{handle}</p>}
        {creator.location && (
          <Link href={`/locations/${creator.location.slug || creator.location.id}`} className="mt-2 inline-flex items-center gap-1.5 text-sm text-gray-700 hover:underline">
            <MapPinIcon className="h-4 w-4 shrink-0 text-copper" aria-hidden="true" />{creator.location.name_local || creator.location.name}
          </Link>
        )}
      </div>
      <iframe key={refreshAt} src={buildTikTokCreatorEmbedUrl(creator.handle, locale, refreshAt)} title={t('embedProfile', { handle })}
        loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer" allow="autoplay 'none'" aria-busy={refreshing} onLoad={() => setLoadedRefreshAt(refreshAt)}
        className="block h-[25rem] w-full border-y border-brand-border bg-ivory" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm font-semibold text-copper">
        <button type="button" aria-label={t('refreshProfile', { handle })}
          onClick={() => setRefreshAt(Date.now())} className="inline-flex min-h-11 items-center gap-1.5 hover:underline">
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
          <span aria-live="polite">{t(refreshing ? 'refreshingTikTok' : 'refreshTikTok')}</span>
        </button>
        {creator.username && <Link href={`/users/${encodeURIComponent(creator.username)}`} className="inline-flex min-h-11 items-center hover:underline">{t('openAppofasiProfile')}</Link>}
        <a href={tikTokProfileUrl(creator.handle)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center hover:underline">{t('openTikTok')}</a>
        <Link href={`/live?creator=${encodeURIComponent(creator.handle)}`} className="inline-flex min-h-11 items-center hover:underline">{t('streamsOnMap')}</Link>
      </div>
    </li>
  );
}
