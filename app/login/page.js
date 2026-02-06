'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import AlertMessage from '@/components/AlertMessage';
import AuthInput from '@/components/AuthInput';
import OAuthButtons from '@/components/OAuthButtons';
import AuthDivider from '@/components/AuthDivider';
import { authAPI } from '@/lib/api';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import Button from '@/components/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
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
            router.push('/');
          }
        })
        .catch((err) => {
          console.error('OAuth login failed:', err);
          setLoading(false);
        });
    } else if (errorParam) {
      const errorMessages = {
        missing_params: 'OAuth failed: Missing parameters',
        invalid_state: 'OAuth failed: Invalid state token',
        token_exchange_failed: 'OAuth failed: Could not exchange token',
        oauth_failed: 'OAuth authentication failed'
      };
      setError(errorMessages[errorParam] || 'OAuth authentication failed');
    }
  }, [searchParams, router]);

  // Redirect if already logged in
  if (user) {
    router.push('/');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
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
      setError(err.message || 'Failed to initiate GitHub login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <AlertMessage message={error} />
          <div className="space-y-4">
            <AuthInput
              id="email"
              type="email"
              label="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="Email address"
            />
            <AuthInput
              id="password"
              type="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Password"
            />
          </div>

          <div>
            <Button type="submit" loading={loading} size="md" className="w-full">
              Sign in
            </Button>
          </div>
        </form>

        <AuthDivider />

        {/* OAuth Buttons */}
        <OAuthButtons
          config={oauthConfig}
          onGithubLogin={handleGithubLogin}
          disabled={loading}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
