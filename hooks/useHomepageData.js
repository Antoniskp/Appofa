'use client';

import { useRef, useState } from 'react';
import { useAsyncData } from './useAsyncData';
import { homepageAPI } from '@/lib/api';
import sectionsList from '@/config/homepageSections.json';

// Keep account-scoped data separate, including while an account change is loading.
export function useHomepageData(user, initialPayload) {
  const owner = `${user?.id || 'guest'}:${user?.role || ''}:${user?.homeLocation?.id || ''}`;
  const [requested, setRequested] = useState(null);
  const current = useRef(null);
  const pending = useRef([]);
  const generation = useRef(0);
  const result = useAsyncData(async (sections) => {
    const requestId = ++generation.current;
    pending.current = sections || sectionsList;
    setRequested(sections || null);
    let response;
    try {
      response = await homepageAPI.get(undefined, sections);
      if (!response?.success) throw new Error('Homepage unavailable');
    } catch {
      response = { data: {}, errors: Object.fromEntries((sections || sectionsList).map(key => [key, 'unavailable'])) };
    } finally {
      if (requestId === generation.current) pending.current = [];
    }
    const previous = current.current?.owner === owner ? current.current : null;
    const errors = { ...previous?.errors };
    for (const section of sections || sectionsList) delete errors[section];
    return {
      owner,
      data: { ...previous?.data, ...response.data },
      errors: { ...errors, ...response.errors },
    };
  }, [owner], {
    initialData: initialPayload ? { owner: 'guest:', ...initialPayload } : null,
  });
  current.current = result.data;
  const active = result.data?.owner === owner ? result.data : null;
  const isRequested = section => !requested || requested.includes(section);
  return {
    data: active?.data || {},
    loading: section => (result.loading || !active) && isRequested(section) && !result.error,
    error: section => Boolean((result.error && isRequested(section)) ||
      (active?.errors?.[section] && !(result.loading && isRequested(section)))),
    // If another retry is still pending, include its sections in the latest request.
    // useAsyncData discards the superseded response, so neither result can be lost.
    retry: sections => result.refetch([...new Set([...pending.current, ...sections])]),
  };
}
