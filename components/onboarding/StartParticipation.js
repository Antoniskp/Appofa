'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authAPI, onboardingEventAPI } from '@/lib/api';
import LocationStep from './LocationStep';

export default function StartParticipation() {
  const t = useTranslations('signupJourney');
  const router = useRouter();
  useEffect(() => {
    onboardingEventAPI.record({ eventType: 'onboarding_viewed' }).catch(() => {});
  }, []);

  const continueToTopics = async (locationId) => {
    await authAPI.updateOnboarding({ completed: true });
    onboardingEventAPI.record({ eventType: 'onboarding_completed', goal: 'citizen' }).catch(() => {});
    router.push(locationId ? `/locations/${locationId}` : '/polls');
  };

  return <div className="bg-gray-50 px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('account_ready')}</h1>
        <p className="mt-3 text-base leading-7 text-gray-600">{t('start_help')}</p>
      </div>
      <LocationStep onContinue={continueToTopics} />
      <details className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
        <summary className="cursor-pointer py-1 font-semibold text-gray-700">{t('other_ways')}</summary>
        <p className="mt-3 leading-6 text-gray-600">{t('other_ways_help')}</p>
        <Link href="/onboarding?mode=advanced" className="mt-3 inline-flex min-h-11 items-center font-semibold text-blue-700 underline">{t('advanced_setup')}</Link>
      </details>
    </div>
  </div>;
}
