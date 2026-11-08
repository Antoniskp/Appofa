'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { HandThumbUpIcon, HandThumbDownIcon, ArrowTopRightOnSquareIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { positionAPI } from '@/lib/api/positions';
import { useAuth } from '@/lib/auth-context';
import PolicyExplanation from './PolicyExplanation';
import LoginLink from '@/components/ui/LoginLink';
import OrgAvatar from '@/components/organization/OrgAvatar';

const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const buttonClass = 'rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50';
const primaryClass = 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50';
const blankSource = () => ({ provider: 'website', sourceUrl: '', originalSourceUrl: '', sourcePublishedAt: '' });
const blankForm = () => ({ title: '', body: '', explanation: '', attribution: 'sourced', categoryId: '', topicIds: [], sources: [blankSource()] });

function publisherGroups(organizations) {
  const groups = { foundations: [], political_parties: [], other_publishers: [] };
  for (const org of organizations) {
    if (org.slug === 'organization' && org.type === 'institution') groups.foundations.push(org);
    else if (org.type === 'party') groups.political_parties.push(org);
    else groups.other_publishers.push(org);
  }
  return Object.entries(groups).filter(([, members]) => members.length);
}

function PublisherGroups({ organizations, t, children }) {
  return publisherGroups(organizations).map(([key, members]) => (
    <fieldset key={key} className="mt-3 min-w-0">
      <legend className="text-xs font-semibold text-gray-600">{t(key)}</legend>
      <div className="flex flex-wrap gap-2 py-1">{members.map(children)}</div>
    </fieldset>
  ));
}

function publisherName(org, t) {
  return org.type === 'institution' && org.slug === 'organization' ? t('foundation_name', { name: org.name }) : org.name;
}

function applyVote(result, revisionId, vote) {
  return result && { ...result, positions: result.positions.map(row =>
    row.id === revisionId ? { ...row, support: vote.support, oppose: vote.oppose, unsure: vote.unsure, myVote: vote.value } : row
  ) };
}

// Replace only the voted row; fetching the ranked page here would move cards.
async function updateVote(setResult, revisionId, value) {
  const { data } = await positionAPI.vote(revisionId, value);
  setResult(previous => applyVote(previous, revisionId, data));
  return data;
}

