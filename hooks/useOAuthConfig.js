'use client';

import { authAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';

/**
 * Custom hook to fetch OAuth configuration
 * Leverages useAsyncData for consistent data fetching patterns
 * 
 * @returns {Object} - OAuth configuration and loading state
 * @returns {Object} config - OAuth provider configuration { github: bool, google: bool, facebook: bool }
 * @returns {boolean} loading - Loading state
 * @returns {string|null} error - Error message if any
 */
export function useOAuthConfig() {
  const { data: config, loading, error } = useAsyncData(
    async () => {
      const response = await authAPI.getOAuthConfig();
      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to load OAuth configuration');
    },
    [], // No dependencies - load once on mount
    {
      initialData: { github: false, google: false, facebook: false },
      onError: (err) => {
        console.error('Failed to load OAuth config:', err);
      }
    }
  );
  
  return { config, loading, error };
}
