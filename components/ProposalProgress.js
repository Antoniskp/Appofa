'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { suggestionAPI } from '@/lib/api';
import AlertMessage from '@/components/ui/AlertMessage';

const STAGES = ['discussion', 'voting', 'response', 'delivery', 'completed', 'rejected'];
const FIELDS = ['responsibleBody', 'responseDeadline', 'cost', 'decisionPollId', 'response', 'milestones', 'evidenceUrl', 'note'];

export default function ProposalProgress({ proposal, user, onUpdated }) {
  const t = useTranslations('democracy');
  const progress = proposal.progress;
  const canManage = user && (user.id === proposal.authorId || user.role === 'admin');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const stage = progress?.stage || 'discussion';
  const startEditing = () => {
    setError('');
    setDraft(Object.fromEntries([...FIELDS.map(key => [key, key === 'note' ? '' : progress?.[key] || '']), ['stage', stage], ['revision', progress?.revision || 0]]));
  };
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await suggestionAPI.updateProgress(proposal.id, draft);
      if (!result.success) throw new Error(result.message);
      onUpdated(result.data);
      setDraft(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  return (
    <section aria-label={t('progressTitle')} className="mb-6 rounded-2xl border border-teal-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">{t('progressTitle')}</h2>
        {canManage && !draft && <button type="button" onClick={startEditing} className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white">{t('update')}</button>}
      </div>
      <p className="mt-2 text-sm text-slate-600">{t('reported')}</p>
      <ol className="my-5 flex flex-wrap gap-2" aria-label={t('stages')}>
        {STAGES.filter(item => item !== 'rejected' || stage === 'rejected').map(item => <li key={item} aria-current={item === stage ? 'step' : undefined} className={`rounded-full px-3 py-1 text-xs font-semibold ${item === stage ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-600'}`}>{t(`stage_${item}`)}</li>)}
      </ol>
      {!progress && <p className="text-sm text-slate-600">{t('noProgress')}</p>}
      {progress && <>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {['responsibleBody', 'responseDeadline', 'cost', 'response', 'milestones'].map(key => <div key={key}><dt className="font-semibold text-slate-700">{t(key)}</dt><dd className="mt-1 whitespace-pre-wrap text-slate-600">{progress[key] || t('notSet')}</dd></div>)}
        </dl>
        <div className="my-4 flex flex-wrap gap-4 text-sm font-semibold text-teal-800">
          {progress.decisionPollId && <Link href={`/polls/${progress.decisionPollId}`}>{t('openConsultation')} →</Link>}
          {progress.evidenceUrl && <a href={progress.evidenceUrl} target="_blank" rel="noopener noreferrer">{t('evidenceUrl')} ↗</a>}
        </div>
        <details className="border-t pt-3">
          <summary className="cursor-pointer text-sm font-semibold">{t('history')} ({progress.history.length})</summary>
          <ol className="mt-3 space-y-3">{[...progress.history].reverse().map(event => <li key={event.revision} className="border-l-2 border-teal-200 pl-3 text-sm">
            <p className="font-semibold">{t(`stage_${event.stage}`)} · <time dateTime={event.at}>{new Date(event.at).toLocaleDateString()}</time> · {t(event.publisherRole)}</p>
            <p className="whitespace-pre-wrap">{event.note}</p>
            <details className="mt-1 text-slate-600"><summary className="cursor-pointer">{t('snapshot')}</summary><dl className="space-y-1">{FIELDS.filter(key => key !== 'note').map(key => <div key={key}><dt className="font-medium">{t(key)}</dt><dd className="whitespace-pre-wrap">{event[key] || t('notSet')}</dd></div>)}</dl></details>
          </li>)}</ol>
        </details>
      </>}
      {draft && <form onSubmit={save} className="mt-5 space-y-4 border-t pt-5">
        <AlertMessage message={error} />
        <label className="block text-sm font-semibold">{t('stages')}<select value={draft.stage} onChange={event => setDraft({ ...draft, stage: event.target.value })} className="mt-1 block w-full rounded-lg border p-2">{STAGES.map(item => <option key={item} value={item}>{t(`stage_${item}`)}</option>)}</select></label>
        <p className="text-xs text-slate-600">{t('requirements')}</p>
        {FIELDS.map(key => <label key={key} className="block text-sm font-semibold">{t(key)}
          {['response', 'milestones', 'note'].includes(key)
            ? <textarea required={key === 'note'} maxLength={4000} rows={3} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} className="mt-1 block w-full rounded-lg border p-2 font-normal" />
            : <input type={key === 'responseDeadline' ? 'date' : key === 'decisionPollId' ? 'number' : key === 'evidenceUrl' ? 'url' : 'text'} min={key === 'decisionPollId' ? 1 : undefined} maxLength={key === 'responsibleBody' ? 200 : 4000} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} className="mt-1 block w-full rounded-lg border p-2 font-normal" />}
        </label>)}
        <div className="flex gap-3"><button disabled={saving} className="rounded-lg bg-teal-800 px-4 py-2 text-white disabled:opacity-50">{t(saving ? 'saving' : 'save')}</button><button type="button" disabled={saving} onClick={() => setDraft(null)}>{t('cancel')}</button></div>
      </form>}
    </section>
  );
}
