'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import FormInput from '@/components/ui/FormInput';
import OAuthButtons from '@/components/ui/OAuthButtons';
import AuthDivider from '@/components/ui/AuthDivider';
import { authAPI, geoAPI } from '@/lib/api';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import Button from '@/components/ui/Button';
import DiasporaModal from '@/components/DiasporaModal';
import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const t = useTranslations('auth');
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
  const [detectedCountry, setDetectedCountry] = useState({ countryCode: null, countryName: null });
  const [showDiasporaModal, setShowDiasporaModal] = useState(false);
  const [pendingRegisterData, setPendingRegisterData] = useState(null);
  const { config: oauthConfig } = useOAuthConfig();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    geoAPI.detect()
      .then((res) => {
        if (res?.success && res.data?.countryCode) {
          setDetectedCountry({ countryCode: res.data.countryCode, countryName: res.data.countryName });
          document.cookie = `appofa_detected_country=${res.data.countryCode}; path=/; max-age=3600; SameSite=Lax`;
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const prepareRegistrationData = (data = {}) => {
    const { confirmPassword, ...registerData } = data;
    return registerData;
  };

  const doRegister = async (data) => {
    setLoading(true);
    try {
      await register(prepareRegistrationData(data));
      success(t('register_success'));
      router.push('/');
    } catch (err) {
      error(err.message || t('register_fail'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      error(t('passwords_no_match'));
      return;
    }

    if (detectedCountry.countryCode) {
      setPendingRegisterData(prepareRegistrationData(formData));
      setShowDiasporaModal(true);
      return;
    }
    await doRegister(formData);
  };

  const handleDiasporaConfirm = async (homeLocationId) => {
    setShowDiasporaModal(false);
    await doRegister({
      ...pendingRegisterData,
      isDiaspora: true,
      residenceCountryCode: detectedCountry.countryCode,
      homeLocationId,
    });
  };

  const handleDiasporaDecline = async () => {
    setShowDiasporaModal(false);
    await doRegister(pendingRegisterData);
  };

  const handleGithubSignup = async () => {
    try {
      setLoading(true);
      const response = await authAPI.initiateGithubOAuth('login');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || t('github_fail'));
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
      error(err.message || t('google_fail'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('register_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('already_have_account')}{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('submit_login')}
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

        <AuthDivider text={t('or_register_with')} />

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <FormInput
              name="username"
              type="text"
              label={t('username')}
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              placeholder={t('username')}
            />

            <FormInput
              name="email"
              type="email"
              label={t('email')}
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              placeholder={t('email')}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                name="firstNameNative"
                type="text"
                label={t('first_name')}
                value={formData.firstNameNative}
                onChange={handleChange}
                autoComplete="given-name"
                placeholder={t('first_name')}
              />
              <FormInput
                name="lastNameNative"
                type="text"
                label={t('last_name')}
                value={formData.lastNameNative}
                onChange={handleChange}
                autoComplete="family-name"
                placeholder={t('last_name')}
              />
            </div>

            <FormInput
              name="password"
              type="password"
              label={t('password')}
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder={t('password')}
            />

            <FormInput
              name="confirmPassword"
              type="password"
              label={t('confirm_password')}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              placeholder={t('confirm_password')}
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
                {t('searchable')}
              </label>
            </div>

          </div>

          <div>
            <Button type="submit" loading={loading} size="md" className="w-full">
              {t('submit_register')}
            </Button>
          </div>
        </form>
      </div>
      <DiasporaModal
        isOpen={showDiasporaModal}
        detectedCountryName={detectedCountry.countryName}
        onConfirmDiaspora={handleDiasporaConfirm}
        onDecline={handleDiasporaDecline}
        onSkip={handleDiasporaDecline}
      />
    </div>
  );
}
