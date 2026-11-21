'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authAPI, onboardingEventAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getAccountLandingPath } from '@/lib/auth-redirect';
import EmailVerificationNotice from './EmailVerificationNotice';
import LocationStep from './LocationStep';

export default function StartParticipation() {
  const t = useTranslations('signupJourney');
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    onboardingEventAPI.record({ eventType: 'onboarding_viewed' }).catch(() => {});
  }, []);

  const finishOnboarding = async (locationId) => {
    await authAPI.updateOnboarding({ completed: true });
    onboardingEventAPI.record({ eventType: 'onboarding_completed' }).catch(() => {});
    router.replace(getAccountLandingPath(locationId ?? user?.homeLocationId));
  };

  return <div className="bg-gray-50 px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('account_ready')}</h1>
        <p className="mt-3 text-base leading-7 text-gray-600">{t('start_help')}</p>
      </div>
      <LocationStep onContinue={finishOnboarding} />
      <EmailVerificationNotice inline />
    </div>
  </div>;
}
