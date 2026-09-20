'use client';
import { useTranslations } from 'next-intl';
import ProgressFeed from '@/components/ProgressFeed';

export default function ProgressPage() {
  const t = useTranslations('democracy');
  return <div className="min-h-screen bg-slate-50 py-12"><div className="app-container"><p className="text-sm font-semibold uppercase tracking-widest text-teal-800">{t('accountability')}</p><h1 className="mt-3 text-3xl font-bold text-slate-900">{t('progressHeading')}</h1><p className="mb-8 mt-3 max-w-2xl text-slate-600">{t('reported')}</p><ProgressFeed /></div></div>;
}
