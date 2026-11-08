'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import TopTagPills from '@/components/ui/TopTagPills';

export default function HomepageSection({
  title,
  subtitle,
  linkHref,
  loading,
  error,
  onRetry,
  items = [],
  emptyTitle,
  emptyDescription,
  skeletonCount = 3,
  bgColor = 'bg-white',
  renderItem,
  topTags = [],
  tagLinkPrefix,
  mapSlot,
  introSlot,
}) {
  const r = useTranslations('redesign');
  const t = useTranslations('homeRecovery');
  return (
    <section aria-label={title} aria-busy={Boolean(loading)} className={`${bgColor} border-t border-brand-border/70`}>
      <div className="app-container py-10 sm:py-14">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="mb-3 h-1 w-12 rounded-full bg-copper" />
            <h2 className="section-title !mb-0">{title}</h2>
            {subtitle && <p className="mt-2 max-w-3xl text-base leading-relaxed text-[#62666A]">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {topTags.length > 0 && (
              <TopTagPills tags={topTags} linkPrefix={tagLinkPrefix || linkHref} />
            )}
            <Link
              href={linkHref}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-charcoal shadow-sm transition-all hover:border-copper/50 hover:bg-ivory hover:shadow focus:outline-none focus:ring-2 focus:ring-copper"
            >
              {r('viewAll')}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
        {introSlot}
        {mapSlot && !loading && <div className="mb-6">{mapSlot}</div>}
        {loading && items.length === 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonLoader type="card" count={skeletonCount} variant="grid" />
          </div>
        )}
        {error && !loading && (
          <div role="alert">
            <EmptyState
              type="error"
              title={t('title')}
              description={t('description')}
              action={onRetry ? { text: t('retry'), onClick: onRetry } : undefined}
            />
          </div>
        )}
        {!loading && !error && items.length === 0 && emptyTitle && (
          <EmptyState
            type="empty"
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {items.map(renderItem)}
          </div>
        )}
      </div>
    </section>
  );
}
