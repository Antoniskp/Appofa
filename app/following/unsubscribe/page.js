'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { issueFollowAPI } from '@/lib/api/issueFollows';

export default function UnsubscribeProposalDigestPage() {
  const t = useTranslations('proposalDigest');
  const [state, setState] = useState('loading');
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setState('error'); return; }
    issueFollowAPI.unsubscribeDigest(token).then((result) => setState(result.success ? 'done' : 'error')).catch(() => setState('error'));
  }, []);
  return <main className="app-container max-w-2xl py-16"><section className="rounded-xl border bg-white p-8 text-center">
    <h1 className="text-2xl font-bold text-gray-900">{t(state === 'done' ? 'unsubscribedTitle' : state === 'error' ? 'unsubscribeErrorTitle' : 'unsubscribeLoadingTitle')}</h1>
    <p className="mt-3 text-gray-600">{t(state === 'done' ? 'unsubscribedBody' : state === 'error' ? 'unsubscribeErrorBody' : 'unsubscribeLoadingBody')}</p>
  </section></main>;
}
