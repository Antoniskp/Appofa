'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { articleAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';
import VideoFeedCard from '@/components/articles/VideoFeedCard';
import EmptyState from '@/components/EmptyState';
import SearchInput from '@/components/SearchInput';
import CategoryPills from '@/components/CategoryPills';
import { useAuth } from '@/lib/auth-context';

const PAGE_SIZE = 10;

/** Full-width video skeleton card shown while loading more */
function VideoCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200 w-full" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded" />
          <div className="h-5 w-20 bg-gray-100 rounded-full" />
        </div>
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

export default function VideosPage() {
  const { user } = useAuth();

  // Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

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
  const filtersRef = useRef({ search, category });

  // Ref for "currently playing" video so we can pause it when another plays
  const currentPauseFnRef = useRef(null);

  const videoCategoryOptions = (articleCategories.articleTypes?.video?.categories ?? []).map(
    (cat) => (typeof cat === 'string' ? { value: cat, label: cat } : cat)
  );

  /** Fetch one page of videos and append (or replace on reset) */
  const fetchPage = useCallback(async (pageNum, currentSearch, currentCategory, replace = false) => {
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
    filtersRef.current = { search, category };
    setPage(1);
    setHasMore(true);
    // fetchPage is a stable useCallback — safe to include in deps
    fetchPage(1, search, category, true);
  }, [search, category, fetchPage]);

  /** Load next page when sentinel enters viewport */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !fetchingRef.current) {
          setPage((prev) => {
            const next = prev + 1;
            fetchPage(next, filtersRef.current.search, filtersRef.current.category, false);
            return next;
          });
        }
      },
      { rootMargin: '300px 0px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, fetchPage]);

  /** When a video starts playing, pause the previously playing one */
  const handleVideoPlay = useCallback((pauseFn) => {
    if (currentPauseFnRef.current && currentPauseFnRef.current !== pauseFn) {
      currentPauseFnRef.current();
    }
    currentPauseFnRef.current = pauseFn;
  }, []);

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleCategorySelect = (cat) => setCategory(cat);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Βίντεο</h1>
          {user && (
            <Link
              href="/videos/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Προσθήκη Βίντεο
            </Link>
          )}
        </div>

        {/* Search and Category Pills */}
        <div className="flex flex-col gap-4 mb-8">
          <SearchInput
            name="search"
            placeholder="Αναζήτηση βίντεο..."
            value={search}
            onChange={handleSearchChange}
          />
          <CategoryPills
            categories={videoCategoryOptions}
            selected={category}
            onSelect={handleCategorySelect}
          />
        </div>

        {/* Initial loading skeletons */}
        {initialLoading && (
          <div className="space-y-6">
            <VideoCardSkeleton />
            <VideoCardSkeleton />
            <VideoCardSkeleton />
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
                fetchPage(1, search, category, true);
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

        {/* Video feed */}
        {!initialLoading && !error && videos.length > 0 && (
          <div className="space-y-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="animate-fadeIn"
              >
                <VideoFeedCard article={video} onPlay={handleVideoPlay} />
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
