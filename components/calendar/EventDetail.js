'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { calendarAPI } from '@/lib/api/calendar';
import { useAuth } from '@/lib/auth-context';
import EventForm from './EventForm';
import { eventToICalendar } from '@/lib/calendar/ical';

export default function EventDetail({ id }) {
  const { user } = useAuth();
  const [result, setResult] = useState(null), [error, setError] = useState(''), [editing, setEditing] = useState(false), [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; setResult(null); setError(''); setEditing(false); calendarAPI.detail(id).then(r => { if (active) setResult(r); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [id, user]);
  async function action(value) { setBusy(true); setError(''); try { await calendarAPI.update(id, { action: value, revision: result.data.revision }); setResult(await calendarAPI.detail(id)); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  function download() {
    const e = result.data;
    const url = URL.createObjectURL(new Blob([eventToICalendar(e)], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `event-${e.id}.ics`; link.click(); URL.revokeObjectURL(url);
  }
  if (!result) return <main className="p-8"><p role={error ? 'alert' : 'status'}>{error || 'Φόρτωση…'}</p></main>;
  const e = result.data;
  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-8"><Link href="/calendar" className="text-blue-700">← Ημερολόγιο</Link><h1 className="text-3xl font-bold">{e.title}</h1><p className="font-semibold">{({ published: 'Δημοσιευμένη', pending: 'Σε αναμονή έγκρισης', rejected: 'Απορρίφθηκε', cancelled: 'Ακυρώθηκε' })[e.status]}</p>
    <p>{e.allDay ? `${e.start.slice(0, 10)} – ${new Date(new Date(e.end) - 86400000).toISOString().slice(0, 10)} · Ολοήμερη` : `${new Date(e.start).toLocaleString('el-GR', { timeZone: e.timezone })} – ${new Date(e.end).toLocaleString('el-GR', { timeZone: e.timezone })} (${e.timezone})`}</p>
    <Link href={`/locations/${e.location.slug}?tab=events`} className="text-blue-700">{e.location.name_local || e.location.name}</Link><p className="whitespace-pre-wrap">{e.description}</p>{e.venue && <p>Χώρος: {e.venue}</p>}{e.organizer && <p>Διοργανωτής: {e.organizer}</p>}{e.sourceUrl && <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-700">Πληροφορίες / συμμετοχή ↗</a>}
    <div className="flex flex-wrap gap-3">{['published', 'cancelled'].includes(e.status) && <button onClick={download} className="rounded border px-4 py-2">Προσθήκη στο ημερολόγιο (.ics)</button>}{result.canEdit && <button onClick={() => setEditing(!editing)} className="rounded border px-4 py-2">Επεξεργασία</button>}{result.canManage && e.status === 'pending' && <><button disabled={busy} onClick={() => action('publish')} className="rounded bg-blue-600 px-4 py-2 text-white">Έγκριση</button><button disabled={busy} onClick={() => action('reject')} className="rounded border px-4 py-2">Απόρριψη</button></>}{result.canEdit && e.status === 'published' && <button disabled={busy} onClick={() => action('cancel')} className="rounded border px-4 py-2 text-red-700">Ακύρωση εκδήλωσης</button>}</div>
    {error && <p role="alert" className="text-red-700">{error}</p>}{editing && <EventForm event={e} onSaved={async () => { setResult(await calendarAPI.detail(id)); setEditing(false); }} />}
  </main>;
}
