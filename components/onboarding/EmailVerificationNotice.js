'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { authAPI } from '@/lib/api';
import FormInput from '@/components/ui/FormInput';

export default function EmailVerificationNotice() {
  const t = useTranslations('signupJourney');
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!sent) return;
    const timer = window.setTimeout(() => setSent(false), 60000);
    return () => window.clearTimeout(timer);
  }, [sent]);

  if (user?.emailVerified !== false || !user.email) return null;

  const resend = async (event) => {
    event?.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await authAPI.resendVerification(editing ? email.trim() : undefined);
      setMessage(t('verification_sent'));
      setSent(true);
      setEditing(false);
    } catch (err) {
      const duplicate = /already in use/i.test(err.message || '');
      setError(t(duplicate ? 'email_in_use' : 'verification_error'));
    } finally {
      // A corrected address may have saved even if the mail provider was unavailable.
      try { await refreshUser(); } catch { /* Keep the notice available for retry. */ }
      setBusy(false);
    }
  };

  return (
    <section aria-label={t('verification_title')} className="border-b border-blue-200 bg-blue-50">
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-4 text-sm text-blue-950">
        <h2 className="font-bold">{t('verification_title')}</h2>
        <p className="break-words">{t('verification_destination', { email: user.email })}</p>
        <p className="leading-6">{t('verification_help')}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <button type="button" onClick={resend} disabled={busy || sent} className="min-h-11 font-semibold underline disabled:opacity-60">{t(busy ? 'sending' : sent ? 'sent' : 'resend')}</button>
          <button type="button" onClick={() => { setEmail(user.email); setEditing(!editing); setMessage(''); setError(''); setSent(false); }} disabled={busy} aria-expanded={editing} className="min-h-11 font-semibold underline">{t(editing ? 'cancel' : 'correct_email')}</button>
        </div>
        {editing && <form onSubmit={resend} className="max-w-md space-y-3">
          <FormInput name="correctedEmail" type="email" label={t('correct_email_label')} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" disabled={busy} />
          <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60">{t('save_email')}</button>
        </form>}
        {message && <p role="status">{message}</p>}
        {error && <p role="alert" className="font-medium text-red-700">{error}</p>}
      </div>
    </section>
  );
}
