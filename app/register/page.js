'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import FormInput from '@/components/ui/FormInput';
import OAuthButtons from '@/components/ui/OAuthButtons';
import AuthDivider from '@/components/ui/AuthDivider';
import { authAPI } from '@/lib/api';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstNameNative: '',
    lastNameNative: '',
    searchable: true,
  });
  const [loading, setLoading] = useState(false);
  const { config: oauthConfig } = useOAuthConfig();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      error('Οι κωδικοί δεν ταιριάζουν');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      success('Ο λογαριασμός δημιουργήθηκε! Καλώς ήρθατε!');
      router.push('/');
    } catch (err) {
      error(err.message || 'Αποτυχία εγγραφής. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    try {
      setLoading(true);
      const response = await authAPI.initiateGithubOAuth('login');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || 'Αποτυχία εκκίνησης εγγραφής με GitHub');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const response = await authAPI.initiateGoogleOAuth('login');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || 'Αποτυχία εκκίνησης εγγραφής με Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Δημιουργία λογαριασμού
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Έχετε ήδη λογαριασμό;{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Σύνδεση
            </Link>
          </p>
        </div>

        {/* OAuth Buttons */}
        <OAuthButtons
          config={oauthConfig}
          onGithubLogin={handleGithubSignup}
          onGoogleLogin={handleGoogleSignup}
          disabled={loading}
        />

        <AuthDivider text="Ή εγγραφή με" />

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <FormInput
              name="username"
              type="text"
              label="Όνομα χρήστη"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              placeholder="Όνομα χρήστη"
            />

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

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                name="firstNameNative"
                type="text"
                label="Όνομα"
                value={formData.firstNameNative}
                onChange={handleChange}
                autoComplete="given-name"
                placeholder="Όνομα"
              />
              <FormInput
                name="lastNameNative"
                type="text"
                label="Επώνυμο"
                value={formData.lastNameNative}
                onChange={handleChange}
                autoComplete="family-name"
                placeholder="Επώνυμο"
              />
            </div>

            <FormInput
              name="password"
              type="password"
              label="Κωδικός πρόσβασης"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder="Κωδικός πρόσβασης"
            />

            <FormInput
              name="confirmPassword"
              type="password"
              label="Επιβεβαίωση κωδικού"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder="Επιβεβαίωση κωδικού"
            />

            <div className="flex items-center">
              <input
                id="searchable"
                name="searchable"
                type="checkbox"
                checked={formData.searchable}
                onChange={(e) => setFormData({ ...formData, searchable: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="searchable" className="ml-2 block text-sm text-gray-900">
                Να με βρίσκουν άλλοι χρήστες στην αναζήτηση
              </label>
            </div>

          </div>

          <div>
            <Button type="submit" loading={loading} size="md" className="w-full">
              Δημιουργία λογαριασμού
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
