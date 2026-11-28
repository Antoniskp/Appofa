'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import AlertMessage from '@/components/ui/AlertMessage';

const CODE_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorKeyFor = (err, step) => {
  if (err?.code === 'EMAIL_CODE_EXPIRED') return 'code_expired';
  if (err?.code === 'EMAIL_CODE_TOO_MANY_ATTEMPTS') return 'code_too_many';
  if (err?.code === 'EMAIL_CODE_INVALID') return 'code_invalid';
  if (err?.status === 429) return 'code_wait';
  if (err?.status === 400 && step === 'email') return 'email_invalid';
  return step === 'email' ? 'code_send_failed' : 'code_verify_failed';
};

/**
 * Passwordless sign-in / sign-up in two short steps: email, then the 6-digit code.
 * Works the same for new and returning people; the server creates the account if needed.
 *
 * @param {(result: { isNewUser: boolean, claimedVotes: number }) => void} onSuccess
 * @param {(signingIn: boolean) => void} onPendingChange - true just before the session is created, false if that fails
 * @param {boolean} autoFocus - focus the email field on mount
 */
export default function EmailCodeForm({ onSuccess, onPendingChange, autoFocus = false }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const { signInWithEmailCode } = useAuth();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus();
    else if (autoFocus) emailInputRef.current?.focus();
  }, [step, autoFocus]);

  const sendCode = async () => {
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError(t('email_invalid'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await authAPI.requestEmailCode({ email: trimmedEmail, locale });
      setEmail(trimmedEmail);
      setCode('');
      setStep('code');
      setCooldown(response?.data?.cooldownSeconds || 60);
    } catch (err) {
      if (err?.status === 429 && err?.retryAfter && step === 'code') setCooldown(err.retryAfter);
      setError(t(errorKeyFor(err, 'email')));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (busy || value.length !== CODE_LENGTH) return;
    setBusy(true);
    setError('');
    onPendingChange?.(true);
    try {
      const response = await signInWithEmailCode({ email, code: value, locale });
      onSuccess?.({
        isNewUser: Boolean(response?.data?.isNewUser),
        claimedVotes: response?.data?.claimedVotes || 0,
      });
    } catch (err) {
      onPendingChange?.(false);
      setError(t(errorKeyFor(err, 'code')));
      if (err?.code === 'EMAIL_CODE_EXPIRED' || err?.code === 'EMAIL_CODE_TOO_MANY_ATTEMPTS') setCode('');
      setBusy(false);
    }
  };

  const handleCodeChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError('');
    // Pasting or autofilling the full code signs in without an extra tap.
    if (digits.length === CODE_LENGTH) verify(digits);
  };

  if (step === 'email') {
    return (
      <form
        data-auth-form="email-code"
        className="space-y-3"
        noValidate
        onSubmit={(event) => { event.preventDefault(); sendCode(); }}
      >
        <label htmlFor="email-code-address" className="block text-sm font-medium text-gray-800">{t('code_email_label')}</label>
        <input
          ref={emailInputRef}
          id="email-code-address"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          disabled={busy}
          onChange={(event) => { setEmail(event.target.value); setError(''); }}
          placeholder="name@example.com"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'email-code-error' : undefined}
          className="block w-full min-h-12 rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <div id="email-code-error"><AlertMessage message={error} /></div>}
        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-12 rounded-md bg-blue-600 px-4 py-2 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {t(busy ? 'code_sending' : 'code_send')}
        </button>
        <p className="text-xs leading-5 text-gray-500">{t('code_new_account_hint')}</p>
      </form>
    );
  }

  return (
    <form
      data-auth-form="email-code-verify"
      className="space-y-3"
      noValidate
      onSubmit={(event) => { event.preventDefault(); verify(); }}
    >
      <p className="text-sm text-gray-700" role="status">{t('code_sent_to', { email })}</p>
      <label htmlFor="email-code-value" className="block text-sm font-medium text-gray-800">{t('code_label')}</label>
      <input
        ref={codeInputRef}
        id="email-code-value"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={CODE_LENGTH}
        value={code}
        disabled={busy}
        onChange={handleCodeChange}
        placeholder="123456"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'email-code-verify-error' : 'email-code-spam-hint'}
        className="block w-full min-h-12 rounded-md border border-gray-300 px-3 py-2 text-center text-2xl font-semibold tracking-[0.5em] text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && <div id="email-code-verify-error"><AlertMessage message={error} /></div>}
      <button
        type="submit"
        disabled={busy || code.length !== CODE_LENGTH}
        className="w-full min-h-12 rounded-md bg-blue-600 px-4 py-2 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
      >
        {t(busy ? 'code_verifying' : 'code_verify')}
      </button>
      <p id="email-code-spam-hint" className="text-xs leading-5 text-gray-500">{t('code_check_spam')}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button
          type="button"
          onClick={() => { setStep('email'); setError(''); setCode(''); }}
          disabled={busy}
          className="min-h-11 font-medium text-blue-700 underline disabled:opacity-60"
        >
          {t('code_change_email')}
        </button>
        <button
          type="button"
          onClick={sendCode}
          disabled={busy || cooldown > 0}
          className="min-h-11 font-medium text-blue-700 underline disabled:text-gray-400 disabled:no-underline"
        >
          {cooldown > 0 ? t('code_resend_in', { seconds: cooldown }) : t('code_resend')}
        </button>
      </div>
    </form>
  );
}
