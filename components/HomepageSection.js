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
  items = [],
  emptyTitle,
  emptyDescription,
  skeletonCount = 3,
  bgColor = 'bg-white',
  renderItem,
  topTags = [],
  tagLinkPrefix,
  mapSlot,
}) {
  const r = useTranslations('redesign');
  return (
    <section className={`${bgColor} border-t border-gray-200`}>
      <div className="app-container py-12 sm:py-16">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="mb-2 h-1 w-12 rounded-full bg-copper" />
            <h2 className="section-title !mb-0">{title}</h2>
            {subtitle && <p className="mt-2 max-w-3xl text-base leading-relaxed text-[#62666A]">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {topTags.length > 0 && (
              <TopTagPills tags={topTags} linkPrefix={tagLinkPrefix || linkHref} />
            )}
            <Link
              href={linkHref}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-blue-600 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {r('viewAll')}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
        {mapSlot && !loading && <div className="mb-6">{mapSlot}</div>}
        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonLoader type="card" count={skeletonCount} variant="grid" />
          </div>
        )}
        {error && (
          <EmptyState
            type="error"
            title="Σφάλμα φόρτωσης"
            description={error}
            action={{ text: 'Δοκιμάστε ξανά', onClick: () => window.location.reload() }}
          />
        )}
        {!loading && !error && items.length === 0 && emptyTitle && (
          <EmptyState
            type="empty"
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {items.map(renderItem)}
          </div>
        )}
      </div>
    </section>
  );
}
