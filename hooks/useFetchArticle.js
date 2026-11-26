'use client';

import { articleAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';

/**
 * Custom hook to fetch a single article by ID
 * Leverages useAsyncData for consistent data fetching patterns
 * 
 * @param {string|number} articleId - The ID of the article to fetch
 * @param {Object|null} initialArticle - Server-fetched article, rendered immediately and refreshed on the client
 * @returns {Object} - Article data, loading state, and error
 * @returns {Object|null} article - The article data
 * @returns {boolean} loading - Loading state
 * @returns {string|null} error - Error message if any
 * @returns {Function} refetch - Function to manually refetch the article
 */
export function useFetchArticle(articleId, initialArticle = null) {
  const { data: article, loading, error, refetch } = useAsyncData(
    async () => {
      if (!articleId) {
        throw new Error('Article ID is required');
      }

      // Support both numeric IDs and slug-prefixed IDs like "42-my-article-title"
      const numericId = parseInt(articleId, 10);
      if (!numericId || isNaN(numericId)) {
        throw new Error('Article ID is required');
      }
      
      const response = await articleAPI.getById(numericId);
      
      if (!response.success) {
        throw new Error(response.message || 'Article not found');
      }
      
      return response.data.article;
    },
    [articleId], // Refetch when articleId changes
    {
      initialData: initialArticle,
      initialLoading: !initialArticle,
      onError: (err) => {
        console.error('Failed to fetch article:', err);
      }
    }
  );
  
  return { article, loading, error, refetch };
}
