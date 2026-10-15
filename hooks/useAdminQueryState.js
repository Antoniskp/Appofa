'use client';

import { useSearchParams } from 'next/navigation';

// Read the URL on each render. Read window.location in the setter so multiple
// setters in one event preserve each other's changes.
export function useAdminQueryState(key, initialValue, allowedValues) {
  const params = useSearchParams();
  const raw = params.get(key);
  let value = raw ?? initialValue;
  if (typeof initialValue === 'number') {
    value = /^\d+$/.test(raw || '') && Number.isSafeInteger(Number(raw)) && Number(raw) > 0
      ? Number(raw) : initialValue;
  } else if (allowedValues && !allowedValues.includes(value)) {
    value = initialValue;
  }
  function setValue(next) {
    const url = new URL(window.location.href);
    const resolved = typeof next === 'function' ? next(value) : next;
    if (resolved === initialValue) url.searchParams.delete(key);
    else url.searchParams.set(key, String(resolved));
    if (key !== 'page' && key !== 'report') url.searchParams.delete('page');
    if (url.href !== window.location.href) {
      window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }
  return [value, setValue];
}
