'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { authAPI } from '@/lib/api';

const STEPS = [
  {
    key: 'email',
    labelKey: 'completeness_step_email_verified',
    points: 25,
    isDone: ({ user }) => user?.emailVerified === true,
    missingLabelKey: 'completeness_verify_email_cta',
  },
  {
    key: 'nationality',
    labelKey: 'completeness_step_nationality',
    points: 20,
    isDone: ({ profileData }) => Boolean(profileData?.nationality),
    href: '#profile-location-heading',
    missingLabelKey: 'completeness_add_nationality',
  },
  {
    key: 'homeLocation',
    labelKey: 'completeness_step_home_location',
    points: 20,
    isDone: ({ profileData }) => Boolean(profileData?.homeLocationId),
    href: '#profile-location-heading',
    missingLabelKey: 'completeness_add_home_location',
  },
  {
    key: 'fullName',
    labelKey: 'completeness_step_full_name',
    points: 15,
    isDone: ({ profileData }) => Boolean(profileData?.firstNameNative && profileData?.lastNameNative),
    href: '#profile-basic-info-heading',
    missingLabelKey: 'completeness_add_full_name',
  },
  {
    key: 'bio',
    labelKey: 'completeness_step_bio',
    points: 10,
    isDone: ({ profileData }) => Boolean(profileData?.bio),
    href: '#profile-about-heading',
    missingLabelKey: 'completeness_add_bio',
  },
  {
    key: 'avatar',
    labelKey: 'completeness_step_avatar',
    points: 10,
    isDone: ({ profileData }) => Boolean(profileData?.avatar),
    href: '#profile-basic-info-heading',
    missingLabelKey: 'completeness_add_avatar',
  },
];

export default function ProfileCompleteness({ user, profileData }) {
  const t = useTranslations('profile');
  const [resendStatus, setResendStatus] = useState(null);
  const [sendingResend, setSendingResend] = useState(false);

  const { score, stepStates } = useMemo(() => {
    const states = STEPS.map((step) => ({
      ...step,
      done: step.isDone({ user, profileData }),
    }));
    const total = states.reduce((sum, step) => (step.done ? sum + step.points : sum), 0);
    return { score: total, stepStates: states };
  }, [profileData, user]);

  const missingSteps = stepStates.filter((step) => !step.done);

  const handleResendVerification = async () => {
    setSendingResend(true);
    setResendStatus(null);
    try {
      const response = await authAPI.resendVerification();
      if (response?.success) {
        setResendStatus({ type: 'success', message: response.message || t('completeness_resend_success') });
      } else {
        setResendStatus({ type: 'error', message: response?.message || t('completeness_resend_error') });
      }
    } catch (err) {
      setResendStatus({ type: 'error', message: err?.message || t('completeness_resend_error') });
    } finally {
      setSendingResend(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{t('completeness_title')}</h2>
        <span className="text-sm font-semibold text-blue-700">{score}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 rounded-full h-2.5 transition-all duration-300"
          style={{ width: `${score}%` }}
        />
      </div>

      {score === 100 ? (
        <p className="text-sm font-medium text-green-700">{t('completeness_full')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {stepStates.map((step) => {
            if (step.done) {
              return (
                <span key={step.key} className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs text-green-700">
                  <span aria-hidden="true">✅</span>
                  {t(step.labelKey)}
                </span>
              );
            }

            if (step.key === 'email') {
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={handleResendVerification}
                  disabled={sendingResend}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                >
                  <span aria-hidden="true">•</span>
                  {t(step.missingLabelKey)}
                </button>
              );
            }

            return (
              <Link
                key={step.key}
                href={step.href || '#'}
                className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
              >
                <span aria-hidden="true">•</span>
                {t(step.missingLabelKey)}
              </Link>
            );
          })}
        </div>
      )}

      {missingSteps.some((step) => step.key === 'email') && resendStatus && (
        <p className={`text-xs ${resendStatus.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
          {resendStatus.message}
        </p>
      )}
    </div>
  );
}
