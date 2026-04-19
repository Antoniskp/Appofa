'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Infinite pagination hook that accumulates items across pages.
 *
 * @param {Function} fetchFn async function `(page, limit) => Promise<{ items: Array, hasMore: boolean }>`
 * @param {number} limit page size
 * @param {Array} resetDeps dependency array that resets the list and reloads page 1
 * @returns {{
 *   items: Array,
 *   loading: boolean,
 *   initialLoading: boolean,
 *   error: string|null,
 *   hasMore: boolean,
 *   loadMore: Function,
 *   reset: Function
 * }}
 */
export function useInfiniteData(fetchFn, limit = 15, resetDeps = []) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async (pageToLoad, reset = false) => {
    if (reset) {
      setInitialLoading(true);
      setItems([]);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetchFn(pageToLoad, limit);
      if (!isMounted.current) return;

      const nextItems = result?.items || [];
      setItems((prev) => (reset ? nextItems : [...prev, ...nextItems]));
      setHasMore(result?.hasMore ?? false);
      setPage(pageToLoad);
    } catch (err) {
      if (isMounted.current) {
        setError(err?.message || 'Error loading data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  }, [fetchFn, limit]);

  // Reset when resetDeps change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load(1, true);
  }, resetDeps);

  const loadMore = useCallback(() => {
    if (!loading && !initialLoading && hasMore) {
      load(page + 1, false);
    }
  }, [loading, initialLoading, hasMore, load, page]);

  const reset = useCallback(() => {
    load(1, true);
  }, [load]);

  return { items, loading, initialLoading, error, hasMore, loadMore, reset };
}
