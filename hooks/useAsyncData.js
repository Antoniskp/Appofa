'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for handling async data fetching with loading, error, and data states.
 * Provides consistent error handling, loading states, and automatic refetching.
 * 
 * @param {Function} fetchFunction - Async function that returns data
 * @param {Array} dependencies - Array of dependencies that trigger refetch (like useEffect deps)
 * @param {Object} options - Optional configuration object
 * @param {*} options.initialData - Initial value for data state (default: null)
 * @param {Function} options.transform - Function to transform response before setting state
 * @param {Function} options.onSuccess - Callback when fetch succeeds
 * @param {Function} options.onError - Callback when fetch fails
 * 
 * @returns {Object} Object containing:
 *   - data: The fetched data (null initially)
 *   - setData: Function to manually update data state (e.g. for optimistic updates)
 *   - loading: Boolean loading state
 *   - error: Error message or null
 *   - refetch: Function to manually trigger refetch
 * 
 * @example
 * const { data: articles, loading, error, refetch } = useAsyncData(
 *   () => articleAPI.getAll({ page, limit: 10 }),
 *   [page],
 *   {
 *     initialData: [],
 *     transform: (response) => response.data.articles || []
 *   }
 * );
 */
export function useAsyncData(
  fetchFunction,
  dependencies = [],
  options = {}
) {
  const {
    initialData = null,
    transform = (data) => data,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const fetchGenRef = useRef(0);
  const latestOptionsRef = useRef({ fetchFunction, transform, onSuccess, onError });
  latestOptionsRef.current = { fetchFunction, transform, onSuccess, onError };

  const fetchData = useCallback(async (...args) => {
    const gen = ++fetchGenRef.current;
    setLoading(true);
    setError(null);
    
    try {
      const { fetchFunction: currentFetch, transform: currentTransform, onSuccess: currentOnSuccess } = latestOptionsRef.current;
      const response = await currentFetch(...args);
      
      if (!isMountedRef.current) return;
      if (gen !== fetchGenRef.current) return;
      
      const transformedData = currentTransform(response);
      if (transformedData !== undefined) {
        setData(transformedData);
      }
      
      if (currentOnSuccess) {
        currentOnSuccess(transformedData);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (gen !== fetchGenRef.current) return;
      
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      const currentOnError = latestOptionsRef.current.onError;
      if (currentOnError) {
        currentOnError(errorMessage);
      }
    } finally {
      if (isMountedRef.current && gen === fetchGenRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const fetchGenerationRef = fetchGenRef;
    fetchData();
    return () => {
      isMountedRef.current = false;
      fetchGenerationRef.current++;
    };
    // `dependencies` is the public trigger list for this hook; its callers pass
    // values directly so the fetch runs again only when those values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);

  const setDataAndInvalidateFetch = useCallback((value) => {
    fetchGenRef.current++;
    setData(value);
  }, [setData]);

  return { data, setData: setDataAndInvalidateFetch, loading, error, refetch: fetchData };
}
