'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAsyncData } from '@/hooks/useAsyncData';
import { foundingInitiativeAPI } from '@/lib/api/foundingInitiative';
import FoundingDigitalSigning from './FoundingDigitalSigning';

export default function FoundingSignatureProgress({ showNames = false, refreshKey = 0, headingLevel = 2, onInterestChange }) {
  const Heading = `h${headingLevel}`;
  const t = useTranslations('foundingInitiative.signatures');
  const { data, loading, error, refetch } = useAsyncData(
    () => foundingInitiativeAPI.getProgress(showNames),
    [showNames, refreshKey],
  );
  const progress = data?.data;
  const showVerified = showNames || progress?.verifiedCount > 0;

  return (
    <section aria-labelledby="founding-signature-progress" className="rounded-xl border border-brand-border bg-ivory p-5">
      <Heading id="founding-signature-progress" className="font-semibold text-slate-900">{t(showNames ? 'progressTitle' : 'signingInterestTitle')}</Heading>
      {error ? (
        <p className="mt-2 text-sm text-slate-700">
          {t('loadError')}{' '}
          <button type="button" onClick={refetch} className="font-semibold text-[var(--brand)] underline">{t('retry')}</button>
        </p>
      ) : progress ? (
        <>
          {showVerified && (
            <div className={showNames ? 'mt-2' : 'mt-4 border-t border-brand-border pt-3'}>
              <p id="founding-verified-count" className={showNames ? 'text-xl font-semibold text-charcoal' : 'text-sm font-medium text-slate-700'}>
                {t('progressCount', { count: progress.verifiedCount, goal: progress.goal })}
              </p>
              <progress aria-labelledby="founding-verified-count" className="mt-2 block h-2 w-full overflow-hidden rounded-full accent-[var(--brand)]"
                max={progress.goal} value={Math.min(progress.verifiedCount, progress.goal)} />
            </div>
          )}
          {progress.document ? (
            <div className="mt-2">
              <a href={progress.document.pdfUrl} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-hover)] underline">
                {t('viewDocument', { version: progress.document.version })}
              </a>
              {showNames && <p className="break-all font-mono text-xs text-slate-700">SHA-256 {progress.document.sha256}</p>}
            </div>
          ) : <p className="mt-3 text-sm leading-6 text-slate-700">{t('waitingForDocument')}</p>}
          {!showNames && <FoundingDigitalSigning document={progress.govGrEnabled ? progress.document : null} headingLevel={headingLevel + 1}
            onInterestChange={onInterestChange} />}
          {!showNames && <p role="status" className="mt-3 text-sm leading-6 text-slate-600">{t('interestCount', { count: progress.signingInterestCount })}</p>}
          {showNames && (
            <div className="mt-5 border-t border-brand-border pt-5">
              <h3 className="font-semibold text-slate-900">{t('publishedNames')}</h3>
              {progress.names?.length ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {progress.names.map((name, index) => (
                    <li key={index} className="break-words rounded-lg border border-brand-border bg-white px-4 py-3 text-sm text-slate-900">{name}</li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-slate-700">{t('emptyNames')}</p>}
            </div>
          )}
        </>
      ) : loading && <p role="status" className="mt-2 text-sm text-slate-700">{t('loading')}</p>}
      {!showNames && progress?.verifiedCount > 0 && <Link href="/founding-initiative/first-200" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-hover)] underline">{t('first200Action')}</Link>}
    </section>
  );
}
