'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { newsletterAPI } from '@/lib/api';

export default function NewsletterUnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!token) {
        if (!active) return;
        setState('error');
        setMessage('Invalid unsubscribe link.');
        return;
      }
      try {
        const response = await newsletterAPI.unsubscribe(token);
        if (!active) return;
        setState('success');
        setMessage(response?.message || 'If this unsubscribe link is valid, the email has been unsubscribed.');
      } catch (error) {
        if (!active) return;
        setState('error');
        setMessage(error.message || 'Could not process unsubscribe request.');
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Newsletter Unsubscribe</h1>
        {state === 'loading' ? (
          <p className="text-gray-600">Processing your request...</p>
        ) : (
          <p className={state === 'success' ? 'text-emerald-700' : 'text-red-700'}>{message}</p>
        )}
        <Link
          href="/"
          className="inline-flex mt-6 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
