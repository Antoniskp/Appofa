'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setErrorMessage('');

    try {
      const response = await authAPI.forgotPassword(email);
      setMessage(response?.message || t('forgot_password_success_generic'));
    } catch (error) {
      setErrorMessage(error.message || t('forgot_password_generic_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('forgot_password_title')}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('forgot_password_subtitle')}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <FormInput
            name="email"
            type="email"
            label={t('email')}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder={t('email')}
          />

          {message ? (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">{message}</p>
          ) : null}
          {errorMessage ? (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{errorMessage}</p>
          ) : null}

          <Button type="submit" loading={loading} size="md" className="w-full">
            {t('submit_forgot_password')}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            {t('back_to_login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
