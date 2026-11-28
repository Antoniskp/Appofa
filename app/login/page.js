'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import FormInput from '@/components/ui/FormInput';
import OAuthButtons from '@/components/ui/OAuthButtons';
import { authAPI } from '@/lib/api';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import Button from '@/components/ui/Button';
import { buildAuthPath, getAuthDestinationFromSearchParams, getPendingAuthDestination, resolveAuthDestination, saveReturnTo } from '@/lib/auth-redirect';
import AlertMessage from '@/components/ui/AlertMessage';
import QuickSignIn from '@/components/auth/QuickSignIn';

function LoginForm() {
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const { config: oauthConfig } = useOAuthConfig();
  const nextDestination = getPendingAuthDestination(searchParams);
  const registerHref = buildAuthPath('/register', nextDestination);
  const redirectStarted = useRef(false);
  // Email-code sign-in picks its own destination (onboarding for new accounts).
  const codeSignInOwnsRedirect = useRef(false);
  const redirectAfterLogin = useCallback((destination) => {
    // Both the login promise and the auth-state effect may finish together.
    // Consume the saved destination only once, or the second redirect goes home.
    if (redirectStarted.current) return;
    redirectStarted.current = true;
    router.push(destination || resolveAuthDestination(searchParams));
  }, [router, searchParams]);

  useEffect(() => {
    // Handle OAuth callback
    const errorParam = searchParams.get('error');
    setShowSessionExpired(searchParams.get('reason') === 'session_expired');

    if (searchParams.get('oauth')) {
      setLoading(true);
      authAPI.getProfile()
        .then((response) => {
          if (response.success) {
            success(tAuth('welcome_redirect'));
            // New OAuth users who have no explicit next destination go to onboarding
            const isNewOAuthUser = searchParams.get('new') === '1';
            const explicitNext = getAuthDestinationFromSearchParams(searchParams);
            if (isNewOAuthUser && !explicitNext) {
              redirectAfterLogin('/onboarding');
            } else {
              redirectAfterLogin();
            }
          }
        })
        .catch((err) => {
          console.error('OAuth login failed:', err);
          error(tAuth('oauth_failed'));
          setLoading(false);
        });
    } else if (errorParam) {
      const errorMessages = {
        missing_params: tAuth('oauth_missing_params'),
        invalid_state: tAuth('oauth_invalid_state'),
        token_exchange_failed: tAuth('oauth_token_exchange_failed'),
        oauth_failed: tAuth('oauth_failed'),
        google_already_linked: tAuth('google_already_linked')
      };
      error(errorMessages[errorParam] || tAuth('oauth_failed'));
    }
  }, [searchParams, redirectAfterLogin, success, error, tAuth]);

  useEffect(() => {
    if (!authLoading && user && !searchParams.get('oauth') && !codeSignInOwnsRedirect.current) {
      redirectAfterLogin();
    }
  }, [user, authLoading, searchParams, redirectAfterLogin]);

  const handleChange = (e) => {
    setInlineError('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData);
      success(tAuth('welcome_redirect'));
      redirectAfterLogin();
    } catch (err) {
      const message = err.message || tAuth('invalid_credentials');
      setInlineError(message);
      error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSignIn = ({ isNewUser }) => {
    success(tAuth('welcome_redirect'));
    const explicitNext = getAuthDestinationFromSearchParams(searchParams);
    redirectAfterLogin(isNewUser && !explicitNext ? '/onboarding' : undefined);
  };

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      saveReturnTo(nextDestination);
      const response = await authAPI.initiateGithubOAuth('login');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || tAuth('github_login_fail'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {tAuth('login_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {tAuth('or')}{' '}
            <Link href={registerHref} className="font-medium text-blue-600 hover:text-blue-500">
              {tAuth('create_new_account')}
            </Link>
          </p>
        </div>

        {showSessionExpired && (
          <AlertMessage tone="error" message={tAuth('session_expired_message')} />
        )}
        {inlineError && (
          <AlertMessage tone="error" message={inlineError} />
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-5 text-sm leading-6 text-gray-600">{tAuth('quick_subtitle')}</p>
          <QuickSignIn
            onSuccess={handleCodeSignIn}
            onPendingChange={(pending) => { codeSignInOwnsRedirect.current = pending; }}
            returnTo={nextDestination}
          />
        </div>

        {/* Password sign-in stays available for accounts that use one */}
        <details className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm" open={Boolean(inlineError)}>
          <summary className="cursor-pointer py-2 font-medium text-gray-700">{tAuth('use_password_instead')}</summary>
          <div className="space-y-4 pt-4">
            <form data-auth-form="password" className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <FormInput
                  name="email"
                  type="email"
                  label={tAuth('email')}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder={tAuth('email')}
                />
                <FormInput
                  name="password"
                  type="password"
                  label={tAuth('password')}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder={tAuth('password')}
                />
                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    {tAuth('forgot_password_link')}
                  </Link>
                </div>
              </div>

              <div>
                <Button type="submit" loading={loading} size="md" className="w-full">
                  {tAuth('submit_login')}
                </Button>
              </div>
            </form>
            {oauthConfig.github && (
              <OAuthButtons
                config={{ github: true }}
                onGithubLogin={handleGithubLogin}
                disabled={loading}
              />
            )}
          </div>
        </details>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const tCommon = useTranslations('common');

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">{tCommon('loading')}</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
