'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { authAPI } from '@/lib/api';

function ResetPasswordForm() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const tokenPattern = /^[a-f0-9]{32,256}$/i;
  const hasToken = Boolean(token);
  const hasValidToken = tokenPattern.test(token);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!hasToken) {
      setErrorMessage(t('reset_password_missing_token'));
      return;
    }
    if (!hasValidToken) {
      setErrorMessage(t('reset_password_invalid_token'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('passwords_no_match'));
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({ token, newPassword });
      setSuccessMessage(response?.message || t('reset_password_success'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error?.code === 'RESET_TOKEN_EXPIRED') {
        setErrorMessage(t('reset_password_expired_token'));
      } else if (error?.code === 'RESET_TOKEN_INVALID') {
        setErrorMessage(t('reset_password_invalid_token'));
      } else {
        setErrorMessage(String(error?.message || t('reset_password_generic_error')));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('reset_password_title')}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('reset_password_subtitle')}
          </p>
        </div>

        {!hasToken ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            {t('reset_password_missing_token')}
          </p>
        ) : !hasValidToken ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            {t('reset_password_invalid_token')}
          </p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <FormInput
              name="newPassword"
              type="password"
              label={t('new_password')}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              autoComplete="new-password"
              placeholder={t('new_password')}
            />
            <FormInput
              name="confirmPassword"
              type="password"
              label={t('confirm_password')}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
              placeholder={t('confirm_password')}
            />

            {successMessage ? (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">{successMessage}</p>
            ) : null}
            {errorMessage ? (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{errorMessage}</p>
            ) : null}

            <Button type="submit" loading={loading} size="md" className="w-full">
              {t('submit_reset_password')}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            {t('login_again_cta')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const tCommon = useTranslations('common');

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">{tCommon('loading')}</p>
      </div>
    }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
