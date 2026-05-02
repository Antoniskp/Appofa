'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { articleAPI } from '@/lib/api';
import ArticleCard from '@/components/articles/ArticleCard';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import EmptyState from '@/components/ui/EmptyState';
import { useInfiniteData } from '@/hooks/useInfiniteData';
import SearchInput from '@/components/ui/SearchInput';
import { useAuth } from '@/lib/auth-context';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';
import LoadMoreTrigger from '@/components/ui/LoadMoreTrigger';

const FEED_TYPES = ['all', 'news', 'articles', 'video'];

const PAGE_SIZE = 15;

function FeedContent() {
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');
  const { user } = useAuth();

  const [activeType, setActiveType] = useState('all');
  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState(null);

  const { items, loading, initialLoading, error, hasMore, loadMore } = useInfiniteData(
    async (p, lim) => {
      const params = {
        page: p,
        limit: lim,
        status: 'published',
      };
      if (activeType !== 'all') params.type = activeType;
      if (search) params.search = search;
      if (locationId) params.locationId = locationId;
      const response = await articleAPI.getAll(params);
      const fetchedItems = response?.data?.articles || [];
      const pagination = response?.data?.pagination || {};
      return {
        items: fetchedItems,
        hasMore: (pagination.currentPage ?? p) < (pagination.totalPages ?? 1),
      };
    },
    PAGE_SIZE,
    [activeType, search, locationId]
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
          {user && (
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <PlusCircleIcon className="h-5 w-5" />
              {t('create_article')}
            </Link>
          )}
        </div>

        {/* Unified filter toolbar */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 space-y-3">
          {/* Row 1: Search + Location */}
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1 min-w-0">
              <SearchInput
                name="search"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <LocationFilterBreadcrumb
              value={locationId}
              onChange={setLocationId}
            />
          </div>
          {/* Row 2: Type filter pills */}
          <div className="flex flex-wrap gap-2">
            {FEED_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {t(`filter_${type}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {initialLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonLoader type="card" count={6} />
          </div>
        )}

        {/* Error */}
        {error && (
          <EmptyState
            type="error"
            title={t('error_loading')}
            description={error}
            action={{ text: tCommon('try_again'), onClick: () => window.location.reload() }}
          />
        )}

        {/* Empty */}
        {!initialLoading && !error && items.length === 0 && (
          <EmptyState
            type="empty"
            title={t('no_items_found')}
            description={t('no_items_description')}
          />
        )}

        {/* Feed grid */}
        {!error && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ArticleCard key={item.id} article={item} variant="grid" />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {!initialLoading && !error && items.length > 0 && (
          <LoadMoreTrigger
            hasMore={hasMore}
            loading={loading}
            onLoadMore={loadMore}
            skeletonType="card"
            skeletonCount={3}
          />
        )}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const tCommon = useTranslations('common');
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen py-8 flex items-center justify-center">
        <p className="text-gray-600">{tCommon('loading')}</p>
      </div>
    }>
      <FeedContent />
    </Suspense>
  );
}
