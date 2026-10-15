'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { articleAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';
import VideoThumbnailCard from '@/components/articles/VideoThumbnailCard';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import LocationFilterBreadcrumb from '@/components/ui/LocationFilterBreadcrumb';
import { useAuth } from '@/lib/auth-context';

const PAGE_SIZE = 18;

/** Compact portrait skeleton cell for the video grid */
function VideoGridSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 animate-pulse">
      <div className="bg-gray-200 w-full" style={{ aspectRatio: '16/9' }} />
      <div className="p-2.5 space-y-1.5">
        <div className="h-3.5 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

function VideosContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // Filter state
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState('');
  const [videoKind, setVideoKind] = useState('');
  const tVideos = useTranslations('videos');
  const [locationId, setLocationId] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [countsLoaded, setCountsLoaded] = useState(false);

  // Feed state
  const [videos, setVideos] = useState([]);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sentinel ref for IntersectionObserver (infinite scroll trigger)
  const sentinelRef = useRef(null);
  // Track in-flight request to avoid duplicate fetches
  const fetchingRef = useRef(false);
  const requestRef = useRef(0);
  // Track current filters so we can reset feed when they change
  const filtersRef = useRef({ search, category, locationId, videoKind });

  const videoCategoryOptions = (articleCategories.articleTypes?.video?.categories ?? []).map(
    (cat) => (typeof cat === 'string' ? { value: cat, label: cat } : cat)
  );

  /** Fetch one page of videos and append (or replace on reset) */
  const fetchPage = useCallback(async (pageNum, currentSearch, currentCategory, currentLocationId, currentVideoKind, replace = false) => {
    if (fetchingRef.current && !replace) return;
    const requestId = ++requestRef.current;
    fetchingRef.current = true;

    if (replace) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const params = {
        page: pageNum,
        limit: PAGE_SIZE,
        type: 'video',
        status: 'published',
      };
      if (currentVideoKind) params.videoKind = currentVideoKind;
      if (currentSearch) params.search = currentSearch;
      if (currentCategory) params.category = currentCategory;
      if (currentLocationId) params.locationId = currentLocationId;

      const response = await articleAPI.getAll(params);
      if (requestId !== requestRef.current) return;
      const articles = response?.data?.articles || [];
      const totalPages = response?.data?.pagination?.totalPages || 1;

      if (replace) {
        setVideos(articles);
      } else {
        setVideos((prev) => [...prev, ...articles]);
      }
      pageRef.current = pageNum;
      setHasMore(pageNum < totalPages);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setError(err?.message || 'Σφάλμα κατά τη φόρτωση βίντεο. Δοκιμάστε ξανά.');
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setInitialLoading(false);
        fetchingRef.current = false;
      }
    }
  }, []);

  /** Initial load — runs when search or category filter changes */
  useEffect(() => {
    filtersRef.current = { search, category, locationId, videoKind };
    pageRef.current = 1;
    setHasMore(true);
    // fetchPage is a stable useCallback — safe to include in deps
    fetchPage(1, search, category, locationId, videoKind, true);
  }, [search, category, locationId, videoKind, fetchPage]);

  /** Refresh topic counts for the selected video kind. */
  useEffect(() => {
    let active = true;
    setCountsLoaded(false);
    setCategoryCounts({});
    articleAPI.getCategoryCounts({ type: 'video', status: 'published', videoKind })
      .then((res) => { if (active && res?.success) setCategoryCounts(res.data.counts); })
      .catch((err) => console.error('Failed to fetch video category counts:', err))
      .finally(() => { if (active) setCountsLoaded(true); });
    return () => { active = false; };
  }, [videoKind]);

  /** Load next page when sentinel enters viewport */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !fetchingRef.current) {
          fetchPage(pageRef.current + 1, filtersRef.current.search, filtersRef.current.category, filtersRef.current.locationId, filtersRef.current.videoKind, false);
        }
      },
      { rootMargin: '300px 0px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, fetchPage]);

  const handleSearchChange = (e) => setSearch(e.target.value);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{tVideos('title')}</h1>
          <p className="mt-2 text-gray-600">{tVideos('subtitle')}</p>
        </header>
        <div className="mb-6 flex flex-wrap gap-2" aria-label={tVideos('kind_label')}>
          {['', 'educational', 'news'].map((kind) => (
            <button key={kind} type="button" aria-pressed={videoKind === kind}
              onClick={() => { setVideoKind(kind); setCategory(''); }}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition-colors ${videoKind === kind ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-blue-50'}`}>
              {tVideos(kind || 'all')}
            </button>
          ))}
        </div>
        {/* Location Breadcrumb */}
        <LocationFilterBreadcrumb
          value={locationId}
          onChange={(id) => setLocationId(id)}
        />

        {/* Search and Category Pills */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <SearchInput
              name="search"
              placeholder="Αναζήτηση βίντεο..."
              value={search}
              onChange={handleSearchChange}
              className="w-full sm:flex-grow sm:max-w-md min-w-0"
            />
            {user && (
              <Link
                href="/videos/new"
                className="inline-flex min-w-0 max-w-full items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium sm:justify-start sm:whitespace-nowrap"
              >
                <PlusCircleIcon className="h-5 w-5 shrink-0" />
                Προσθήκη Βίντεο
              </Link>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">{tVideos('topics')}</p>
            <div className="flex flex-wrap gap-2">
              {[{ value: '', label: tVideos('all_topics') }, ...videoCategoryOptions].map((topic) => (
                <button key={topic.value} type="button" aria-pressed={category === topic.value}
                  onClick={() => setCategory(topic.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${category === topic.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'}`}>
                  {topic.label}{countsLoaded && categoryCounts[topic.value] > 0 && <span className="ml-1 text-xs opacity-70">({categoryCounts[topic.value]})</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Initial loading skeletons */}
        {initialLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VideoGridSkeleton />
            <VideoGridSkeleton />
            <VideoGridSkeleton />
            <VideoGridSkeleton />
            <VideoGridSkeleton />
            <VideoGridSkeleton />
          </div>
        )}

        {/* Error state */}
        {!initialLoading && error && (
          <EmptyState
            type="error"
            title="Σφάλμα Φόρτωσης Βίντεο"
            description={error}
            action={{
              text: 'Δοκιμάστε Ξανά',
              onClick: () => {
                setError(null);
                fetchPage(1, search, category, locationId, videoKind, true);
              },
            }}
          />
        )}

        {/* Empty state */}
        {!initialLoading && !error && videos.length === 0 && (
          <EmptyState
            type="empty"
            title="Δεν Βρέθηκαν Βίντεο"
            description="Δεν υπάρχουν βίντεο που να ταιριάζουν με τα κριτήρια αναζήτησής σας. Δοκιμάστε να αλλάξετε τα φίλτρα."
          />
        )}

        {/* Video grid */}
        {!initialLoading && !error && videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="animate-fadeIn"
              >
                <VideoThumbnailCard article={video} />
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" aria-hidden="true" />

        {/* Loading more spinner */}
        {loading && !initialLoading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" aria-label="Φόρτωση..." />
          </div>
        )}

        {/* End of feed message */}
        {!loading && !hasMore && videos.length > 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            Δεν υπάρχουν άλλα βίντεο
          </p>
        )}
      </div>
    </div>
  );
}

export default function VideosPage() {
  const tCommon = useTranslations('common');

  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen py-8 flex items-center justify-center">
        <p className="text-gray-600">{tCommon('loading')}</p>
      </div>
    }>
      <VideosContent />
    </Suspense>
  );
}
