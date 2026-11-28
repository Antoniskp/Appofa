'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import FormInput from '@/components/ui/FormInput';
import OAuthButtons from '@/components/ui/OAuthButtons';
import AlertMessage from '@/components/ui/AlertMessage';
import { authAPI, geoAPI } from '@/lib/api';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import Button from '@/components/ui/Button';
import QuickSignIn from '@/components/auth/QuickSignIn';
import { buildAuthPath, getPendingAuthDestination, resolveAuthDestination, saveReturnTo } from '@/lib/auth-redirect';

const PASSWORD_MIN_LENGTH = 8;

function RegisterForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, user, loading: authLoading } = useAuth();
  const { config: oauthConfig } = useOAuthConfig();
  const [formData, setFormData] = useState({ email: '', password: '', gdprConsent: false });
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const formRef = useRef(null);
  const registrationOwnsRedirect = useRef(false);
  const focusField = useRef(null);
  const nextDestination = getPendingAuthDestination(searchParams);
  const loginHref = buildAuthPath('/login', nextDestination);

  useEffect(() => {
    if (!loading && focusField.current) {
      formRef.current?.elements[focusField.current]?.focus();
      focusField.current = null;
    }
  }, [errors, loading]);

  useEffect(() => {
    geoAPI.detect().then((res) => {
      const code = String(res?.data?.countryCode || '').trim().toUpperCase();
      if (res?.success && /^[A-Z]{2}$/.test(code)) {
        document.cookie = `appofa_detected_country=${code}; path=/; max-age=3600; SameSite=Lax`;
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!authLoading && user && !registrationOwnsRedirect.current) {
      router.push(resolveAuthDestination(searchParams));
    }
  }, [user, authLoading, router, searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: '' }));
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const nextErrors = {};
    if (!formData.email.trim() || !formRef.current.elements.email.validity.valid) nextErrors.email = t('email_invalid');
    if (formData.password.length < PASSWORD_MIN_LENGTH) nextErrors.password = t('password_min_length_register', { min: PASSWORD_MIN_LENGTH });
    if (!formData.gdprConsent) nextErrors.gdprConsent = t('gdpr_consent_error');
    setErrors(nextErrors);
    setSubmitError('');
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      focusField.current = firstError === 'gdprConsent' ? 'gdpr_consent' : firstError;
      return;
    }
    // register() populates auth state before this promise resumes.
    registrationOwnsRedirect.current = true;
    setLoading(true);
    try {
      await register({ email: formData.email.trim(), password: formData.password, locale, profileVisibility: 'registered' });
      const destination = nextDestination && nextDestination !== '/' ? nextDestination : '/onboarding';
      if (nextDestination) resolveAuthDestination(searchParams);
      router.push(destination);
    } catch (err) {
      registrationOwnsRedirect.current = false;
      if (err.status === 400 && /already exists|already in use/i.test(err.message || '')) {
        setErrors({ email: t('email_already_registered') });
        focusField.current = 'email';
      } else {
        setSubmitError(t('register_retry'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSignIn = ({ isNewUser }) => {
    const fallback = isNewUser ? '/onboarding' : '/';
    const destination = nextDestination && nextDestination !== '/' ? nextDestination : fallback;
    if (nextDestination) resolveAuthDestination(searchParams);
    router.push(destination);
  };

  const handleOAuth = async (provider) => {
    if (loading) return;
    setLoading(true);
    setSubmitError('');
    try {
      saveReturnTo(nextDestination || '/onboarding');
      const response = await (provider === 'google' ? authAPI.initiateGoogleOAuth('signup') : authAPI.initiateGithubOAuth('signup'));
      if (!response.success || !response.data?.authUrl) throw new Error('OAuth unavailable');
      window.location.href = response.data.authUrl;
    } catch {
      setSubmitError(t(provider === 'google' ? 'google_fail' : 'github_fail'));
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('register_title')}</h1>
          <p className="mt-3 text-base leading-6 text-gray-600">{t('register_subtitle_simple')}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="mb-5 text-sm leading-6 text-gray-600">{t('quick_subtitle')}</p>
          <QuickSignIn
            onSuccess={handleCodeSignIn}
            onPendingChange={(pending) => { registrationOwnsRedirect.current = pending; }}
            returnTo={nextDestination || '/onboarding'}
          />
          <details className="mt-6 border-t border-gray-200 pt-4 text-sm" open={Boolean(submitError || Object.values(errors).some(Boolean))}>
          <summary className="cursor-pointer py-2 font-medium text-gray-700">{t('register_with_password')}</summary>
          <form ref={formRef} data-auth-form="password" className="space-y-5 pt-4" onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <FormInput name="email" type="email" label={t('email')} value={formData.email} onChange={handleChange} required autoComplete="email" inputMode="email" autoCapitalize="none" disabled={loading} error={errors.email} placeholder="name@example.com" />
            <div>
              <FormInput name="password" type={passwordVisible ? 'text' : 'password'} label={t('password')} value={formData.password} onChange={handleChange} required autoComplete="new-password" disabled={loading} error={errors.password} helpText={t('password_min_length_register', { min: PASSWORD_MIN_LENGTH })} />
              <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} aria-pressed={passwordVisible} className="mt-1 min-h-11 text-sm font-semibold text-blue-700 underline">{t(passwordVisible ? 'hide_password' : 'show_password')}</button>
            </div>
            <p className="text-sm leading-6 text-gray-600">{t('generated_username_hint')}</p>
            <div>
              <label className="flex items-start gap-3 text-sm leading-6 text-gray-900">
                <input id="gdpr_consent" name="gdpr_consent" type="checkbox" checked={formData.gdprConsent} disabled={loading} onChange={(e) => { setFormData((previous) => ({ ...previous, gdprConsent: e.target.checked })); setErrors((previous) => ({ ...previous, gdprConsent: '' })); }} required aria-invalid={Boolean(errors.gdprConsent)} aria-describedby={errors.gdprConsent ? 'consent-error' : undefined} className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300 text-blue-600" />
                <span>{t('gdpr_consent_required_prefix')}{' '}<Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline">{t('terms_link')}</Link>{' '}{t('and')}{' '}<Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline">{t('privacy_link')}</Link></span>
              </label>
              {errors.gdprConsent && <p id="consent-error" role="alert" className="mt-2 text-sm text-red-700">{errors.gdprConsent}</p>}
            </div>
            {submitError && <AlertMessage message={submitError} />}
            <Button type="submit" disabled={loading} className="min-h-12 w-full">{t(loading ? 'register_creating' : 'submit_register')}</Button>
            {oauthConfig.github && <details className="text-sm">
              <summary className="cursor-pointer py-2 font-medium text-gray-600">{t('other_signup_options')}</summary>
              <OAuthButtons config={{ github: true }} onGithubLogin={() => handleOAuth('github')} disabled={loading} />
            </details>}
          </form>
          </details>
          <p className="mt-6 text-center text-sm text-gray-600">{t('already_have_account')}{' '}<Link href={loginHref} className="font-semibold text-blue-700 underline">{t('submit_login')}</Link></p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const t = useTranslations('common');
  return <Suspense fallback={<p className="p-8 text-center" role="status">{t('loading')}</p>}><RegisterForm /></Suspense>;
}
