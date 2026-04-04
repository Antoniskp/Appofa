'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { articleAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';
import VideoThumbnailCard from '@/components/articles/VideoThumbnailCard';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import CategoryPills from '@/components/ui/CategoryPills';
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

export default function VideosPage() {
  const { user } = useAuth();

  // Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [locationId, setLocationId] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [countsLoaded, setCountsLoaded] = useState(false);

  // Feed state
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sentinel ref for IntersectionObserver (infinite scroll trigger)
  const sentinelRef = useRef(null);
  // Track in-flight request to avoid duplicate fetches
  const fetchingRef = useRef(false);
  // Track current filters so we can reset feed when they change
  const filtersRef = useRef({ search, category, locationId });

  const videoCategoryOptions = (articleCategories.articleTypes?.video?.categories ?? []).map(
    (cat) => (typeof cat === 'string' ? { value: cat, label: cat } : cat)
  );

  /** Fetch one page of videos and append (or replace on reset) */
  const fetchPage = useCallback(async (pageNum, currentSearch, currentCategory, currentLocationId, replace = false) => {
    if (fetchingRef.current) return;
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
      if (currentSearch) params.search = currentSearch;
      if (currentCategory) params.category = currentCategory;
      if (currentLocationId) params.locationId = currentLocationId;

      const response = await articleAPI.getAll(params);
      const articles = response?.data?.articles || [];
      const totalPages = response?.data?.pagination?.totalPages || 1;

      if (replace) {
        setVideos(articles);
      } else {
        setVideos((prev) => [...prev, ...articles]);
      }
      setHasMore(pageNum < totalPages);
    } catch (err) {
      setError(err?.message || 'Σφάλμα κατά τη φόρτωση βίντεο. Δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  /** Initial load — runs when search or category filter changes */
  useEffect(() => {
    filtersRef.current = { search, category, locationId };
    setPage(1);
    setHasMore(true);
    // fetchPage is a stable useCallback — safe to include in deps
    fetchPage(1, search, category, locationId, true);
  }, [search, category, locationId, fetchPage]);

  /** Fetch category counts once on mount */
  useEffect(() => {
    articleAPI.getCategoryCounts({ type: 'video', status: 'published' })
      .then((res) => { if (res?.success) setCategoryCounts(res.data.counts); })
      .catch((err) => console.error('Failed to fetch video category counts:', err))
      .finally(() => setCountsLoaded(true));
  }, []);

  /** Load next page when sentinel enters viewport */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !fetchingRef.current) {
          setPage((prev) => {
            const next = prev + 1;
            fetchPage(next, filtersRef.current.search, filtersRef.current.category, filtersRef.current.locationId, false);
            return next;
          });
        }
      },
      { rootMargin: '300px 0px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, fetchPage]);

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleCategorySelect = (cat) => setCategory(cat);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Location Breadcrumb */}
        <LocationFilterBreadcrumb
          value={locationId}
          onChange={(id) => setLocationId(id)}
        />

        {/* Search and Category Pills */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-3">
            <SearchInput
              name="search"
              placeholder="Αναζήτηση βίντεο..."
              value={search}
              onChange={handleSearchChange}
              className="flex-grow max-w-md"
            />
            {user && (
              <Link
                href="/videos/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <PlusCircleIcon className="h-5 w-5" />
                Προσθήκη Βίντεο
              </Link>
            )}
          </div>
          <CategoryPills
            categories={videoCategoryOptions}
            selected={category}
            onSelect={handleCategorySelect}
            counts={categoryCounts}
            countsLoaded={countsLoaded}
          />
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
                fetchPage(1, search, category, locationId, true);
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
