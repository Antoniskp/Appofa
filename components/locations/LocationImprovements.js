'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import { locationImprovementAPI as api } from '@/lib/api/location-improvements';
import LoginLink from '@/components/ui/LoginLink';
import AlertMessage from '@/components/ui/AlertMessage';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

const FIELDS = ['description', 'name_local', 'population_override', 'wikipedia_url'];
const KINDS = ['addition', 'correction', 'source'];
const currentValue = (location, field) => String((field === 'population_override' ? location.population_override ?? location.population : location[field]) ?? '');
const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
const buttonClass = 'min-h-11 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50';

function ContributionForm({ location, item, onSaved, onCancel }) {
  const t = useTranslations('locationImprovements');
  const search = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const field = FIELDS.includes(search.get('field')) ? search.get('field') : 'description';
  const initial = item || { kind: KINDS.includes(search.get('kind')) ? search.get('kind') : 'addition', field, proposedValue: currentValue(location, field), sourceUrl: '', note: '' };
  const [form, setForm] = useState(initial);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // A session-scoped draft survives sign-in redirects without persisting across browser sessions.
  const draftKey = `location-improvement:${location.id}:${item?.id || 'new'}`;
  useEffect(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (draft && FIELDS.includes(draft.field) && KINDS.includes(draft.kind) && ['proposedValue', 'sourceUrl', 'note'].every(key => typeof draft[key] === 'string')) {
        setForm({ ...initial, ...draft });
      }
    } catch { setStorageError(true); }
    setReady(true);
    // The parent remounts this form when the location or selected revision changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);
  const change = patch => {
    const next = { ...form, ...patch };
    setForm(next);
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ kind: next.kind, field: next.field, proposedValue: next.proposedValue, sourceUrl: next.sourceUrl || '', note: next.note || '' }));
    } catch { setStorageError(true); }
  };
  const submit = async event => {
    event.preventDefault();
    if (!user || busy) return;
    setBusy(true); setError('');
    try {
      const payload = { ...form, revision: item?.revision };
      if (item) await api.revise(location.id, item.id, payload);
      else await api.create(location.id, payload);
      try { sessionStorage.removeItem(draftKey); } catch { /* Submission already succeeded. */ }
      onSaved();
    } catch (err) { setError(err.status === 409 ? t('conflict') : t('submitError')); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{t(item ? 'revise' : 'formTitle')}</h2>
      <p className="text-sm text-gray-600">{t('reviewExplanation')}</p>
      <AlertMessage message={error} />
      {storageError && <AlertMessage message={t('storageError')} />}
      <fieldset disabled={busy || !ready} className="space-y-4">
        <div className="text-sm font-medium"><label htmlFor="improvement-kind">{t('kind')}</label><select id="improvement-kind" className={inputClass} value={form.kind} onChange={e => change({ kind: e.target.value })}>{KINDS.map(kind => <option key={kind} value={kind}>{t(`kinds.${kind}`)}</option>)}</select></div>
        <div className="text-sm font-medium"><label htmlFor="improvement-field">{t('field')}</label><select id="improvement-field" className={inputClass} value={form.field} onChange={e => change({ field: e.target.value, proposedValue: currentValue(location, e.target.value) })}>{FIELDS.map(key => <option key={key} value={key}>{t(`fields.${key}`)}</option>)}</select></div>
        <div className="rounded-lg bg-gray-50 p-3 text-sm"><p className="font-semibold">{t('current')}</p><p className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words text-gray-600">{currentValue(location, form.field) || t('empty')}</p></div>
        <div className="text-sm font-medium"><label htmlFor="improvement-proposed">{t('proposed')}</label>
          {form.field === 'description' ? <textarea id="improvement-proposed" className={inputClass} rows={6} required maxLength={5000} value={form.proposedValue} onChange={e => change({ proposedValue: e.target.value })} /> : <input id="improvement-proposed" className={inputClass} type={form.field === 'population_override' ? 'number' : form.field === 'wikipedia_url' ? 'url' : 'text'} min={0} max={2147483647} step={1} required maxLength={form.field === 'name_local' ? 255 : 500} value={form.proposedValue} onChange={e => change({ proposedValue: e.target.value })} />}
        </div>
        <div className="text-sm font-medium"><label htmlFor="improvement-source">{t(form.kind === 'source' ? 'sourceRequired' : 'source')}</label><input id="improvement-source" className={inputClass} type="url" pattern="https://.*" placeholder="https://" maxLength={2048} required={form.kind === 'source'} value={form.sourceUrl || ''} onChange={e => change({ sourceUrl: e.target.value })} /></div>
        <div className="text-sm font-medium"><label htmlFor="improvement-note">{t('note')}</label><textarea id="improvement-note" className={inputClass} rows={2} maxLength={2000} value={form.note || ''} onChange={e => change({ note: e.target.value })} /></div>
      </fieldset>
      <p className="text-xs leading-5 text-gray-500">{t('creditNotice')}</p>
      {user ? <button className={buttonClass} disabled={busy || !ready} type="submit">{t(busy ? 'saving' : 'submit')}</button> : !authLoading && <LoginLink redirectTo={`/locations/${location.slug || location.id}/improve`} className={`${buttonClass} inline-flex items-center`}>{t('signIn')}</LoginLink>}
      {onCancel && <button type="button" onClick={onCancel} className="ml-4 min-h-11 text-sm text-gray-600">{t('cancel')}</button>}
    </form>
  );
}

