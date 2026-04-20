'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import FormInput from '@/components/ui/FormInput';
import OAuthButtons from '@/components/ui/OAuthButtons';
import AuthDivider from '@/components/ui/AuthDivider';
import { authAPI } from '@/lib/api';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import Button from '@/components/ui/Button';
import { getAndClearReturnTo } from '@/lib/auth-redirect';

const resolvePostLoginDestination = () => {
  const destination = getAndClearReturnTo();
  return destination === '/login' || destination === '/register' ? '/' : destination;
};

function LoginForm() {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { config: oauthConfig } = useOAuthConfig();

  useEffect(() => {
    // Handle OAuth callback
    const errorParam = searchParams.get('error');

    if (searchParams.get('oauth')) {
      setLoading(true);
      authAPI.getProfile()
        .then((response) => {
          if (response.success) {
            success(tAuth('welcome_redirect'));
            router.push(resolvePostLoginDestination());
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
  }, [searchParams, router, success, error]);

  useEffect(() => {
    if (!authLoading && user) {
      router.push(resolvePostLoginDestination());
    }
  }, [user, authLoading, router]);

  const handleChange = (e) => {
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
      router.push(resolvePostLoginDestination());
    } catch (err) {
      error(err.message || tAuth('invalid_credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      const response = await authAPI.initiateGithubOAuth('login');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || tAuth('github_login_fail'));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const response = await authAPI.initiateGoogleOAuth('login');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || tAuth('google_login_fail'));
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
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              {tAuth('create_new_account')}
            </Link>
          </p>
        </div>

        {/* OAuth Buttons */}
        <OAuthButtons
          config={oauthConfig}
          onGithubLogin={handleGithubLogin}
          onGoogleLogin={handleGoogleLogin}
          disabled={loading}
        />

        <AuthDivider />

        <form className="space-y-6" onSubmit={handleSubmit}>
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
          </div>

          <div>
            <Button type="submit" loading={loading} size="md" className="w-full">
              {tAuth('submit_login')}
            </Button>
          </div>
        </form>
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
