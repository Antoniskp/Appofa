'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAsyncData } from '@/hooks/useAsyncData';
import { foundingInitiativeAPI } from '@/lib/api/foundingInitiative';
import FoundingDigitalSigning from './FoundingDigitalSigning';

export default function FoundingSignatureProgress({ showNames = false, refreshKey = 0, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  const t = useTranslations('foundingInitiative.signatures');
  const { data, loading, error, refetch } = useAsyncData(
    () => foundingInitiativeAPI.getProgress(showNames),
    [showNames, refreshKey],
  );
  const progress = data?.data;

  return (
    <section aria-labelledby="founding-signature-progress" className="rounded-xl border border-teal-200 bg-teal-50 p-5">
      <Heading id="founding-signature-progress" className="font-semibold text-slate-900">{t('progressTitle')}</Heading>
      {error ? (
        <p className="mt-2 text-sm text-slate-700">
          {t('loadError')}{' '}
          <button type="button" onClick={refetch} className="font-semibold text-teal-800 underline">{t('retry')}</button>
        </p>
      ) : progress ? (
        <>
          <p className="mt-2 text-xl font-semibold text-teal-950">{t('progressCount', { count: progress.verifiedCount, goal: progress.goal })}</p>
          <progress aria-labelledby="founding-signature-progress" className="mt-2 block h-2 w-full overflow-hidden rounded-full accent-teal-800"
            max={progress.goal} value={Math.min(progress.verifiedCount, progress.goal)} />
          {progress.document ? (
            <div className="mt-2">
              <a href={progress.document.pdfUrl} className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-900 underline">
                {t('viewDocument', { version: progress.document.version })}
              </a>
              {showNames && <p className="break-all font-mono text-xs text-slate-700">SHA-256 {progress.document.sha256}</p>}
            </div>
          ) : <p className="mt-3 text-sm leading-6 text-slate-700">{t('waitingForDocument')}</p>}
          {!showNames && <FoundingDigitalSigning document={progress.govGrEnabled ? progress.document : null} headingLevel={headingLevel + 1} />}
          {showNames && (
            <div className="mt-5 border-t border-teal-200 pt-5">
              <h3 className="font-semibold text-slate-900">{t('publishedNames')}</h3>
              {progress.names?.length ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {progress.names.map((name, index) => (
                    <li key={index} className="break-words rounded-lg border border-teal-200 bg-white px-4 py-3 text-sm text-slate-900">{name}</li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-slate-700">{t('emptyNames')}</p>}
            </div>
          )}
        </>
      ) : loading && <p role="status" className="mt-2 text-sm text-slate-700">{t('loading')}</p>}
      {!showNames && progress?.verifiedCount > 0 && <Link href="/founding-initiative/first-200" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-teal-900 underline">{t('first200Action')}</Link>}
    </section>
  );
}
