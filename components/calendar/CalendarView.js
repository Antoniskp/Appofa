'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { calendarAPI } from '@/lib/api/calendar';
import { useAuth } from '@/lib/auth-context';
import LocationSelector from '@/components/ui/LocationSelector';
import { localDateTime } from '@/lib/calendar/dates';

const CATEGORIES = ['community', 'meeting', 'culture', 'action', 'other'];
const dateKey = (value, entry) => entry.allDay
  ? String(value).slice(0, 10) : localDateTime(value, entry.timezone).slice(0, 10);

export default function CalendarView({ locationId: fixedLocationId }) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const { user } = useAuth();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [locationId, setLocationId] = useState('');
  const [descendants, setDescendants] = useState(false);
  const [mode, setMode] = useState('list');
  const [period, setPeriod] = useState('upcoming');
  const [view, setView] = useState('public');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDay, setSelectedDay] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const selectedLocation = fixedLocationId || locationId;
  const monthView = mode === 'month' || period === 'month';
  const [year, number] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, number - 1, 1));
  const end = new Date(Date.UTC(year, number, 1));

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const [y, m] = month.split('-').map(Number);
    const now = Date.now();
    const range = monthView ? {
      start: new Date(Date.UTC(y, m - 1, 1) - 86400000).toISOString(),
      end: new Date(Date.UTC(y, m, 2)).toISOString(), complete: true,
    } : {
      start: new Date(period === 'past' ? now - 365 * 86400000 : now).toISOString(),
      end: new Date(period === 'past' ? now : now + 365 * 86400000).toISOString(), period,
    };
    calendarAPI.list({
      ...range, view: user ? view : 'public', page: monthView ? 1 : page,
      ...(category ? { category } : {}),
      ...(selectedLocation ? { locationId: selectedLocation, descendants } : {}),
    }).then(data => { if (active) setResult(data); })
      .catch(e => { if (active) { setError(e.message); setResult(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, monthView, period, selectedLocation, descendants, view, page, user, category]);

  const days = Array.from({ length: Math.round((end - start) / 86400000) },
    (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  const lastDay = entry => dateKey(new Date(new Date(entry.end) - 1).toISOString(), entry);
  const entries = (result?.data || []).filter(entry => !monthView ||
    (dateKey(entry.start, entry) <= days.at(-1) && lastDay(entry) >= days[0]));
  const forDay = day => entries.filter(entry => dateKey(entry.start, entry) <= day && lastDay(entry) >= day);
  const today = new Date().toLocaleDateString('en-CA');
  const activeDay = selectedDay.startsWith(`${month}-`) ? selectedDay : today.startsWith(`${month}-`) ? today : days[0];
  const formatDay = day => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, { dateStyle: 'long', timeZone: 'UTC' });
  function changeMonth(value) {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    setMonth(value); setPage(1); setSelectedDay('');
  }
  function entryLink(entry, compact = false) {
    return <Link key={entry.id} href={entry.href} className={`block break-words rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 ${compact ? 'p-1.5 text-xs' : 'p-3 text-sm'}`}>
      <span className={`font-semibold ${compact ? 'line-clamp-2' : ''}`}>{entry.title}</span>
      <span className="block text-xs text-gray-600">
        {entry.allDay ? t('allDay') : new Date(entry.start).toLocaleString(locale, {
          timeZone: entry.timezone, ...(compact ? { hour: '2-digit', minute: '2-digit' } : {}),
        })}
        {!compact && (entry.allDay ? ` · ${formatDay(dateKey(entry.start, entry))}` : ` (${entry.timezone})`)}
      </span>
      {!compact && <span className="block text-xs">{entry.location?.name_local || entry.location?.name}</span>}
      {entry.status && (!compact || entry.status === 'cancelled') && <span className="block text-xs">{t.has(`statuses.${entry.status}`) ? t(`statuses.${entry.status}`) : entry.status}</span>}
    </Link>;
  }

  return <section className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-2xl font-bold">{t('title')}</h2>
      <div className="flex flex-wrap items-center gap-3">
        {fixedLocationId && <Link href="/calendar" className="text-blue-700">{t('allLocations')}</Link>}
        {user ? <Link href={`/events/new${selectedLocation ? `?locationId=${selectedLocation}` : ''}`} className="rounded-lg bg-blue-600 px-4 py-2 text-white">{t('add')}</Link>
          : <Link href="/login" className="text-blue-700">{t('signIn')}</Link>}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <select aria-label={t('view')} value={mode} onChange={e => { setMode(e.target.value); setPage(1); }} className="rounded border p-2">
        <option value="list">{t('list')}</option><option value="month">{t('month')}</option>
      </select>
      {mode === 'list' && <select aria-label={t('period')} value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }} className="max-w-full rounded border p-2">
        <option value="upcoming">{t('upcoming')}</option><option value="past">{t('past')}</option><option value="month">{t('thisMonth')}</option>
      </select>}
      {monthView && <div className="flex items-center gap-2">
        <button aria-label={t('previousMonth')} onClick={() => changeMonth(new Date(Date.UTC(year, number - 2, 1)).toISOString().slice(0, 7))} className="rounded border px-3 py-2">←</button>
        <input aria-label={t('month')} type="month" value={month} onChange={e => changeMonth(e.target.value)} className="min-w-0 rounded border p-2" />
        <button aria-label={t('nextMonth')} onClick={() => changeMonth(new Date(Date.UTC(year, number, 1)).toISOString().slice(0, 7))} className="rounded border px-3 py-2">→</button>
      </div>}
      <select aria-label={t('category')} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="max-w-full rounded border p-2">
        <option value="">{t('allCategories')}</option>{CATEGORIES.map(value => <option key={value} value={value}>{t(`categories.${value}`)}</option>)}
      </select>
      {user && <select aria-label={t('status')} value={view} onChange={e => { setView(e.target.value); setPage(1); }} className="max-w-full rounded border p-2">
        <option value="public">{t('public')}</option><option value="mine">{t('mine')}</option>
        {result?.canManage && <option value="review">{t('review')}</option>}
      </select>}
    </div>
    {!fixedLocationId && <div className="space-y-2">
      <LocationSelector value={locationId} onChange={id => { setLocationId(id); setView('public'); setPage(1); }} allowClear={false} placeholder={t('allLocations')} labels={t.raw('locationPicker')} />
      {locationId && <button onClick={() => { setLocationId(''); setView('public'); setPage(1); }} className="text-sm text-blue-700">{t('clearLocation')}</button>}
    </div>}
    {selectedLocation && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={descendants} onChange={e => { setDescendants(e.target.checked); setPage(1); }} />{t('descendants')}</label>}
    <p className="text-xs text-gray-500">{t('timezoneHint')} {!monthView && t(period === 'past' ? 'pastHint' : 'yearHint')}</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading ? <p role="status">{t('loading')}</p> : mode === 'list' ? <div className="space-y-3">
      {entries.length ? entries.map(entry => entryLink(entry)) : !error && <p className="rounded-xl border border-dashed p-8 text-center text-gray-500">{t('empty')}</p>}
    </div> : <>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => <div key={i} className="min-w-0 truncate py-2 text-center text-xs font-semibold">
          {new Date(Date.UTC(2026, 0, 5 + i)).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })}
        </div>)}
        {Array.from({ length: (start.getUTCDay() + 6) % 7 }, (_, i) => <div key={`blank-${i}`} />)}
        {days.map(day => {
          const events = forDay(day);
          return <div key={day} className={`min-w-0 rounded border p-1 ${activeDay === day ? 'border-blue-500 bg-blue-50' : ''}`}>
            <button onClick={() => setSelectedDay(day)} aria-pressed={activeDay === day}
              aria-label={`${formatDay(day)}: ${t('dayCount', { count: events.length })}`}
              className="flex min-h-12 w-full flex-col items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700">
              <span className="text-sm">{Number(day.slice(-2))}</span>
              {events.length > 0 && <span className="rounded-full bg-blue-700 px-1.5 text-[10px] text-white">{events.length}</span>}
            </button>
            <div className="hidden space-y-1 lg:block">{events.slice(0, 3).map(entry => entryLink(entry, true))}
              {events.length > 3 && <button onClick={() => setSelectedDay(day)} className="text-xs text-blue-700">{t('more', { count: events.length })}</button>}
            </div>
          </div>;
        })}
      </div>
      <section aria-live="polite" className="space-y-3">
        <h3 className="font-semibold">{t('selectedDay', { date: formatDay(activeDay) })}</h3>
        {forDay(activeDay).length ? forDay(activeDay).map(entry => entryLink(entry)) : <p className="text-sm text-gray-500">{t('emptyDay')}</p>}
      </section>
    </>}
    {!loading && !monthView && result?.pagination.totalPages > 1 && <div className="flex flex-wrap items-center gap-4">
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>{t('previous')}</button>
      <span>{t('page', { page, total: result.pagination.totalPages })}</span>
      <button disabled={page >= result.pagination.totalPages} onClick={() => setPage(page + 1)}>{t('next')}</button>
    </div>}
  </section>;
}
