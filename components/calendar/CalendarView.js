'use client';

import { Suspense, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { calendarAPI } from '@/lib/api/calendar';
import { useAuth } from '@/lib/auth-context';
import LocationSelector from '@/components/ui/LocationSelector';
import { localDateTime } from '@/lib/calendar/dates';

const CATEGORIES = ['community', 'meeting', 'culture', 'action', 'other'];
const dateKey = (value, entry) => entry.allDay
  ? String(value).slice(0, 10) : localDateTime(value, entry.timezone).slice(0, 10);

export default function CalendarView(props) {
  return <Suspense><CalendarContent {...props} /></Suspense>;
}

function CalendarContent({ locationId: fixedLocationId }) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [localParams, setLocalParams] = useState('');
  const params = new URLSearchParams(fixedLocationId ? localParams : searchParams.toString());
  const currentMonth = new Date().toLocaleDateString('en-CA').slice(0, 7);
  const rawMonth = params.get('month');
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(rawMonth || '') && Number(rawMonth.slice(0, 4)) >= 1000 ? rawMonth : currentMonth;
  const locationId = /^\d+$/.test(params.get('location') || '') ? params.get('location') : '';
  const descendants = params.get('descendants') === 'true';
  const mode = params.get('mode') === 'month' ? 'month' : 'list';
  const period = ['past', 'month'].includes(params.get('period')) ? params.get('period') : 'upcoming';
  const view = ['mine', 'review'].includes(params.get('view')) ? params.get('view') : 'public';
  const category = CATEGORIES.includes(params.get('category')) ? params.get('category') : '';
  const page = Math.max(1, Math.min(100000, Math.floor(Number(params.get('page'))) || 1));
  const selectedDay = params.get('day') || '';
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  function update(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === false || value == null) next.delete(key);
      else next.set(key, String(value));
    });
    if (fixedLocationId) setLocalParams(next.toString());
    else window.history.pushState(null, '', window.location.pathname + (next.size ? '?' + next : '') + window.location.hash);
  }
  const setPage = value => update({ page: value });
  const setSelectedDay = value => update({ day: value });
  const filtered = Boolean(category || locationId || view !== 'public' || descendants);
  const clearFilters = () => update({ category: '', location: '', view: '', descendants: '', page: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const selectedLocation = fixedLocationId || locationId;
  const addHref = user ? '/events/new' + (selectedLocation ? '?locationId=' + selectedLocation : '') : '/login';
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
  const activeDay = days.includes(selectedDay) ? selectedDay : today.startsWith(`${month}-`) ? today : days[0];
  const formatDay = day => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, { dateStyle: 'long', timeZone: 'UTC' });
  function changeMonth(value) {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    update({ month: value, page: '', day: '' });
  }
  function entryLink(entry, compact = false) {
    const day = dateKey(entry.start, entry);
    const finalDay = lastDay(entry);
    const cancelled = entry.status === 'cancelled';
    const ongoing = !cancelled && (entry.allDay
      ? day <= localDateTime(new Date().toISOString(), entry.timezone).slice(0, 10) && finalDay >= localDateTime(new Date().toISOString(), entry.timezone).slice(0, 10)
      : new Date(entry.start) <= new Date() && new Date(entry.end) > new Date());
    return <Link key={entry.id} href={entry.href} className={`block min-w-0 break-words rounded-xl border transition hover:border-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-copper ${cancelled ? 'border-red-200 bg-red-50' : 'border-brand-border bg-white'} ${compact ? 'p-2 text-xs' : 'p-4 text-sm'}`}>
      <span className={`font-semibold ${compact ? 'line-clamp-2' : 'text-base'}`}>{entry.title}</span>
      <span className="mt-1 block text-xs text-gray-600">
        {entry.allDay ? t('allDay') : new Date(entry.start).toLocaleTimeString(locale, { timeZone: entry.timezone, hour: '2-digit', minute: '2-digit' })}
        {!compact && !entry.allDay && ` · ${entry.timezone}`}
        {!compact && finalDay !== day && ` · ${formatDay(day)} – ${formatDay(finalDay)}`}
      </span>
      {!compact && <span className="mt-1 block text-gray-600">{entry.location?.name_local || entry.location?.name}</span>}
      <span className="mt-2 flex flex-wrap gap-2">
        {!compact && entry.category && t.has(`categories.${entry.category}`) && <span className="rounded-full bg-ivory px-2 py-1 text-xs text-blue-800">{t(`categories.${entry.category}`)}</span>}
        {ongoing && <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">{t('ongoing')}</span>}
        {entry.status && entry.status !== 'published' && <span className={`rounded-full px-2 py-1 text-xs ${cancelled ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>{t.has(`statuses.${entry.status}`) ? t(`statuses.${entry.status}`) : entry.status}</span>}
      </span>
    </Link>;
  }
  const groups = Object.groupBy(entries, entry => dateKey(entry.start, entry));
  const emptyState = <div className="rounded-2xl border border-brand-border bg-white px-6 py-10 text-center">
    <h3 className="text-lg font-semibold">{t(filtered ? 'emptyFiltered' : period === 'upcoming' && !monthView ? 'emptyUpcoming' : 'empty')}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{t(filtered ? 'emptyFilteredHint' : 'emptyHint')}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-3">
      {filtered ? <button onClick={clearFilters} className="rounded-lg bg-blue-600 px-4 py-2 text-white">{t('clearFilters')}</button>
        : <Link href={addHref} className="rounded-lg bg-blue-600 px-4 py-2 text-white">{t('suggestEvent')}</Link>}
      {period !== 'past' && <button onClick={() => update({ mode: 'list', period: 'past', page: '' })} className="rounded-lg border border-brand-border px-4 py-2">{t('browsePast')}</button>}
    </div>
  </div>;

  return <section className="min-w-0 space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-bold sm:text-3xl">{t('title')}</h2><p className="mt-2 max-w-xl text-sm text-gray-600">{t('intro')}</p></div>
      <Link href={addHref} className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">{t('suggestEvent')}</Link>
    </header>
    <div className="space-y-4 rounded-2xl border border-brand-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={t('view')} className="inline-flex rounded-lg bg-ivory p-1">
          {['list', 'month'].map(value => <button key={value} aria-pressed={mode === value} onClick={() => update({ mode: value, page: '' })} className={`min-h-10 rounded-md px-5 text-sm font-semibold ${mode === value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-100'}`}>{t(value)}</button>)}
        </div>
        <button aria-expanded={filtersOpen} aria-controls={filtersId} onClick={() => setFiltersOpen(!filtersOpen)} className="min-h-10 rounded-lg border border-brand-border px-4 text-sm">{t('filters')}{filtered ? ' •' : ''}</button>
      </div>
      {!fixedLocationId ? <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button aria-pressed={!locationId} onClick={() => update({ location: '', descendants: '', page: '' })} className="rounded-full border border-brand-border px-3 py-2 text-sm aria-pressed:bg-blue-100">{t('allLocations')}</button>
          {user?.homeLocationId && <button aria-pressed={String(locationId) === String(user.homeLocationId)} onClick={() => update({ location: user.homeLocationId, descendants: true, view: '', page: '' })} className="rounded-full border border-brand-border px-3 py-2 text-sm aria-pressed:bg-blue-100">{t('myArea')}</button>}
        </div>
        <LocationSelector key={locationId} value={locationId} onChange={id => update({ location: id, view: '', page: '' })} placeholder={t('allLocations')} labels={t.raw('locationPicker')} />
      </div> : <Link href="/calendar" className="inline-block text-sm text-blue-700">{t('allLocations')} →</Link>}
      <div id={filtersId} hidden={!filtersOpen} className="space-y-3 border-t border-brand-border pt-4">
        <div className="flex flex-wrap gap-3">
          <label className="flex min-w-0 flex-col gap-1 text-sm">{t('category')}<select value={category} onChange={e => update({ category: e.target.value, page: '' })} className="max-w-full rounded-lg border p-2"><option value="">{t('allCategories')}</option>{CATEGORIES.map(value => <option key={value} value={value}>{t(`categories.${value}`)}</option>)}</select></label>
          {user && <label className="flex min-w-0 flex-col gap-1 text-sm">{t('status')}<select value={view} onChange={e => update({ view: e.target.value, page: '' })} className="max-w-full rounded-lg border p-2"><option value="public">{t('public')}</option><option value="mine">{t('mine')}</option>{(result?.canManage || view === 'review') && <option value="review">{t('review')}</option>}</select></label>}
        </div>
        {selectedLocation && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={descendants} onChange={e => update({ descendants: e.target.checked, page: '' })} />{t('descendants')}</label>}
        {filtered && <button onClick={clearFilters} className="text-sm text-blue-700 underline">{t('clearFilters')}</button>}
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      {mode === 'list' && <select aria-label={t('period')} value={period} onChange={e => update({ period: e.target.value, page: '' })} className="max-w-full rounded-lg border border-brand-border bg-white p-2.5 text-sm"><option value="upcoming">{t('upcoming')}</option><option value="past">{t('past')}</option><option value="month">{t('thisMonth')}</option></select>}
      {monthView && <div className="flex w-full flex-wrap items-center gap-2">
        <h3 className="mr-auto text-lg font-semibold">{start.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h3>
        <button aria-label={t('previousMonth')} onClick={() => changeMonth(new Date(Date.UTC(year, number - 2, 1)).toISOString().slice(0, 7))} className="min-h-11 rounded-lg border px-4">←</button>
        <button onClick={() => update({ month: currentMonth, day: today, page: '' })} className="min-h-11 rounded-lg border px-3 text-sm">{t('today')}</button>
        <button aria-label={t('nextMonth')} onClick={() => changeMonth(new Date(Date.UTC(year, number, 1)).toISOString().slice(0, 7))} className="min-h-11 rounded-lg border px-4">→</button>
        <input aria-label={t('month')} type="month" value={month} onChange={e => changeMonth(e.target.value)} className="min-w-0 max-w-full rounded-lg border p-2 text-sm" />
      </div>}
    </div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading ? <p role="status">{t('loading')}</p> : mode === 'list' ? <div className="space-y-3">
      {entries.length ? Object.entries(groups).map(([day, group]) => <section key={day} className="flex gap-3 sm:gap-5">
        <div aria-hidden="true" className="w-12 shrink-0 pt-1 text-center text-blue-700"><span className="block text-2xl font-bold">{Number(day.slice(-2))}</span><span className="text-xs uppercase">{new Date(day + 'T12:00:00Z').toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' })}</span></div>
        <div className="min-w-0 flex-1 space-y-3"><h3 className="pt-1 text-sm font-semibold">{formatDay(day)}</h3>{group.map(entry => entryLink(entry))}</div>
      </section>) : !error && emptyState}
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
    <p className="text-xs leading-relaxed text-gray-500">{t('timezoneHint')} {!monthView && t(period === 'past' ? 'pastHint' : 'yearHint')}</p>
    {!loading && !monthView && result?.pagination.totalPages > 1 && <div className="flex flex-wrap items-center gap-4">
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>{t('previous')}</button>
      <span>{t('page', { page, total: result.pagination.totalPages })}</span>
      <button disabled={page >= result.pagination.totalPages} onClick={() => setPage(page + 1)}>{t('next')}</button>
    </div>}
  </section>;
}
