'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import { foundingInitiativeAPI } from '@/lib/api/foundingInitiative';
import LoginLink from '@/components/ui/LoginLink';

const govSigningUrl = 'https://www.gov.gr/el/services/1001729/psephiake-bebaiose-eggraphou';

function SubmitCode({ document, onInterestChange }) {
  const t = useTranslations('foundingInitiative.digitalSigning');
  const { data, loading, error, refetch, setData } = useAsyncData(foundingInitiativeAPI.getDigitalSignature, []);
  const [replacing, setReplacing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setSaving(true);
    setSaveError('');
    try {
      const result = await foundingInitiativeAPI.submitDigitalSignature({
        code: fields.get('code').trim(), consent: fields.has('consent'), documentSha256: document.sha256,
      });
      setData(result);
      setReplacing(false);
      onInterestChange?.();
    } catch (err) {
      setSaveError(t(err.status === 409 ? 'codeConflict' : 'submitError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p role="status" className="text-sm text-slate-700">{t('loading')}</p>;
  if (error) return <p className="text-sm text-slate-700">{t('submitError')}{' '}
    <button type="button" onClick={refetch} className="font-semibold text-[var(--brand-hover)] underline">{t('retry')}</button>
  </p>;
  if (data?.data?.verified) return <p role="status" className="text-sm font-semibold text-[var(--brand-hover)]">{t('verified')}</p>;
  if (data?.data?.received && !replacing) return (
    <div className="space-y-1">
      <p role="status" className="text-sm font-semibold text-[var(--brand-hover)]">{t('received')}</p>
      <button type="button" onClick={() => setReplacing(true)} className="min-h-11 text-sm font-semibold text-[var(--brand-hover)] underline">{t('replace')}</button>
    </div>
  );

  return (
    <form onSubmit={submit}>
      <fieldset disabled={saving} className="space-y-3">
        <label className="block text-sm font-semibold text-slate-900">{t('codeLabel')}
          <input name="code" required minLength={12} maxLength={64} spellCheck={false} autoComplete="off" autoCapitalize="none"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono" />
        </label>
        <label className="flex items-start gap-2 text-sm leading-6 text-slate-700">
          <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]" />
          {t('consent')}
        </label>
        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
        <button className="min-h-11 rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">{t('submit')}</button>
      </fieldset>
    </form>
  );
}

export default function FoundingDigitalSigning({ document, headingLevel = 3, onInterestChange }) {
  const Heading = `h${headingLevel}`;
  const t = useTranslations('foundingInitiative.digitalSigning');
  const { user, loading } = useAuth();

  return (
    <div id="digital-signing" className="mt-4 scroll-mt-24 space-y-3 border-t border-brand-border pt-4">
      <Heading className="font-semibold text-slate-900">{t('title')}</Heading>
      {document ? (
        <>
          <p className="text-sm leading-6 text-slate-700">{t('steps')}</p>
          <a href={govSigningUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-hover)] underline">{t('openGovGr')}</a>
          {user ? <SubmitCode key={user.id} document={document} onInterestChange={onInterestChange} /> : !loading && (
            <LoginLink redirectTo="/founding-initiative#digital-signing" className="block min-h-11 text-sm font-semibold text-[var(--brand-hover)] underline">{t('signIn')}</LoginLink>
          )}
        </>
      ) : <p className="text-sm leading-6 text-slate-700">{t('pending')}</p>}
    </div>
  );
}
