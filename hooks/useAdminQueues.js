'use client';

import { useEffect } from 'react';
import { useAsyncData } from './useAsyncData';
import { adminSummaryAPI } from '@/lib/api/adminSummary';

export function useAdminQueues(role) {
  const result = useAsyncData(async () => {
    if (!['admin', 'moderator'].includes(role)) return {};
    return adminSummaryAPI.getQueueCounts();
  }, [role], { initialData: {} });
  const { refetch } = result;
  useEffect(() => {
    if (!['admin', 'moderator'].includes(role)) return undefined;
    const refresh = () => { if (!document.hidden) refetch(); };
    window.addEventListener('admin:queue-changed', refresh);
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      window.removeEventListener('admin:queue-changed', refresh);
      window.removeEventListener('focus', refresh);
      window.clearInterval(timer);
    };
  }, [role, refetch]);
  return result;
}
