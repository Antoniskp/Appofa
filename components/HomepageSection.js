'use client';

import Link from 'next/link';
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
}) {
  return (
    <section className={bgColor}>
      <div className="app-container py-16">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h2 className="section-title !mb-0">{title}</h2>
          <Link href={linkHref} className="px-4 py-1 rounded-full border border-blue-600 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
            Δείτε όλα
          </Link>
          {topTags.length > 0 && (
            <TopTagPills tags={topTags} linkPrefix={tagLinkPrefix || linkHref} />
          )}
        </div>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        {!loading && !error && items.length === 0 && (
          <EmptyState
            type="empty"
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map(renderItem)}
          </div>
        )}
      </div>
    </section>
  );
}
