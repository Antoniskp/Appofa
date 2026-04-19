'use client';

import { useEffect, useRef } from 'react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function LoadMoreTrigger({
  hasMore,
  loading,
  onLoadMore,
  skeletonType = 'card',
  skeletonCount = 3
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore && !loading) return null;

  return (
    <div ref={ref} className="mt-8">
      {loading && <SkeletonLoader type={skeletonType} count={skeletonCount} />}
    </div>
  );
}