function ReviewActions({ item, locationId, onReviewed }) {
  const t = useTranslations('locationImprovements');
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const review = async status => {
    if (busy) return;
    if (status !== 'accepted' && !reviewNote.trim()) { setError(t('reasonRequired')); return; }
    setBusy(true); setError('');
    try {
      await api.review(locationId, item.id, { status, reviewNote, revision: item.revision });
      onReviewed(status);
    } catch (err) { setError(err.status === 409 ? t('conflict') : t('reviewError')); }
    finally { setBusy(false); }
  };
  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <AlertMessage message={error} />
      <div className="text-sm font-medium"><label htmlFor={`review-note-${item.id}`}>{t('reviewNote')}</label><textarea id={`review-note-${item.id}`} className={inputClass} maxLength={2000} rows={2} value={reviewNote} onChange={e => setReviewNote(e.target.value)} disabled={busy} /></div>
      <div className="flex flex-wrap gap-3">
        <button className={buttonClass} disabled={busy} onClick={() => review('accepted')}>{t('accept')}</button>
        <button className="min-h-11 rounded-lg border px-3 text-sm disabled:opacity-50" disabled={busy} onClick={() => review('needs_clarification')}>{t('clarify')}</button>
        <button className="min-h-11 px-3 text-sm text-red-700 disabled:opacity-50" disabled={busy} onClick={() => review('declined')}>{t('decline')}</button>
      </div>
    </div>
  );
}

