'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import FormInput from '@/components/ui/FormInput';
import OAuthButtons from '@/components/ui/OAuthButtons';
import AuthDivider from '@/components/ui/AuthDivider';
import { authAPI } from '@/lib/api';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import Button from '@/components/ui/Button';
import { getAndClearReturnTo } from '@/lib/auth-redirect';

function LoginForm() {
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
            success('Καλώς ήρθατε! Ανακατεύθυνση...');
            router.push(getAndClearReturnTo());
          }
        })
        .catch((err) => {
          console.error('OAuth login failed:', err);
          error('Αποτυχία OAuth');
          setLoading(false);
        });
    } else if (errorParam) {
      const errorMessages = {
        missing_params: 'Αποτυχία OAuth: Λείπουν παράμετροι',
        invalid_state: 'Αποτυχία OAuth: Μη έγκυρο token κατάστασης',
        token_exchange_failed: 'Αποτυχία OAuth: Δεν ήταν δυνατή η ανταλλαγή token',
        oauth_failed: 'Αποτυχία OAuth',
        google_already_linked: 'Αυτός ο λογαριασμός Google είναι ήδη συνδεδεμένος με άλλον χρήστη'
      };
      error(errorMessages[errorParam] || 'Αποτυχία OAuth');
    }
  }, [searchParams, router, success, error]);

  useEffect(() => {
    if (!authLoading && user) {
      router.push(getAndClearReturnTo());
    }
  }, [user, authLoading, router]);

  if (authLoading) {
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
    setLoading(true);

    try {
      await login(formData);
      success('Καλώς ήρθατε! Ανακατεύθυνση...');
      router.push(getAndClearReturnTo());
    } catch (err) {
      error(err.message || 'Λάθος email ή κωδικός. Παρακαλώ δοκιμάστε ξανά.');
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
      error(err.message || 'Αποτυχία εκκίνησης σύνδεσης με GitHub');
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
      error(err.message || 'Αποτυχία εκκίνησης σύνδεσης με Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Σύνδεση στον λογαριασμό σας
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ή{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              δημιουργήστε νέο λογαριασμό
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
              label="Διεύθυνση email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder="Διεύθυνση email"
            />
            <FormInput
              name="password"
              type="password"
              label="Κωδικός πρόσβασης"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Κωδικός πρόσβασης"
            />
          </div>

          <div>
            <Button type="submit" loading={loading} size="md" className="w-full">
              Σύνδεση
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Φόρτωση...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
