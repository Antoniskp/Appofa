'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { newsletterAPI } from '@/lib/api';

export default function NewsletterSignupForm() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await newsletterAPI.subscribe({
        email,
        name: name.trim() || undefined,
        locale,
      });
      if (response?.success) {
        setMessage(t('newsletter_success_generic'));
        setEmail('');
        setName('');
      } else {
        setError(t('newsletter_error_generic'));
      }
    } catch (submitError) {
      setError(submitError.message || t('newsletter_error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 mb-6">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">{t('newsletter_title')}</h3>
        <p className="text-sm text-gray-300 mt-1">{t('newsletter_description')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('newsletter_name_placeholder')}
            className="w-full rounded-lg border border-gray-600 bg-gray-800/80 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="name"
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('newsletter_email_placeholder')}
            className="w-full rounded-lg border border-gray-600 bg-gray-800/80 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="email"
            required
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            {loading ? t('newsletter_submitting') : t('newsletter_submit')}
          </button>
          <p className="text-xs text-gray-400">{t('newsletter_privacy_note')}</p>
        </div>
      </form>

      {message && (
        <p className="mt-3 text-sm text-emerald-300" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
