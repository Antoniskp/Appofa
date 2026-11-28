'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { authAPI } from '@/lib/api';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import { saveReturnTo } from '@/lib/auth-redirect';
import OAuthButtons from '@/components/ui/OAuthButtons';
import AuthDivider from '@/components/ui/AuthDivider';
import AlertMessage from '@/components/ui/AlertMessage';
import EmailCodeForm from './EmailCodeForm';

/**
 * One box for sign-in, sign-up and email verification:
 * Google (when configured) or a 6-digit code sent by email.
 *
 * @param {(result: { isNewUser: boolean, claimedVotes: number }) => void} onSuccess - after an email-code sign-in
 * @param {(signingIn: boolean) => void} onPendingChange - see EmailCodeForm
 * @param {string} returnTo - safe relative path to come back to after Google sign-in
 * @param {boolean} autoFocus - focus the email field on mount
 */
export default function QuickSignIn({ onSuccess, onPendingChange, returnTo, autoFocus = false }) {
  const t = useTranslations('auth');
  const { config: oauthConfig } = useOAuthConfig();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    if (redirecting) return;
    setRedirecting(true);
    setError('');
    try {
      saveReturnTo(returnTo);
      const response = await authAPI.initiateGoogleOAuth('login');
      if (!response?.success || !response.data?.authUrl) throw new Error('OAuth unavailable');
      window.location.href = response.data.authUrl;
    } catch {
      setError(t('google_login_fail'));
      setRedirecting(false);
    }
  };

  return (
    <div className="space-y-4">
      {oauthConfig.google && (
        <>
          <OAuthButtons config={{ google: true }} onGoogleLogin={handleGoogle} disabled={redirecting} />
          <AuthDivider text={t('quick_or_email')} />
        </>
      )}
      {error && <AlertMessage message={error} />}
      <EmailCodeForm onSuccess={onSuccess} onPendingChange={onPendingChange} autoFocus={autoFocus} />
      <p className="text-xs leading-5 text-gray-500">
        {t('code_terms_prefix')}{' '}
        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline">{t('terms_link')}</Link>{' '}
        {t('and')}{' '}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">{t('privacy_link')}</Link>.
      </p>
    </div>
  );
}