function SourceLinks({ sources, t, formatDate }) {
  return <div className="space-y-2 text-xs text-gray-600">
    {sources.map((source, index) => <div key={source.id || index} className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline">
        {source.provider} <ArrowTopRightOnSquareIcon className="h-3 w-3" />
      </a>
      {source.originalSourceUrl && <a href={source.originalSourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">{t('original_source')}</a>}
      <span>{source.sourcePublishedAt ? t('source_date', { date: formatDate(source.sourcePublishedAt) }) : t('unknown_date')}</span>
    </div>)}
  </div>;
}

function PositionEditor({ editing, metadata, onSave, onCancel, busy, t, categoryName }) {
  const [form, setForm] = useState(() => editing.row ? {
    title: editing.row.title, body: editing.row.body, explanation: editing.row.explanation || '', attribution: editing.row.attribution,
    categoryId: String(editing.row.position.categoryId),
    topicIds: editing.row.position.topics.map(topic => topic.id),
    sources: editing.row.sources.map(source => ({ ...source, sourcePublishedAt: source.sourcePublishedAt?.slice(0, 10) || '' })),
  } : blankForm());
  const set = (field, value) => setForm(previous => ({ ...previous, [field]: value }));
  const setSource = (index, field, value) => set('sources', form.sources.map((source, sourceIndex) => sourceIndex === index ? { ...source, [field]: value } : source));
  return <form onSubmit={event => { event.preventDefault(); onSave(form); }} className="space-y-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4 sm:p-6">
    <div className="flex items-start justify-between gap-4"><h3 className="text-lg font-semibold">{t(editing.mode === 'revise' ? 'new_version' : editing.mode === 'edit' ? 'edit_draft' : 'add_position')}</h3><button type="button" onClick={onCancel} disabled={busy} className={buttonClass}>{t('cancel')}</button></div>
    <p className="text-sm text-gray-600">{t('editor_hint')}</p>
    <label className="block text-sm font-medium">{t('title_label')}<input required minLength={5} maxLength={200} className={inputClass + ' mt-1'} value={form.title} onChange={event => set('title', event.target.value)} /></label>
    <label className="block text-sm font-medium">{t('body_label')}<textarea required maxLength={20000} rows={5} className={inputClass + ' mt-1'} value={form.body} onChange={event => set('body', event.target.value)} /></label>
    <label className="block text-sm font-medium">{t('explanation_label')}<textarea maxLength={2000} rows={3} className={inputClass} value={form.explanation} onChange={event => set('explanation', event.target.value)} /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">{t('category')}<select required disabled={!!editing.row} className={inputClass + ' mt-1'} value={form.categoryId} onChange={event => set('categoryId', event.target.value)}><option value="">{t('choose_category')}</option>{metadata.categories.map(category => <option key={category.id} value={category.id}>{categoryName(category)}</option>)}</select></label>
      <label className="block text-sm font-medium">{t('attribution')}<select className={inputClass + ' mt-1'} value={form.attribution} onChange={event => set('attribution', event.target.value)}><option value="sourced">{t('sourced')}</option><option value="community">{t('community')}</option>{(metadata.canPublishOfficial || form.attribution === 'official') && <option value="official" disabled={!metadata.canPublishOfficial}>{t('official')}</option>}</select></label>
    </div>
    {!editing.row && <fieldset><legend className="mb-2 text-sm font-medium">{t('topics')}</legend><div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-lg border bg-white p-3">
      {metadata.topics.length ? metadata.topics.map(topic => <label key={topic.id} className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-sm"><input type="checkbox" checked={form.topicIds.includes(topic.id)} onChange={event => set('topicIds', event.target.checked ? [...form.topicIds, topic.id] : form.topicIds.filter(value => value !== topic.id))} />{topic.name}</label>) : <p className="text-sm text-gray-500">{t('no_topics')}</p>}
    </div></fieldset>}
    <fieldset className="space-y-3"><legend className="mb-2 text-sm font-semibold">{t('sources')}</legend>
      {form.sources.map((source, index) => <div key={index} className="space-y-3 rounded-lg border bg-white p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">{t('provider')}<input required maxLength={80} className={inputClass} value={source.provider} onChange={event => setSource(index, 'provider', event.target.value)} placeholder="Vouliwatch" /></label>
          <label className="text-sm">{t('publication_date')}<input type="date" className={inputClass} value={source.sourcePublishedAt} onChange={event => setSource(index, 'sourcePublishedAt', event.target.value)} /></label>
          <label className="text-sm">{t('source_url')}<input required type="url" maxLength={2048} className={inputClass} value={source.sourceUrl} onChange={event => setSource(index, 'sourceUrl', event.target.value)} placeholder="https://" /></label>
          <label className="text-sm">{t('original_url')}<input type="url" maxLength={2048} className={inputClass} value={source.originalSourceUrl || ''} onChange={event => setSource(index, 'originalSourceUrl', event.target.value)} placeholder="https://" /></label>
        </div>
        <button type="button" className="text-sm text-red-700 hover:underline" onClick={() => set('sources', form.sources.filter((_, sourceIndex) => sourceIndex !== index))}>{t('remove_source')}</button>
      </div>)}
      <button type="button" disabled={form.sources.length >= 10} className={buttonClass} onClick={() => set('sources', [...form.sources, blankSource()])}>{t('add_source')}</button>
    </fieldset>
    <button type="submit" disabled={busy} className={primaryClass}>{busy ? t('saving') : t('save_draft')}</button>
  </form>;
}

export function PositionCard({ detail = false, row, manage, metadata, user, busy, onVote, onEdit, onAction, t, categoryName, formatDate }) {
  const [voting, setVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState('');
  const [voteError, setVoteError] = useState('');
  const vote = async value => {
    if (voting) return;
    setVoting(true); setVoteError(''); setVoteMessage('');
    try { await onVote(row.id, value); setVoteMessage(t(value === 0 ? 'vote_removed' : 'vote_saved')); }
    catch (error) { setVoteError(error.message); }
    finally { setVoting(false); }
  };
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [checked, setChecked] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const total = row.support + row.oppose + (row.unsure || 0);
  const expanded = detail || manage;
  const approval = total ? Math.round(row.support / total * 100) : null;
  const editable = ['draft', 'in_review', 'rejected'].includes(row.status);
  const officialAllowed = row.attribution !== 'official' || metadata.canPublishOfficial;
  const toggleHistory = async () => {
    if (history) { setHistory(null); return; }
    setHistoryLoading(true); setHistoryError('');
    try { setHistory((await positionAPI.history(row.positionId)).data); }
    catch (error) { setHistoryError(error.message); }
    finally { setHistoryLoading(false); }
  };
  return <article className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="mb-3 flex flex-wrap gap-2 text-xs font-medium">
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">{categoryName(row.position.category)}</span>
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{t(row.attribution)}</span>
      {manage && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">{t(row.status)} · v{row.version}</span>}
      {row.position.status !== 'active' && <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">{t(row.position.status)}</span>}
    </div>
    <Link href={'/organizations/' + row.position.organization.slug + '?tab=tab_positions'} className="mb-3 flex items-center gap-3 text-sm font-semibold text-gray-700 hover:text-blue-700 hover:underline" aria-label={publisherName(row.position.organization, t)}><span aria-hidden="true"><OrgAvatar org={row.position.organization} size="h-12 w-16" /></span><span>{publisherName(row.position.organization, t)}</span></Link>
    {detail ? <h1 className="text-2xl font-bold">{row.title}</h1> : <h3 className="text-lg font-semibold leading-snug">{row.status === 'published' && row.position.status === 'active' ? <Link className="text-blue-800 underline decoration-blue-200 underline-offset-4 hover:decoration-current" href={`/positions/${row.positionId}`}>{row.title}</Link> : row.title}</h3>}

    <p className={`mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 ${expanded ? '' : 'line-clamp-3'}`}>{row.body}</p>
    {row.position.topics.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{row.position.topics.map(topic => <Link href={'/topics/' + topic.slug} key={topic.id} className="text-xs text-blue-700 hover:underline">#{topic.name}</Link>)}</div>}
    {expanded && <div className="mt-4 border-t border-gray-100 pt-3"><SourceLinks sources={row.sources} t={t} formatDate={formatDate} /></div>}
    <div className="mt-auto pt-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm"><strong>{approval === null ? t('no_votes') : total < 10 ? t('vote_totals', { support: row.support, oppose: row.oppose }) : t('approval_percent', { percent: approval })}</strong><span className="text-gray-500">{t('vote_count', { count: total })}</span></div>
      {row.unsure > 0 && <p className="mb-2 text-xs text-gray-600">{t('view_unsure')} · {Math.round(row.unsure / total * 100)}%</p>}
      {expanded && total > 0 && total < 10 && <p className="mb-3 text-xs text-gray-500">{t("low_participation")}</p>}
      {total >= 10 && <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-gray-100" aria-hidden="true"><div className="h-full bg-emerald-500" style={{ width: (approval || 0) + '%' }} /></div>}
      {row.status === 'published' && row.position.status === 'active' && <div className="flex flex-wrap gap-2">
        {[1, -1, 2].map(value => {
          const Icon = value === 2 ? null : value === 1 ? HandThumbUpIcon : HandThumbDownIcon;
          const selected = row.myVote === value;
          return <button key={value} type="button" disabled={busy || voting || !user} aria-pressed={selected}
            onClick={() => vote(selected ? 0 : value)}
            className={buttonClass + ' inline-flex min-h-11 flex-1 justify-center items-center gap-2 ' + (selected ? 'ring-2 ring-blue-500 bg-blue-50 text-blue-800' : '')}>
            {Icon && <Icon className="h-4 w-4" />}{t(value === 1 ? 'support' : value === 2 ? 'view_unsure' : 'oppose')}
            <span>{value === 1 ? row.support : value === 2 ? row.unsure || 0 : row.oppose}</span>
            {selected && <span aria-hidden="true">&#10003;</span>}
          </button>;
        })}
      </div>}
      {row.status === 'published' && <PolicyExplanation policy={row} />}
      {!user && row.status === 'published' && <LoginLink className="mt-2 block text-sm text-blue-700 hover:underline">{t('sign_in')}</LoginLink>}
      {user && row.status === 'published' && <div className="text-xs">{expanded && <p className="mt-2 text-gray-500">{t('vote_private')}</p>}<p role="status" className="text-emerald-700 empty:hidden">{voting ? t('saving') : voteMessage}</p>{voteError && <p role="alert" className="mt-1 text-red-700">{voteError}</p>}</div>}
      {expanded && <details className="mt-4"><summary className="cursor-pointer text-xs font-medium text-gray-600">{t("details")}</summary>
      <p className="mt-2 text-xs text-gray-500">{t('source_context')}</p>
      {row.publishedAt && <p className="mt-2 text-xs text-gray-500">{t("published_date", { date: formatDate(row.publishedAt) })}</p>}
      <button type="button" disabled={historyLoading} onClick={toggleHistory} className="mt-4 text-xs font-medium text-gray-600 hover:underline">{historyLoading ? t('loading') : history ? t('hide_history') : t('history')}</button>
      {historyError && <p role="alert" className="mt-2 text-sm text-red-700">{historyError}</p>}
      {history && <div className="mt-3 space-y-4 rounded-lg bg-gray-50 p-3">{history.length ? history.map(version => <div key={version.id} className="border-b border-gray-200 pb-3 last:border-0"><p className="text-xs font-semibold text-gray-500">v{version.version} · {t(version.status)}</p><h4 className="mt-1 text-sm font-semibold">{version.title}</h4><p className="my-2 whitespace-pre-wrap text-sm text-gray-600">{version.body}</p><SourceLinks sources={version.sources} t={t} formatDate={formatDate} /><p className="mt-2 text-xs">{t('support')}: {version.support} · {t('oppose')}: {version.oppose} · {t('view_unsure')}: {version.unsure || 0}</p></div>) : <p className="text-sm text-gray-500">{t('no_history')}</p>}</div>}
      </details>}
      {manage && <div className="mt-4 space-y-3 border-t pt-4">
        {row.reviewNote && <p className="text-sm text-amber-800">{row.reviewNote}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy || !officialAllowed} className={buttonClass} onClick={() => onEdit({ row, mode: editable ? 'edit' : 'revise' })}>{t(editable ? 'edit_draft' : 'new_version')}</button>
          {editable && <button type="button" disabled={busy || !officialAllowed} className={buttonClass} onClick={() => setReviewing(!reviewing)}>{t('review')}</button>}
          <button type="button" disabled={busy} className={buttonClass} onClick={() => onAction(() => positionAPI.status(row.positionId, row.position.status === 'active' ? 'withdrawn' : 'active'))}>{t(row.position.status === 'active' ? 'withdraw' : 'reactivate')}</button>
        </div>
        {reviewing && <div className="space-y-3 rounded-lg bg-amber-50 p-3">
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={checked} onChange={event => setChecked(event.target.checked)} />{t('review_confirm')}</label>
          <button type="button" disabled={busy || !checked || row.position.status !== 'active'} className={primaryClass} onClick={() => onAction(() => positionAPI.publish(row.id))}>{t('publish')}</button>
          <label className="block text-sm">{t('rejection_note')}<textarea maxLength={2000} className={inputClass + ' mt-1'} value={reviewNote} onChange={event => setReviewNote(event.target.value)} /></label>
          <button type="button" disabled={busy || !reviewNote.trim()} className={buttonClass} onClick={() => onAction(() => positionAPI.reject(row.id, reviewNote))}>{t('reject')}</button>
        </div>}
      </div>}
    </div>
  </article>;
}

function PositionPagination({ page, pages, loading, onChange, t }) {
  if (!(pages > 1)) return null;
  return <nav className="flex flex-wrap items-center justify-center gap-3" aria-label={t('pagination')}>
    <button type="button" className={buttonClass} disabled={page === 1 || loading} onClick={() => onChange(page - 1)}>{t('previous')}</button>
    <span className="text-sm">{t('page_count', { page, pages })}</span>
    <button type="button" className={buttonClass} disabled={page >= pages || loading} onClick={() => onChange(page + 1)}>{t('next')}</button>
  </nav>;
}

function ComparisonColumn({ organization, filters, cardProps, refresh }) {
  const { t, user } = cardProps;
  const { categoryId, topicId, search, sort, seed } = filters;
  const [page, setPage] = useState(1);
  const resultsTop = useRef(null);
  function changePage(nextPage) {
    setPage(nextPage);
    resultsTop.current?.scrollIntoView({ block: 'start' });
  }
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    positionAPI.list({ categoryId, topicId, search, sort, seed, organizationId: organization.id, page }).then(response => { if (!cancelled) setResult(response.data); }).catch(err => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [organization.id, categoryId, topicId, search, sort, seed, page, user?.id, retry, refresh]);
  return <section ref={resultsTop} className="min-w-0 scroll-mt-24 space-y-3" aria-label={organization.name} aria-busy={loading}>
    <h2 className="border-b pb-2 text-lg font-semibold">{publisherName(organization, t)}</h2>
    {error ? <p role="alert" className="text-sm text-red-700">{error} <button className="underline" onClick={() => setRetry(value => value + 1)}>{t('retry')}</button></p> : !result ? <p role="status">{t('loading')}</p> : <>
      <p className="text-xs text-gray-600">{t('result_count', { count: result.pagination.total })}</p>
      <PositionPagination page={page} pages={result.pagination.pages} loading={loading} onChange={changePage} t={t} />
      {result.positions.length ? result.positions.map(row => <PositionCard key={row.id} row={row} manage={false} {...cardProps} onVote={async (revisionId, value) => {
        const vote = await cardProps.onVote(revisionId, value);
        setResult(previous => applyVote(previous, revisionId, vote));
      }} />) : <p className="rounded-xl border border-dashed p-5 text-sm text-gray-600">{t(filters.search ? 'empty_public' : 'no_recorded_position')}</p>}
      <PositionPagination page={page} pages={result.pagination.pages} loading={loading} onChange={changePage} t={t} />
    </>}
  </section>;
}

export default function PositionsPanel({ organizationId, topicId, onChange, standalone = false }) {
  const Heading = standalone ? 'h1' : 'h2';
  const t = useTranslations('positions');
  const locale = useLocale();
  const { user } = useAuth();
  const [metadata, setMetadata] = useState({ categories: [], topics: [], organizations: [] });
  const [result, setResult] = useState({ positions: [], pagination: {} });
  const [filters, setFilters] = useState(() => ({ categoryId: '', organizationId: '', sort: standalone ? 'shuffle' : 'top', seed: Math.floor(Math.random() * 2147483646) + 1, search: '' }));
  const [search, setSearch] = useState('');
  const [voteView, setVoteView] = useState('unanswered');
  const answerViewId = useId();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [comparison, setComparison] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [manage, setManage] = useState(false);
  const personalView = standalone && user && !manage ? voteView : undefined;
  const [page, setPage] = useState(1);
  const resultsTop = useRef(null);
  function changePage(nextPage) {
    setPage(nextPage);
    resultsTop.current?.scrollIntoView({ block: 'start' });
  }
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const categoryName = category => t.has('categories.' + category.slug) ? t('categories.' + category.slug) : category.name;
  const formatDate = value => new Date(value).toLocaleDateString(locale);
  useEffect(() => {
    let cancelled = false;
    positionAPI.metadata(organizationId ? { organizationId } : {}).then(response => { if (!cancelled) setMetadata(response.data); }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [organizationId, user?.id]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    positionAPI.list({ ...filters, voteView: personalView, organizationId: organizationId || filters.organizationId, topicId, manage: manage ? 'true' : undefined, page }).then(response => { if (!cancelled) setResult(response.data); }).catch(err => { if (!cancelled) { setError(err.message); setResult({ positions: [], pagination: {} }); } }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [organizationId, topicId, filters, personalView, manage, page, refresh, user?.id]);
  useEffect(() => {
    const timer = setTimeout(() => { setFilters(previous => previous.search === search.trim() ? previous : { ...previous, search: search.trim() }); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const vote = async (revisionId, value) => {
    const data = await updateVote(setResult, revisionId, value);
    if (personalView && personalView !== 'all') {
      if (result.positions.length === 1 && page > 1) setPage(page - 1);
      setNotice(t(value === 0 ? 'vote_removed' : 'vote_saved'));
      setRefresh(previous => previous + 1);
    }
    onChange?.();
    return data;
  };
  const filter = (key, value) => { setFilters(previous => ({ ...previous, [key]: value })); setPage(1); setFiltersOpen(false); };
  const hasFilters = filters.categoryId || filters.organizationId || filters.search;
  const activeFilterCount = Number(Boolean(filters.categoryId)) + Number(Boolean(filters.organizationId)) + Number(Boolean(filters.search));
  const showReviewAnswers = personalView === 'unanswered' && !hasFilters && result.allAnswered;
  const clearFilters = () => {
    setSearch('');
    setFilters(previous => ({ ...previous, categoryId: '', organizationId: '', search: '' }));
    setPage(1);
    setNotice('');
  };
  const action = async operation => {
    setBusy(true); setError(''); setNotice('');
    try { await operation(); onChange?.(); setRefresh(value => value + 1); setNotice(t('saved')); return true; }
    catch (err) { setError(err.message); return false; }
    finally { setBusy(false); }
  };
  const save = async form => {
    const succeeded = await action(() => editing.mode === 'edit' ? positionAPI.save(editing.row.id, form) : editing.mode === 'revise' ? positionAPI.revise(editing.row.positionId, form) : positionAPI.create(organizationId, form));
    if (succeeded) { setEditing(null); setManage(true); setPage(1); }
  };
  if (topicId && !result.positions.length && !hasFilters && !error && !manage && !comparison && page === 1) return null;
  return <section className={topicId ? 'mb-10 space-y-5' : 'space-y-5'} aria-label={t('heading')}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><Heading className={standalone ? 'text-3xl font-bold text-gray-900' : 'text-2xl font-bold text-gray-900'}>{t('heading')}</Heading><p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{t('description')}</p></div>
      <div className="flex flex-wrap gap-2">{!standalone && <Link href="/positions" className={buttonClass}>{t('compare_all')}</Link>}{metadata.canManage && <><button type="button" className={buttonClass} onClick={() => { setManage(!manage); setPage(1); setEditing(null); }}>{t(manage ? 'public_view' : 'manage')}</button><button type="button" className={primaryClass + ' inline-flex items-center gap-1'} onClick={() => setEditing({ mode: 'create' })}><PlusIcon className="h-4 w-4" />{t('add_position')}</button></>}</div>
    </div>
    <p className="text-xs leading-relaxed text-gray-600">{t("participation_short")}</p>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}<button type="button" className="ml-3 underline" onClick={() => setRefresh(value => value + 1)}>{t('retry')}</button></div>}
    {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
    {editing && <PositionEditor key={editing.mode + (editing.row?.id || '')} editing={editing} metadata={metadata} onSave={save} onCancel={() => setEditing(null)} busy={busy} t={t} categoryName={categoryName} />}
    <div className="flex gap-2">
      <label className="min-w-0 flex-1"><span className="sr-only">{t('search')}</span><input type="search" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} placeholder={t('search')} className={inputClass} /></label>
      {standalone && !manage && <button type="button" aria-pressed={comparison} className={buttonClass} onClick={() => { if (comparison && personalView && personalView !== 'all') setRefresh(previous => previous + 1); setComparison(!comparison); }}>{t(comparison ? 'list_view' : 'compare')}</button>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      {personalView && !comparison && <fieldset aria-describedby={answerViewId + '-hint'} className="min-w-0">
        <legend className="mb-2 text-sm font-semibold text-gray-700">{t('my_answers')}</legend>
        <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
          {['unanswered', 'agree', 'disagree', 'unsure', 'all'].map(view => <label key={view} className="relative flex min-w-0 cursor-pointer">
            <input type="radio" name={answerViewId} value={view} checked={view === voteView} className="peer sr-only" onChange={() => { setVoteView(view); setPage(1); setNotice(''); }} />
            <span className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-white peer-checked:bg-white peer-checked:text-blue-800 peer-checked:shadow-sm peer-checked:ring-1 peer-checked:ring-blue-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600">{t('view_' + view)}</span>
          </label>)}
        </div>
        <p id={answerViewId + '-hint'} className="mt-2 max-w-2xl text-xs leading-relaxed text-gray-600">{t('answer_view_hint')}</p>
      </fieldset>}
      <label className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium text-gray-600 sm:ml-auto">
        {t('sort')}
        <select disabled={manage} className={inputClass + ' !w-auto max-w-full'} value={manage ? 'newest' : filters.sort} onChange={event => filter('sort', event.target.value)}>{[...(standalone ? ['shuffle'] : []), 'top', 'support', 'approval', 'divisive', 'newest'].map(sort => <option key={sort} value={sort}>{t('sort_' + sort)}</option>)}</select>
      </label>
    </div>
    {standalone && !manage && <button type="button" aria-expanded={filtersOpen} aria-controls="position-filter-options" onClick={() => setFiltersOpen(open => !open)} className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-800 shadow-sm md:hidden">
      <span>{t(filtersOpen ? 'hide_filters' : 'show_filters')}</span>
      <span className="flex items-center gap-2 text-xs font-medium text-gray-600">{activeFilterCount > 0 && <span>{t('active_filter_count', { count: activeFilterCount })}</span>}<span aria-hidden="true">{filtersOpen ? '−' : '+'}</span></span>
    </button>}
    <div id="position-filter-options" className={`min-w-0 space-y-4 ${standalone && !manage && !filtersOpen ? 'hidden md:block' : ''}`} role="group" aria-label={t('filters')}>
      {!organizationId && !comparison && <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold text-gray-700">{t('party_filter')}</legend>
        <div>
          <button type="button" aria-pressed={!filters.organizationId} className={buttonClass + ' shrink-0 ' + (!filters.organizationId ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-500' : 'bg-white')} onClick={() => filter('organizationId', '')}>{t('all_entities')}</button>
          <div className="mt-1 max-h-56 overflow-y-auto overscroll-contain pr-1">
          <PublisherGroups organizations={metadata.organizations} t={t}>{org => <button key={org.id} type="button" aria-pressed={String(org.id) === filters.organizationId} className={buttonClass + ' inline-flex shrink-0 items-center gap-2 ' + (String(org.id) === filters.organizationId ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-500' : 'bg-white')} onClick={() => filter('organizationId', String(org.id))}>
            <span aria-hidden="true"><OrgAvatar org={org} size="h-8 w-10" /></span>
            <span>{org.name}</span>
          </button>}</PublisherGroups>
          </div>
        </div>
      </fieldset>}
      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-semibold text-gray-700">{t('category')}</legend>
        <div className="flex gap-2 overflow-x-auto px-1 py-1">
          <button type="button" aria-pressed={!filters.categoryId} className={buttonClass + ' shrink-0 ' + (!filters.categoryId ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-500' : 'bg-white')} onClick={() => filter('categoryId', '')}>{t('all_categories')}</button>
          {metadata.categories.map(category => <button key={category.id} type="button" aria-pressed={String(category.id) === filters.categoryId} className={buttonClass + ' shrink-0 ' + (String(category.id) === filters.categoryId ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-500' : 'bg-white')} onClick={() => filter('categoryId', String(category.id))}>{categoryName(category)}</button>)}
        </div>
      </fieldset>
      {!manage && <p className="text-xs leading-relaxed text-gray-500">{t('ranking_note')}</p>}
    </div>
    <div ref={resultsTop} className="scroll-mt-24 flex flex-wrap items-center gap-2" aria-live="polite">
      {!comparison && !loading && !error && <span className="text-sm text-gray-600">{t('result_count', { count: result.pagination.total || 0 })}</span>}
      {['categoryId', 'organizationId', 'search'].filter(key => filters[key] && !(comparison && key === 'organizationId')).map(key => {
        const item = (key === 'categoryId' ? metadata.categories : metadata.organizations).find(item => String(item.id) === filters[key]);
        const label = key === 'search' ? filters.search : item ? key === 'categoryId' ? categoryName(item) : item.name : filters[key];
        return <button type="button" key={key} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-800" aria-label={t('remove_filter', { name: label })} onClick={() => { filter(key, ''); if (key === 'search') setSearch(''); }}>{label} <XMarkIcon aria-hidden="true" className="inline h-3 w-3" /></button>;
      })}
      {hasFilters && <button type="button" className="ml-auto text-sm font-medium text-blue-700 hover:underline" onClick={clearFilters}>{t('clear_position_filters')}</button>}
    </div>
    {comparison && !manage && <>
      <fieldset className="rounded-xl border p-3"><legend className="px-1 text-sm font-medium">{t('compare_choose')}</legend>
        <p className="mb-2 text-xs text-gray-600">{t('compare_hint')}</p>
        <PublisherGroups organizations={metadata.organizations} t={t}>{org => <label key={org.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedOrganizations.includes(org.id)} disabled={selectedOrganizations.length >= 3 && !selectedOrganizations.includes(org.id)} onChange={event => setSelectedOrganizations(previous => event.target.checked ? [...previous, org.id] : previous.filter(id => id !== org.id))} />{org.name}</label>}</PublisherGroups>
      </fieldset>
      {!(filters.categoryId || topicId) ? <p className="text-sm text-gray-600">{t('compare_scope')}</p> : <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">{selectedOrganizations.map(id => <ComparisonColumn key={id + JSON.stringify(filters)} refresh={refresh} organization={metadata.organizations.find(org => org.id === id)} filters={{ ...filters, topicId }} cardProps={{ metadata, user, busy, onVote: (revisionId, value) => updateVote(setResult, revisionId, value), onEdit: setEditing, onAction: action, t, categoryName, formatDate }} />)}</div>}
    </>}

    {(!comparison || manage) && <PositionPagination page={page} pages={result.pagination.pages} loading={loading} onChange={changePage} t={t} />}
    {(!comparison || manage) && (loading && !result.positions.length ? <div role="status" className="rounded-xl border border-gray-200 p-10 text-center text-gray-500">{t('loading')}</div> : result.positions.length ? <div className="grid items-start gap-5 lg:grid-cols-2">{result.positions.map(row => <PositionCard key={row.id + ':' + row.status} row={row} manage={manage} metadata={metadata} user={user} busy={busy} onVote={vote} onEdit={setEditing} onAction={action} t={t} categoryName={categoryName} formatDate={formatDate} />)}</div> : !error && <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center"><h3 className="font-semibold text-gray-800">{t(showReviewAnswers ? 'all_answered' : 'empty')}</h3>
      {showReviewAnswers ? <button type="button" className={buttonClass + ' mt-3'} onClick={() => { setVoteView('all'); setPage(1); setNotice(''); }}>{t('review_answers')}</button>
        : <><p className="mt-2 text-sm text-gray-500">{t(manage ? 'empty_manage' : 'empty_public')}</p>
</>}
    </div>)}
    {(!comparison || manage) && <PositionPagination page={page} pages={result.pagination.pages} loading={loading} onChange={changePage} t={t} />}
  </section>;
}