function ContributionList({ location, view, onRevise, onPublished, refresh }) {
  const t = useTranslations('locationImprovements');
  const locale = useLocale();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState('');
  const { data, loading, error, refetch } = useAsyncData(() => api.list(location.id, view, page), [location.id, view, page, user?.id, refresh]);
  if (loading) return <SkeletonLoader type="card" count={2} />;
  if (error) return <div><AlertMessage message={t('loadError')} /><button className="mt-3 text-blue-700" onClick={refetch}>{t('retry')}</button></div>;
  return (
    <div className="space-y-4">
      <AlertMessage tone="success" message={notice} />
      {!data?.data?.length && <p className="rounded-xl border border-dashed p-6 text-sm text-gray-600">{t(`emptyViews.${view}`)}</p>}
      {data?.data?.map(item => <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{t(`fields.${item.field}`)}</h3><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">{t(`statuses.${item.status}`)}</span></div>
        <p className="mt-2 text-xs text-gray-500">{item.author?.username || t('deletedUser')} · {new Date(view === 'history' ? item.reviewedAt : item.createdAt).toLocaleDateString(locale)}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-3"><h4 className="text-xs font-semibold text-gray-500">{t('before')}</h4><p className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words text-sm">{item.originalValue || t('empty')}</p></div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3"><h4 className="text-xs font-semibold text-blue-700">{t(item.status === 'accepted' ? 'published' : 'proposed')}</h4><p className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words text-sm">{item.proposedValue}</p></div>
        </div>
        {view === 'review' && currentValue(location, item.field) !== item.originalValue && <AlertMessage className="mt-3" message={t('conflict')} />}
        {item.sourceUrl && <a className="mt-3 inline-block break-all text-sm text-blue-700 underline" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{t('viewSource')}</a>}
        {item.note && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-600">{item.note}</p>}
        {item.reviewNote && <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-amber-50 p-3 text-sm">{t('feedback')}: {item.reviewNote}</p>}
        {view === 'review' && item.status === 'pending' && <ReviewActions item={item} locationId={location.id} onReviewed={status => { setNotice(t('reviewSaved')); refetch(); if (status === 'accepted') onPublished(); }} />}
        {view === 'mine' && item.status === 'needs_clarification' && <button className={`${buttonClass} mt-3`} onClick={() => onRevise(item)}>{t('revise')}</button>}
      </article>)}
      {data?.pagination?.totalPages > 1 && <nav className="flex items-center justify-between" aria-label={t('pagination')}><button className="min-h-11 text-blue-700 disabled:text-gray-400" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('previous')}</button><span className="text-sm">{page} / {data.pagination.totalPages}</span><button className="min-h-11 text-blue-700 disabled:text-gray-400" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>{t('next')}</button></nav>}
    </div>
  );
}

export default function LocationImprovements({ location, onPublished }) {
  const t = useTranslations('locationImprovements');
  const search = useSearchParams();
  const { user } = useAuth();
  const [view, setView] = useState(search.get('view') === 'history' ? 'history' : 'contribute');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const { data: permissions } = useAsyncData(() => api.list(location.id, 'history'), [location.id, user?.id, user?.role]);
  const activeView = !user && ['mine', 'review'].includes(view) ? 'contribute' : view;
  const changeView = next => { setView(next); setEditing(null); setNotice(''); };
  return (
    <div className="space-y-6">
      <Link className="text-sm text-blue-700 hover:underline" href={`/locations/${location.slug || location.id}`}>← {location.name_local || location.name}</Link>
      <div><h1 className="mt-4 text-2xl font-bold text-gray-950">{t('improve')}</h1><p className="mt-2 max-w-2xl text-gray-600">{t('invitation')}</p></div>
      <nav className="flex flex-wrap gap-2 border-b pb-3" aria-label={t('navigation')}>
        {['contribute', 'history', ...(user ? ['mine'] : []), ...(permissions?.canReview ? ['review'] : [])].map(key => <button key={key} onClick={() => changeView(key)} aria-current={activeView === key ? 'page' : undefined} className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold ${activeView === key ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{t(key)}</button>)}
      </nav>
      <AlertMessage tone="success" message={notice} />
      {activeView === 'contribute' ? <ContributionForm key={editing?.id || 'new'} location={location} item={editing} onCancel={editing ? () => changeView('mine') : undefined} onSaved={() => { setEditing(null); setView('mine'); setRefresh(n => n + 1); setNotice(t('submitted')); }} /> : <ContributionList key={`${activeView}:${user?.id || 'guest'}`} location={location} view={activeView} refresh={refresh} onPublished={onPublished} onRevise={item => { setEditing(item); setView('contribute'); setNotice(''); }} />}
    </div>
  );
}
