'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import FormInput from '@/components/ui/FormInput';
import OAuthButtons from '@/components/ui/OAuthButtons';
import AuthDivider from '@/components/ui/AuthDivider';
import { authAPI, geoAPI } from '@/lib/api';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import Button from '@/components/ui/Button';
import { buildAuthPath, getAuthDestinationFromSearchParams, getPendingAuthDestination, resolveAuthDestination, saveReturnTo } from '@/lib/auth-redirect';

const PASSWORD_MIN_LENGTH = 8;
const USERNAME_CHECK_DELAY_MS = 350;

function PasswordInput({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  placeholder,
  helpText,
}) {
  const t = useTranslations('auth');
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <FormInput
        name={name}
        type={visible ? 'text' : 'password'}
        label={label}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        helpText={helpText}
        inputClassName="pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-3 top-9 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={visible ? t('hide_password') : t('show_password')}
        title={visible ? t('hide_password') : t('show_password')}
      >
        {visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
}

function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, user, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileVisibility: 'registered',
    gdprConsent: false,
    gdprMarketing: false,
  });
  const [loading, setLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState({ status: 'idle', message: '' });
  const { config: oauthConfig } = useOAuthConfig();
  const nextDestination = getPendingAuthDestination(searchParams);
  const loginHref = buildAuthPath('/login', nextDestination);
  const registrationOwnsRedirect = useRef(false);

  useEffect(() => {
    geoAPI.detect().then((res) => {
      const countryCode = String(res?.data?.countryCode || '').trim().toUpperCase();
      if (res?.success && /^[A-Z]{2}$/.test(countryCode)) {
        document.cookie = `appofa_detected_country=${countryCode}; path=/; max-age=3600; SameSite=Lax`;
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!authLoading && user && !registrationOwnsRedirect.current) {
      router.push(resolveAuthDestination(searchParams));
    }
  }, [user, authLoading, router, searchParams]);

  useEffect(() => {
    const username = formData.username.trim();
    if (username.length < 3) {
      setUsernameAvailability((current) => (
        current.status === 'idle' && current.message === ''
          ? current
          : { status: 'idle', message: '' }
      ));
      return;
    }

    setUsernameAvailability({ status: 'checking', message: t('username_checking') });
    const timeout = window.setTimeout(() => {
      authAPI.checkUsernameAvailability(username)
        .then((res) => {
          setUsernameAvailability(
            res?.available
              ? { status: 'available', message: t('username_available') }
              : { status: 'taken', message: t('username_taken') }
          );
        })
        .catch(() => {
          setUsernameAvailability({ status: 'idle', message: '' });
        });
    }, USERNAME_CHECK_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [formData.username]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (formData.password.length >= PASSWORD_MIN_LENGTH) score += 1;
    if (/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password)) score += 1;
    if (/\d/.test(formData.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) score += 1;
    return score;
  }, [formData.password]);

  const passwordMinLengthError = formData.password.length < PASSWORD_MIN_LENGTH
    ? t('password_min_length_register', { min: PASSWORD_MIN_LENGTH })
    : '';
  const passwordMismatchError = formData.password !== formData.confirmPassword
    ? t('passwords_no_match')
    : '';
  const usernameIsTaken = usernameAvailability.status === 'taken';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateCheckboxField = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const prepareRegistrationData = (data = {}) => {
    const { confirmPassword, gdprConsent, gdprMarketing, ...registerData } = data;
    const isDiaspora = Boolean(registerData.isDiaspora);
    return {
      ...registerData,
      isDiaspora,
      residenceCountryCode: isDiaspora ? (registerData.residenceCountryCode || null) : null,
      nationality: registerData.nationality || null,
      homeLocationId: registerData.homeLocationId ?? null,
    };
  };

  const validateAccount = () => {
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    if (passwordMinLengthError) {
      error(passwordMinLengthError);
      return false;
    }
    if (passwordMismatchError) {
      error(passwordMismatchError);
      return false;
    }
    if (usernameIsTaken) {
      error(t('username_taken'));
      return false;
    }
    if (!formData.gdprConsent) {
      error(t('gdpr_consent_error'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAccount()) return;

    // register() updates AuthProvider before this handler resumes. Keep the
    // already-signed-in guard from overriding the new account's destination.
    registrationOwnsRedirect.current = true;
    setLoading(true);
    try {
      await register(prepareRegistrationData(formData));
      success(t('register_success_verify_email'));

      // If the user had an explicit destination (action they were trying to complete), honour it.
      // Otherwise always route new users to onboarding so they can choose their participation goal.
      const explicitNext = getAuthDestinationFromSearchParams(searchParams);
      if (explicitNext) {
        router.push(explicitNext);
      } else {
        router.push('/onboarding');
      }
    } catch (err) {
      registrationOwnsRedirect.current = false;
      error(err.message || t('register_fail'));
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    try {
      setLoading(true);
      saveReturnTo(nextDestination);
      const response = await authAPI.initiateGithubOAuth('signup');
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
      saveReturnTo(nextDestination);
      const response = await authAPI.initiateGoogleOAuth('signup');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || t('google_fail'));
      setLoading(false);
    }
  };

  const usernameHintTone = usernameAvailability.status === 'available'
    ? 'text-green-600'
    : usernameAvailability.status === 'taken'
      ? 'text-red-600'
      : 'text-gray-500';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {t('register_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            {t('register_subtitle_fast')}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <form className="space-y-7 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
            {(oauthConfig.google || oauthConfig.github) && <div className="space-y-4">
              <OAuthButtons
                config={oauthConfig}
                onGithubLogin={handleGithubSignup}
                onGoogleLogin={handleGoogleSignup}
                disabled={loading}
              />
              <AuthDivider text={t('or_register_with_email')} />
            </div>}

            <div className="space-y-4">
              <div>
                <FormInput
                  name="username"
                  type="text"
                  label={t('username')}
                  value={formData.username}
                  onChange={handleChange}
                  error={usernameIsTaken ? t('username_taken') : ''}
                  required
                  autoComplete="username"
                  placeholder={t('username')}
                />
                {usernameAvailability.message && !usernameIsTaken && (
                  <p className={`mt-1 text-sm ${usernameHintTone}`} role="status">
                    {usernameAvailability.message}
                  </p>
                )}
              </div>

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

              <PasswordInput
                name="password"
                label={t('password')}
                value={formData.password}
                onChange={handleChange}
                onBlur={() => setPasswordTouched(true)}
                error={passwordTouched ? passwordMinLengthError : ''}
                autoComplete="new-password"
                placeholder={t('password')}
                helpText={t('password_strength_hint', { min: PASSWORD_MIN_LENGTH })}
              />

              {formData.password && (
                <div className="space-y-1" aria-live="polite">
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4].map((segment) => (
                      <span
                        key={segment}
                        className={`h-1 rounded-full ${passwordScore >= segment ? 'bg-blue-600' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{t(`password_strength_${Math.max(passwordScore, 1)}`)}</p>
                </div>
              )}

              <PasswordInput
                name="confirmPassword"
                label={t('confirm_password')}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => setConfirmPasswordTouched(true)}
                error={confirmPasswordTouched ? passwordMismatchError : ''}
                autoComplete="new-password"
                placeholder={t('confirm_password')}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  id="gdpr_consent"
                  name="gdpr_consent"
                  type="checkbox"
                  checked={formData.gdprConsent}
                  onChange={(e) => updateCheckboxField('gdprConsent', e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="gdpr_consent" className="ml-2 block text-sm text-gray-900">
                  {t('gdpr_consent_required_prefix')}{' '}
                  <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 underline hover:text-blue-800">
                    {t('terms_link')}
                  </Link>
                  {' '}{t('and')}{' '}
                  <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 underline hover:text-blue-800">
                    {t('privacy_link')}
                  </Link>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="gdpr_marketing"
                  name="gdpr_marketing"
                  type="checkbox"
                  checked={formData.gdprMarketing}
                  onChange={(e) => updateCheckboxField('gdprMarketing', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="gdpr_marketing" className="ml-2 block text-sm text-gray-900">
                  {t('gdpr_consent_marketing')}
                </label>
              </div>
            </div>

            <Button type="submit" loading={loading} disabled={usernameIsTaken} size="md" className="w-full">
              {t('submit_register')}
            </Button>

            <p className="text-center text-sm text-gray-600">
              {t('already_have_account')}{' '}
              <Link href={loginHref} className="font-medium text-blue-600 hover:text-blue-500">
                {t('submit_login')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const t = useTranslations('common');

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">{t('loading')}</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
