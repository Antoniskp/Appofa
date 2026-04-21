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

  const fetchData = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchFunction();
      
      if (!isMountedRef.current) return;
      if (gen !== fetchGenRef.current) return;
      
      const transformedData = transform(response);
      if (transformedData !== undefined) {
        setData(transformedData);
      }
      
      if (onSuccess) {
        onSuccess(transformedData);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (gen !== fetchGenRef.current) return;
      
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      if (isMountedRef.current && gen === fetchGenRef.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setDataAndInvalidateFetch = useCallback((value) => {
    fetchGenRef.current++;
    setData(value);
  }, [setData]);

  return { data, setData: setDataAndInvalidateFetch, loading, error, refetch: fetchData };
}
