'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRightIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { authAPI } from '@/lib/api';

/**
 * Compact dismissible onboarding progress card for the homepage/dashboard.
 * Only shown to authenticated users who have not completed or dismissed onboarding.
 *
 * @param {Object} props
 * @param {Object} props.user - Authenticated user object from useAuth()
 */
export default function OnboardingCard({ user }) {
  const t = useTranslations('onboarding');
  const [state, setState] = useState(null); // null = loading
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authAPI.getOnboarding();
      if (res.success) {
        setState(res.data.onboarding);
      }
    } catch {
      // silently hide card on error
      setState({ onboardingDismissed: true });
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      await authAPI.updateOnboarding({ dismissed: true });
    } catch {
      // non-fatal
    }
  };

  if (!user || !state || dismissed) return null;
  if (state.onboardingDismissed || state.onboardingCompletedAt) return null;

  // Derive a rough completion score from profile fields
  const completedFields = [
    state.emailVerified,
    state.firstNameNative && state.lastNameNative,
    state.homeLocationId,
    state.avatar,
    state.nationality,
  ].filter(Boolean).length;
  const totalFields = 5;
  const pct = Math.round((completedFields / totalFields) * 100);
  const isComplete = pct === 100;

  if (isComplete) return null;

  const hasGoal = Boolean(state.onboardingGoal);

  return (
    <div
      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-3 shadow-sm"
      role="region"
      aria-label={t('card_title')}
    >
      {/* Progress ring / icon */}
      <div className="flex-shrink-0 relative h-10 w-10" aria-hidden="true">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#dbeafe" strokeWidth="3.5" />
          <circle
            cx="18" cy="18" r="15.9"
            fill="none"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-700">
          {pct}%
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900 truncate">{t('card_title')}</p>
        <p className="text-xs text-blue-700 truncate">
          {hasGoal ? t('resume_hint') : t('select_goal_prompt')}
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/onboarding"
        className="flex-shrink-0 inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        aria-label={t('card_cta')}
      >
        {t('card_cta')}
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </Link>

      {/* Dismiss */}
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 rounded p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={t('card_dismiss')}
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
