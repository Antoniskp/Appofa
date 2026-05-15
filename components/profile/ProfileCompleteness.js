'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

const STEPS = [
  {
    key: 'email',
    label: 'Email verified',
    points: 25,
    isDone: ({ user }) => user?.emailVerified === true,
  },
  {
    key: 'nationality',
    label: 'Nationality',
    points: 20,
    isDone: ({ profileData }) => Boolean(profileData?.nationality),
    href: '#profile-location-heading',
  },
  {
    key: 'homeLocation',
    label: 'Home location',
    points: 20,
    isDone: ({ profileData }) => Boolean(profileData?.homeLocationId),
    href: '#profile-location-heading',
  },
  {
    key: 'fullName',
    label: 'Full name',
    points: 15,
    isDone: ({ profileData }) => Boolean(profileData?.firstNameNative && profileData?.lastNameNative),
    href: '#profile-basic-info-heading',
  },
  {
    key: 'bio',
    label: 'Bio',
    points: 10,
    isDone: ({ profileData }) => Boolean(profileData?.bio),
    href: '#profile-about-heading',
  },
  {
    key: 'avatar',
    label: 'Avatar',
    points: 10,
    isDone: ({ profileData }) => Boolean(profileData?.avatar),
    href: '#profile-basic-info-heading',
  },
];

export default function ProfileCompleteness({ user, profileData }) {
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
        setResendStatus({ type: 'success', message: response.message || 'Verification email sent.' });
      } else {
        setResendStatus({ type: 'error', message: response?.message || 'Failed to resend verification email.' });
      }
    } catch (err) {
      setResendStatus({ type: 'error', message: err?.message || 'Failed to resend verification email.' });
    } finally {
      setSendingResend(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Ολοκλήρωση Προφίλ</h2>
        <span className="text-sm font-semibold text-blue-700">{score}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 rounded-full h-2.5 transition-all duration-300"
          style={{ width: `${score}%` }}
        />
      </div>

      {score === 100 ? (
        <p className="text-sm font-medium text-green-700">Το προφίλ σου είναι πλήρες! 🎉</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {stepStates.map((step) => {
            if (step.done) {
              return (
                <span key={step.key} className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs text-green-700">
                  <span aria-hidden="true">✅</span>
                  {step.label}
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
                  Verify email
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
                Add {step.label.toLowerCase()}
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
