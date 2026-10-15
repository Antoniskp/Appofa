'use client';

import { useEffect, useState } from 'react';

export function useProfileSetup(userId) {
  const [state, setState] = useState(null);
  const key = userId ? `appofa:profile-setup:v1:${userId}` : null;

  useEffect(() => {
    let preferences = {};
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      if (stored && typeof stored === 'object') preferences = stored;
    } catch { /* Storage is optional; setup still works without it. */ }
    setState({ key, preferences });
  }, [key]);

  const preferences = state?.key === key ? state.preferences : null;
  const updatePreferences = (patch) => {
    const next = { ...preferences, ...patch };
    setState({ key, preferences: next });
    try {
      if (key) localStorage.setItem(key, JSON.stringify(next));
    } catch { /* Keep the preference for this visit when storage is unavailable. */ }
  };

  return { preferences, updatePreferences };
}
