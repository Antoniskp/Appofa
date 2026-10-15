'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { authAPI } from '@/lib/api';

export default function ProfileCompleteness({ user, savedProfileData, preferences, onPreferencesChange, onNavigateToSection }) {
  const t = useTranslations('profile');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  if (!preferences || !savedProfileData) return null;

  const steps = [
    { key: 'location', done: Boolean(savedProfileData.homeLocationId), tab: 'location-politics', section: 'home-location-panel' },
    { key: 'interests', done: savedProfileData.interests?.length > 0, tab: 'skills', section: 'profile-interests-heading' },
    { key: 'email', done: user?.emailVerified === true },
    { key: 'privacy', done: preferences.privacyReviewed === true, tab: 'settings', section: 'profile-privacy-heading' },
  ];
  const completed = steps.filter(step => step.done).length;
  const next = steps.find(step => !step.done);
  const snoozed = Number(preferences.dismissedUntil) > Date.now();

  const navigate = async (step) => {
    if (step.key !== 'email') {
      onNavigateToSection(step.tab, step.section);
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const response = await authAPI.resendVerification();
      setStatus(response?.success ? t('completeness_resend_success') : t('completeness_resend_error'));
    } catch {
      setStatus(t('completeness_resend_error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-4" aria-label={t('setup_title')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900">{t('setup_title')}</h2>
        <p className="text-sm text-gray-600" aria-live="polite">{t('setup_progress', { completed, total: steps.length })}</p>
      </div>
      <div role="progressbar" aria-label={t('setup_title')} aria-valuemin={0} aria-valuemax={4} aria-valuenow={completed} className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-blue-600 transition-all" style={{ width: completed * 25 + '%' }} />
      </div>
      {!next ? <p className="text-sm text-green-700">{t('setup_complete')}</p> : snoozed ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">{t('setup_paused')}</p>
          <button type="button" onClick={() => onPreferencesChange({ dismissedUntil: 0 })} className="text-sm font-medium text-blue-700 underline">{t('setup_resume')}</button>
        </div>
      ) : (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
          <h3 className="font-semibold text-gray-900">{t('setup_' + next.key + '_title')}</h3>
          <p className="mt-2 text-sm text-gray-600">{t('setup_' + next.key + '_description')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" disabled={sending} onClick={() => navigate(next)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{sending ? t('setup_sending') : t('setup_' + next.key + '_action')}</button>
            <button type="button" onClick={() => onPreferencesChange({ dismissedUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 })} className="text-sm text-gray-600 hover:underline">{t('setup_later')}</button>
          </div>
        </div>
      )}
      {!snoozed && <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {steps.map(step => <li key={step.key} className="text-sm">
          {step.done ? <span className="text-green-700"><span aria-hidden="true">✓ </span>{t('setup_' + step.key + '_label')} — {t('setup_done')}</span> : <button type="button" disabled={step.key === 'email' && sending} onClick={() => navigate(step)} className="text-gray-600 underline decoration-gray-300 underline-offset-4">{t('setup_' + step.key + '_label')}</button>}
        </li>)}
      </ul>}
      {status && <p role="status" className="text-sm text-gray-700">{status}</p>}
      <p className="text-xs text-gray-500">{t('setup_optional')}</p>
    </section>
  );
}
