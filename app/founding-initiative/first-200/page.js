import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import FoundingRecognition from '@/components/political/FoundingRecognition';
import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('foundingInitiative.signatures.first200');

export default async function FirstFoundingSignersPage() {
  const t = await getTranslations('foundingInitiative.signatures');

  return (
    <main className="bg-ivory py-8 sm:py-12">
      <div className="app-container max-w-3xl space-y-6">
        <header>
          <Link href="/founding-initiative#get-involved" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-hover)] underline">{t('back')}</Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{t('first200')}</h1>
          <p className="mt-3 leading-7 text-slate-700">{t('first200Intro')}</p>
        </header>
        <FoundingRecognition />
      </div>
    </main>
  );
}
