'use client';

import Link from 'next/link';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';

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
}) {
  return (
    <section className={bgColor}>
      <div className="app-container py-16">
        <h2 className="section-title flex items-center gap-4">
          {title}
          <Link href={linkHref} className="btn-primary text-sm">
            Δείτε όλα
          </Link>
        </h2>
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
