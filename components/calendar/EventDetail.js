'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { calendarAPI } from '@/lib/api/calendar';
import { useAuth } from '@/lib/auth-context';
import EventForm from './EventForm';
import { eventToICalendar } from '@/lib/calendar/ical';

export default function EventDetail({ id }) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    let active = true;
    setResult(null); setError(''); setEditing(false); setRejecting(false);
    calendarAPI.detail(id).then(r => { if (active) setResult(r); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id, user]);

  async function action(value) {
    setBusy(true); setError('');
    try {
      await calendarAPI.update(id, { action: value, revision: result.data.revision, reviewNote: value === 'reject' ? reviewNote : '' });
      setResult(await calendarAPI.detail(id));
      setRejecting(false); setReviewNote(''); setEditing(false);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function download() {
    const event = result.data;
    const url = URL.createObjectURL(new Blob([eventToICalendar(event)], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = `event-${event.id}.ics`; link.click(); URL.revokeObjectURL(url);
  }
  if (!result) return <main className="p-8"><p role={error ? 'alert' : 'status'}>{error || t('loading')}</p></main>;
  const event = result.data;
  const formatDate = value => new Date(value).toLocaleDateString(locale, { timeZone: 'UTC', dateStyle: 'long' });
  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
    <Link href="/calendar" className="text-blue-700">← {t('back')}</Link>
    <h1 className="break-words text-3xl font-bold">{event.title}</h1>
    <p className="font-semibold">{t(`statuses.${event.status}`)}</p>
    <p>{event.allDay
      ? `${formatDate(event.start)} – ${formatDate(new Date(event.end) - 86400000)} · ${t('allDay')}`
      : `${new Date(event.start).toLocaleString(locale, { timeZone: event.timezone })} – ${new Date(event.end).toLocaleString(locale, { timeZone: event.timezone })} (${event.timezone})`}</p>
    <Link href={`/locations/${event.location.slug}?tab=events`} className="text-blue-700">{event.location.name_local || event.location.name}</Link>
    <p className="whitespace-pre-wrap break-words">{event.description}</p>
    {event.venue && <p>{t('venue')}: {event.venue}</p>}
    {event.organizer && <p>{t('organizer')}: {event.organizer}</p>}
    {event.sourceUrl && <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-700">{t('information')} ↗</a>}
    {event.reviewNote && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="font-semibold">{t('reviewNote')}</h2><p className="whitespace-pre-wrap break-words">{event.reviewNote}</p>
    </div>}
    <div className="flex flex-wrap gap-3">
      {['published', 'cancelled'].includes(event.status) && <button onClick={download} className="rounded border px-4 py-2">{t('export')}</button>}
      {result.canEdit && <button disabled={busy} onClick={() => setEditing(!editing)} className="rounded border px-4 py-2">{t('edit')}</button>}
      {result.canManage && event.status === 'pending' && <>
        <button disabled={busy} onClick={() => action('publish')} className="rounded bg-blue-600 px-4 py-2 text-white">{t('approve')}</button>
        <button disabled={busy} onClick={() => setRejecting(true)} className="rounded border px-4 py-2">{t('reject')}</button>
      </>}
      {result.canEdit && event.status === 'published' && <button disabled={busy} onClick={() => action('cancel')} className="rounded border px-4 py-2 text-red-700">{t('cancel')}</button>}
    </div>
    {rejecting && <form className="space-y-3 rounded border p-4" onSubmit={e => { e.preventDefault(); action('reject'); }}>
      <label className="block">{t('rejectReason')}<textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} required maxLength={2000} rows={3} className="block w-full rounded border p-2" /></label>
      <div className="flex gap-3"><button disabled={busy || !reviewNote.trim()} className="rounded bg-red-700 px-4 py-2 text-white">{t('confirmReject')}</button>
        <button type="button" disabled={busy} onClick={() => setRejecting(false)}>{t('dismiss')}</button></div>
    </form>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {editing && <EventForm event={event} onSaved={async () => { setResult(await calendarAPI.detail(id)); setEditing(false); }} />}
  </main>;
}
