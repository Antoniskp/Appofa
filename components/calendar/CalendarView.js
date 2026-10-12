'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { calendarAPI } from '@/lib/api/calendar';
import { useAuth } from '@/lib/auth-context';
import LocationSelector from '@/components/ui/LocationSelector';
import { localDateTime } from '@/lib/calendar/dates';

export default function CalendarView({ locationId: fixedLocationId }) {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [locationId, setLocationId] = useState('');
  const [descendants, setDescendants] = useState(false);
  const [mode, setMode] = useState('list');
  const [view, setView] = useState('public');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const selectedLocation = fixedLocationId || locationId;
  const [year, number] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, number - 1, 1));
  const end = new Date(Date.UTC(year, number, 1));
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const [y, m] = month.split('-').map(Number);
    calendarAPI.list({ start: new Date(Date.UTC(y, m - 1, 1) - 86400000).toISOString(), end: new Date(Date.UTC(y, m, 2)).toISOString(), view, page, ...(category ? { category } : {}), ...(selectedLocation ? { locationId: selectedLocation, descendants } : {}) })
      .then(data => { if (active) setResult(data); })
      .catch(e => { if (active) { setError(e.message); setResult(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, selectedLocation, descendants, view, page, user, category]);
  const dayKey = (value, entry) => entry.allDay ? String(value).slice(0, 10) : localDateTime(value, entry.timezone).slice(0, 10);
  const days = Array.from({ length: Math.round((end - start) / 86400000) }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  const entries = (result?.data || []).filter(e => dayKey(e.start, e) <= days.at(-1) && dayKey(new Date(new Date(e.end) - 1).toISOString(), e) >= days[0]);
  function shift(delta) { setMonth(new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7)); setPage(1); }
  const entryLink = (entry, compact = false) => (
    <Link key={entry.id} href={entry.href} className={`block rounded-lg border border-blue-100 bg-blue-50 text-sm hover:bg-blue-100 ${compact ? 'p-1.5' : 'p-3'}`}>
      <span className={`font-semibold ${compact ? 'line-clamp-2 text-xs' : ''}`}>{entry.title}</span>
      <span className="block text-xs text-gray-600">
        {entry.allDay ? 'Ολοήμερη' : new Date(entry.start).toLocaleString('el-GR', {
          timeZone: entry.timezone,
          ...(compact ? { hour: '2-digit', minute: '2-digit' } : {}),
        })}
        {!compact && !entry.allDay && ` (${entry.timezone})`}
        {!compact && entry.allDay && ` · ${dayKey(entry.start, entry)}`}
      </span>
      {!compact && <span className="block text-xs">{entry.location?.name_local || entry.location?.name}</span>}
      {(!compact || entry.status === 'cancelled') && <span className="block text-xs">{({ pending: 'Σε αναμονή', published: 'Δημοσιευμένη', cancelled: 'Ακυρώθηκε', rejected: 'Απορρίφθηκε' })[entry.status]}</span>}
    </Link>
  );
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Ημερολόγιο</h2><div className="flex gap-3"><Link href="/calendar" className="text-blue-700">Όλες οι τοποθεσίες</Link>{user ? <Link href={`/events/new${selectedLocation ? `?locationId=${selectedLocation}` : ''}`} className="rounded-lg bg-blue-600 px-4 py-2 text-white">+ Εκδήλωση</Link> : <Link href="/login" className="text-blue-700">Σύνδεση για υποβολή</Link>}</div></div>
    <div className="flex flex-wrap items-center gap-3">
      <button aria-label="Προηγούμενος μήνας" onClick={() => shift(-1)} className="rounded border px-3 py-2">←</button>
      <input aria-label="Μήνας" type="month" value={month} onChange={e => { if (e.target.value) { setMonth(e.target.value); setPage(1); } }} className="rounded border p-2" />
      <button aria-label="Επόμενος μήνας" onClick={() => shift(1)} className="rounded border px-3 py-2">→</button>
      <select aria-label="Προβολή ημερολογίου" value={mode} onChange={e => setMode(e.target.value)} className="rounded border p-2"><option value="list">Λίστα</option><option value="month">Μήνας</option></select>
      <select aria-label="Κατηγορία εκδήλωσης" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="rounded border p-2">{Object.entries({ '': 'Όλες οι κατηγορίες', community: 'Κοινότητα', meeting: 'Συνάντηση', culture: 'Πολιτισμός', action: 'Δράση', other: 'Άλλο' }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      {user && <select aria-label="Κατάσταση" value={view} onChange={e => { setView(e.target.value); setPage(1); }} className="rounded border p-2"><option value="public">Δημόσιες εκδηλώσεις</option><option value="mine">Οι υποβολές μου</option>{result?.canManage && <option value="review">Προς έγκριση</option>}</select>}
    </div>
    {!fixedLocationId && <div className="space-y-2"><LocationSelector value={locationId} onChange={id => { setLocationId(id); setView('public'); setPage(1); }} allowClear={false} placeholder="Όλες οι τοποθεσίες" />{locationId && <button onClick={() => { setLocationId(''); setView('public'); setPage(1); }} className="text-sm text-blue-700">Καθαρισμός τοποθεσίας</button>}</div>}
    {selectedLocation && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={descendants} onChange={e => { setDescendants(e.target.checked); setPage(1); }} />Συμπερίληψη υποπεριοχών</label>}
    <p className="text-xs text-gray-500">Οι ώρες εμφανίζονται στη ζώνη ώρας κάθε εκδήλωσης.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading ? <p role="status">Φόρτωση…</p> : mode === 'list' ? <div className="space-y-3">{entries.length ? entries.map(entry => entryLink(entry)) : <p className="rounded-xl border border-dashed p-8 text-center text-gray-500">Δεν υπάρχουν εκδηλώσεις αυτόν τον μήνα.</p>}</div> : <div className="overflow-x-auto"><div className="grid min-w-[640px] grid-cols-7 gap-1">{['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'].map(d => <div key={d} className="p-2 text-center font-semibold">{d}</div>)}{Array.from({ length: (start.getUTCDay() + 6) % 7 }, (_, i) => <div key={`blank-${i}`} />)}{days.map(day => <div key={day} className="min-h-28 space-y-1 rounded border p-1"><span className="text-xs text-gray-500">{Number(day.slice(-2))}</span>{entries.filter(e => dayKey(e.start, e) <= day && dayKey(new Date(new Date(e.end) - 1).toISOString(), e) >= day).map(entry => entryLink(entry, true))}</div>)}</div></div>}
    {result?.pagination.totalPages > 1 && <div className="flex items-center gap-4"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Προηγούμενα</button><span>{page} / {result.pagination.totalPages} · Το ημερολόγιο δείχνει αυτή τη σελίδα αποτελεσμάτων.</span><button disabled={page >= result.pagination.totalPages} onClick={() => setPage(page + 1)}>Επόμενα</button></div>}
  </section>;
}
