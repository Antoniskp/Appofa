'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing filters and pagination
 * @param {object} initialFilters - Initial filter values
 * @param {number} initialPage - Initial page number (default: 1)
 * @returns {object} Filter state and handlers
 */
export function useFilters(initialFilters = {}, initialPage = 1) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Update a single filter and reset to page 1
   */
  const updateFilter = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  }, []);

  /**
   * Update multiple filters at once and reset to page 1
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  /**
   * Reset all filters to initial values and reset to page 1
   */
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
  }, [initialFilters]);

  /**
   * Handle filter change from input event
   */
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    updateFilter(name, value);
  }, [updateFilter]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    setPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((pageNum) => {
    setPage(Math.max(1, Math.min(totalPages, pageNum)));
  }, [totalPages]);

  return {
    // State
    filters,
    page,
    totalPages,
    
    // Setters
    setFilters,
    setPage,
    setTotalPages,
    
    // Helpers
    updateFilter,
    updateFilters,
    resetFilters,
    handleFilterChange,
    nextPage,
    prevPage,
    goToPage,
    
    // Computed
    hasFilters: Object.values(filters).some(v => v !== '' && v !== null && v !== undefined),
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
  };
}
