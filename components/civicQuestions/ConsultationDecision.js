'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { civicQuestionAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import AlertMessage from '@/components/ui/AlertMessage';
import LoginLink from '@/components/ui/LoginLink';

const choices = ['reflects', 'partly', 'does_not_reflect'];

function Evaluation({ id, user }) {
  const t = useTranslations('consultations');
  const format = useFormatter();
  const { data, setData, loading, error, refetch } = useAsyncData(() => civicQuestionAPI.getConsultationEvaluation(id), [id, user?.id], {
    transform: result => result.data,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  async function evaluate(choice) {
    setSaving(true);
    setSaveError('');
    try {
      const result = await civicQuestionAPI.evaluateConsultation(id, choice);
      setData(result.data);
    } catch (err) {
      setSaveError(err.message || t('evaluationError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 border-t border-teal-200 pt-5">
      <h3 className="text-lg font-semibold text-slate-900">{t('evaluate')}</h3>
      <p className="mt-1 text-sm text-slate-600">{t('evaluationPrivacy')}</p>
      {loading && <p role="status" className="mt-3 text-sm">{t('loading')}</p>}
      {error && <div className="mt-3"><AlertMessage message={t('loadError')} /><button type="button" onClick={() => refetch()} className="mt-2 min-h-11 text-sm font-semibold text-teal-800 underline">{t('retry')}</button></div>}
      {data && !loading && !error && <ul className="mt-3 grid gap-2 sm:grid-cols-3" aria-label={t('evaluationResults')}>
        {choices.map(choice => <li key={choice}>
          {user ? (
            <button type="button" disabled={saving} aria-pressed={data.myEvaluation === choice} onClick={() => evaluate(choice)} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-teal-300 bg-white px-3 py-2 text-left text-sm text-teal-900 aria-pressed:border-teal-800 aria-pressed:bg-teal-100 aria-pressed:font-semibold disabled:opacity-60">
              {t(choice)} <span>{format.number(data.counts[choice])}</span>
            </button>
          ) : <div className="flex justify-between gap-2 rounded-lg border border-teal-200 bg-white p-3 text-sm">{t(choice)} <span>{format.number(data.counts[choice])}</span></div>}
        </li>)}
      </ul>}
      {!user && <LoginLink className="mt-3 inline-block font-semibold text-teal-800 underline">{t('loginEvaluation')}</LoginLink>}
      {saveError && <div className="mt-3"><AlertMessage message={saveError} /></div>}
    </div>
  );
}

export default function ConsultationDecision({ question, user, votingOpen, onPublished }) {
  const t = useTranslations('consultations');
  const format = useFormatter();
  const { publisherName, response } = question.parliamentaryConsultation;
  const isAuthor = question.creatorId === user?.id;
  const { data: publisher } = useAsyncData(
    () => isAuthor ? civicQuestionAPI.getConsultationPublisher() : null, [isAuthor, user?.id],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function publish(event) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError('');
    try {
      await civicQuestionAPI.publishConsultationDecision(question.id, fields);
      await onPublished();
    } catch (err) {
      setError(err.message || t('publishError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="consultation-decision" className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5">
      <h2 id="consultation-decision" className="text-xl font-semibold text-slate-900">{t('decisionHeading')}</h2>
      {response ? <>
        <p className="mt-2 text-sm text-slate-600">{publisherName} · <time dateTime={response.publishedAt}>{format.dateTime(new Date(response.publishedAt), { dateStyle: 'medium' })}</time></p>
        <p className="mt-3 whitespace-pre-wrap font-semibold text-slate-900">{response.decision}</p>
        <p className="mt-2 whitespace-pre-wrap text-slate-700">{response.reasoning}</p>
        {response.evidenceUrl && <a href={response.evidenceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-teal-800 underline">{t('evidenceLink')} ↗</a>}
        <Evaluation id={question.id} user={user} />
      </> : <>
        <p className="mt-2 text-sm text-slate-600">{t(votingOpen ? 'decisionAfterVote' : 'awaitingDecision')}</p>
        {!votingOpen && question.status !== 'archived' && isAuthor && publisher?.data?.publisherName && (
          <form onSubmit={publish} className="mt-4 space-y-4">
            <AlertMessage message={error} />
            <label className="block text-sm font-semibold">{t('decision')}
              <textarea name="decision" required minLength={5} maxLength={500} rows={2} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold">{t('reasoning')}
              <textarea name="reasoning" required minLength={10} maxLength={4000} rows={4} className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold">{t('evidenceLink')}
              <input name="evidenceUrl" type="url" className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 font-normal" />
            </label>
            <p className="text-sm text-slate-600">{t('decisionFixed')}</p>
            <button disabled={saving} className="min-h-11 rounded-lg bg-teal-800 px-4 text-sm font-semibold text-white disabled:opacity-60">{t(saving ? 'saving' : 'publishDecision')}</button>
          </form>
        )}
      </>}
    </section>
  );
}
