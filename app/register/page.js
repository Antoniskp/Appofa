'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import FormInput from '@/components/ui/FormInput';
import OAuthButtons from '@/components/ui/OAuthButtons';
import AuthDivider from '@/components/ui/AuthDivider';
import NationalitySelector from '@/components/ui/NationalitySelector';
import CascadingLocationSelector from '@/components/ui/CascadingLocationSelector';
import { authAPI, geoAPI, locationAPI } from '@/lib/api';
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
    firstNameNative: '',
    lastNameNative: '',
    nationality: '',
    homeLocationId: null,
    isDiaspora: false,
    residenceCountryCode: null,
    profileVisibility: 'registered',
    gdprConsent: false,
    gdprMarketing: false,
  });
  const [wantsModerator, setWantsModerator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState({ countryCode: null, countryName: null });
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [showOptionalSetup, setShowOptionalSetup] = useState(false);
  const [locationHasModerator, setLocationHasModerator] = useState(null);
  const [usernameAvailability, setUsernameAvailability] = useState({ status: 'idle', message: '' });
  const { config: oauthConfig } = useOAuthConfig();
  const nextDestination = getPendingAuthDestination(searchParams);
  const loginHref = buildAuthPath('/login', nextDestination);

  useEffect(() => {
    if (!authLoading && user) {
      router.push(resolveAuthDestination(searchParams));
    }
  }, [user, authLoading, router, searchParams]);

  useEffect(() => {
    geoAPI.detect()
      .then((res) => {
        if (res?.success && res.data?.countryCode) {
          const countryCode = String(res.data.countryCode).trim().toUpperCase();
          setDetectedCountry({ countryCode, countryName: res.data.countryName });
          if (countryCode === 'GR') {
            setFormData((prev) => (
              prev.nationality ? prev : { ...prev, nationality: 'GR', isDiaspora: false, residenceCountryCode: null }
            ));
          } else {
            setFormData((prev) => ({ ...prev, residenceCountryCode: countryCode }));
          }
          document.cookie = `appofa_detected_country=${countryCode}; path=/; max-age=3600; SameSite=Lax`;
        }
      })
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    if (!formData.homeLocationId) {
      setLocationHasModerator(null);
      setWantsModerator(false);
      return;
    }

    let cancelled = false;
    setLocationHasModerator(null);

    locationAPI.getById(formData.homeLocationId)
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res.location) {
          const hasMod = Boolean(res.location.hasModerator);
          setLocationHasModerator(hasMod);
          if (hasMod) setWantsModerator(false);
        } else {
          setLocationHasModerator(null);
        }
      })
      .catch(() => {
        if (!cancelled) setLocationHasModerator(null);
      });

    return () => { cancelled = true; };
  }, [formData.homeLocationId]);

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
        // Persist moderator intent before routing so the onboarding page can pre-select it.
        if (wantsModerator) {
          try { await authAPI.updateOnboarding({ goal: 'moderator' }); } catch { /* non-fatal */ }
        }
        router.push('/onboarding');
      }
    } catch (err) {
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

  const handleNationalityChange = (code) => {
    setFormData((prev) => ({ ...prev, nationality: code || '' }));
  };

  const toggleGreekNationality = () => {
    setFormData((prev) => ({ ...prev, nationality: prev.nationality === 'GR' ? '' : 'GR' }));
  };

  const handleDiasporaChange = (isDiaspora) => {
    setFormData((prev) => ({
      ...prev,
      isDiaspora,
      residenceCountryCode: isDiaspora ? detectedCountry.countryCode : null,
    }));
  };

  const handleLocationChange = (locationId) => {
    setFormData((prev) => ({ ...prev, homeLocationId: locationId }));
    if (!locationId) setWantsModerator(false);
  };

  const showModeratorOption = formData.homeLocationId && locationHasModerator === false;
  const usernameHintTone = usernameAvailability.status === 'available'
    ? 'text-green-600'
    : usernameAvailability.status === 'taken'
      ? 'text-red-600'
      : 'text-gray-500';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
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
            <div className="space-y-4">
              <OAuthButtons
                config={oauthConfig}
                onGithubLogin={handleGithubSignup}
                onGoogleLogin={handleGoogleSignup}
                disabled={loading}
              />
              <AuthDivider text={t('or_register_with_email')} />
            </div>

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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <button
                type="button"
                onClick={() => setShowOptionalSetup((current) => !current)}
                className="flex w-full items-center justify-between gap-3 text-left"
                aria-expanded={showOptionalSetup}
              >
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{t('optional_setup_title')}</span>
                  <span className="mt-1 block text-sm text-gray-600">{t('optional_setup_description')}</span>
                </span>
                <span className="shrink-0 text-sm font-medium text-blue-600">
                  {showOptionalSetup ? t('optional_setup_hide') : t('optional_setup_show')}
                </span>
              </button>

              {showOptionalSetup && (
                <div className="space-y-5 border-t border-gray-200 pt-4">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                        <GlobeAltIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{t('nationality_title')}</h3>
                        <p className="text-sm text-gray-600">{t('nationality_help')}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleGreekNationality}
                      className={`flex w-full items-center justify-between gap-4 rounded-lg border p-4 text-left transition-colors ${
                        formData.nationality === 'GR'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{t('greek_nationality_label')}</p>
                        <p className="text-sm text-gray-500">{t('greek_nationality_help')}</p>
                      </div>
                      {formData.nationality === 'GR' && (
                        <CheckCircleIcon className="h-6 w-6 shrink-0 text-blue-600" />
                      )}
                    </button>

                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">{t('other_nationality_label')}</p>
                      <NationalitySelector
                        id="nationality"
                        name="nationality"
                        value={formData.nationality === 'GR' ? '' : formData.nationality}
                        onChange={handleNationalityChange}
                      />
                    </div>

                    {detectedCountry.countryCode && detectedCountry.countryCode !== 'GR' && (
                      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-900">
                          {t('register_diaspora_title')}
                        </p>
                        <p className="mt-1 text-sm text-emerald-800">
                          {t('register_diaspora_detected_country', {
                            country: detectedCountry.countryName || detectedCountry.countryCode,
                          })}{' '}
                          {t('register_diaspora_description')}
                        </p>
                        <label className="mt-3 flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={formData.isDiaspora}
                            onChange={(e) => handleDiasporaChange(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-emerald-900">
                            {t('register_diaspora_checkbox')}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                        <MapPinIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{t('location_title')}</h3>
                        <p className="text-sm text-gray-600">{t('location_help')}</p>
                      </div>
                    </div>

                    <CascadingLocationSelector
                      value={formData.homeLocationId}
                      onChange={handleLocationChange}
                      allowClear
                    />

                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex gap-3">
                        <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <p className="text-sm text-amber-900">{t('location_fallback_help')}</p>
                      </div>
                    </div>

                    {showModeratorOption && (
                      <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={wantsModerator}
                            onChange={(e) => setWantsModerator(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-indigo-900">
                              {t('moderator_interest_label')}
                            </span>
                            <span className="mt-1 block text-sm text-indigo-800">
                              {t('moderator_interest_help')}
                            </span>
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex gap-3">
                      <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                      <p className="text-sm text-blue-900">{t('location_verification_help')}</p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t('profile_visibility_label')}</p>
                      <p className="mt-1 text-xs text-gray-600">{t('profile_visibility_help_register')}</p>
                    </div>
                    {['hidden', 'registered', 'public'].map((visibility) => (
                      <label key={visibility} className="flex items-start gap-2 text-sm text-gray-800">
                        <input
                          type="radio"
                          name="profileVisibility"
                          value={visibility}
                          checked={formData.profileVisibility === visibility}
                          onChange={handleChange}
                          className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{t(`profile_visibility_option_${visibility}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
