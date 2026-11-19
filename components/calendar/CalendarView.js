'use client';

import { Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  AdjustmentsHorizontalIcon, ArrowRightIcon, Bars3Icon, CalendarDaysIcon, ChevronDownIcon, MapPinIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { calendarAPI } from '@/lib/api/calendar';
import { useAuth } from '@/lib/auth-context';
import LocationSelector from '@/components/ui/LocationSelector';
import { CALENDAR_CATEGORIES } from '@/lib/calendar/categories';
import { calendarEntryDays, localDateTime, shiftDate } from '@/lib/calendar/dates';

const CATEGORY_STYLES = {
  community: { dot: 'bg-emerald-700', label: 'bg-emerald-50 text-emerald-900' },
  meeting: { dot: 'bg-sky-700', label: 'bg-sky-50 text-sky-900' },
  culture: { dot: 'bg-fuchsia-700', label: 'bg-fuchsia-50 text-fuchsia-900' },
  action: { dot: 'bg-rose-700', label: 'bg-rose-50 text-rose-900' },
  other: { dot: 'bg-slate-600', label: 'bg-slate-100 text-slate-800' },
  benefits: { dot: 'bg-amber-700', label: 'bg-amber-50 text-amber-900' },
  elections: { dot: 'bg-violet-700', label: 'bg-violet-50 text-violet-900' },
  polls: { dot: 'bg-cyan-700', label: 'bg-cyan-50 text-cyan-900' },
};
const VIEW_OPTIONS = [
  { value: 'month', Icon: CalendarDaysIcon },
  { value: 'list', Icon: Bars3Icon },
];
const FOCUS_RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper';

function NextEventButton({ knownDay, from, filters, onJump }) {
  const t = useTranslations('calendar');
  const [status, setStatus] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);

  async function jump() {
    if (knownDay) {
      onJump(knownDay);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setStatus('loading');
    try {
      const { day } = await calendarAPI.nextDay({ ...filters, from }, controller.signal);
      if (controller.signal.aborted) return;
      if (day) onJump(day);
      else setStatus('noNextEvent');
    } catch {
      if (!controller.signal.aborted) setStatus('nextEventError');
    }
  }

  return <div className="space-y-2">
    {status !== 'noNextEvent' && <button type="button" disabled={status === 'loading'} onClick={jump}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-border px-3 text-sm font-semibold text-blue-700 hover:border-copper hover:bg-ivory disabled:opacity-60 ${FOCUS_RING}`}>
      {t(status === 'loading' ? status : 'jumpToNextEvent')}
      <ArrowRightIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
    </button>}
    {['noNextEvent', 'nextEventError'].includes(status) && <p role="status" className="text-sm text-gray-600">{t(status)}</p>}
  </div>;
}

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
  const requestedMode = params.get('mode');
  const requestedPeriod = params.get('period');
  const hasListPeriod = ['upcoming', 'past', 'month'].includes(requestedPeriod);
  const mode = requestedMode === 'list' || (!requestedMode && hasListPeriod) ? 'list' : 'month';
  const period = hasListPeriod ? requestedPeriod : 'upcoming';
  const view = ['mine', 'review'].includes(params.get('view')) ? params.get('view') : 'public';
  const category = CALENDAR_CATEGORIES.includes(params.get('category')) ? params.get('category') : '';
  const page = Math.max(1, Math.min(100000, Math.floor(Number(params.get('page'))) || 1));
  const selectedDay = params.get('day') || '';
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  const agendaHeading = useRef(null);
  const pendingJump = useRef('');
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
  const selectedLocation = fixedLocationId || locationId;
  const activeFilters = [];
  if (category) activeFilters.push({ key: 'category', label: t(`categories.${category}`) });
  if (user && view !== 'public') activeFilters.push({ key: 'view', label: t(view) });
  if (selectedLocation && descendants) activeFilters.push({ key: 'descendants', label: t('descendants') });
  const filterCount = activeFilters.length + Number(Boolean(locationId));
  const filtered = filterCount > 0;
  const clearFilters = () => update({ category: '', location: '', view: '', descendants: '', page: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const effectiveView = user ? view : 'public';
  const calendarFilters = useMemo(() => ({
    view: effectiveView,
    ...(category ? { category } : {}),
    ...(selectedLocation ? { locationId: selectedLocation, descendants } : {}),
  }), [effectiveView, category, selectedLocation, descendants]);
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
    calendarAPI.list({ ...range, ...calendarFilters, page: monthView ? 1 : page })
      .then(data => { if (active) setResult({ ...data, month }); })
      .catch(e => { if (active) { setError(e.message); setResult(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, monthView, period, calendarFilters, page, user]);

  const days = Array.from({ length: Math.round((end - start) / 86400000) },
    (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  const datedEntries = useMemo(() => (result?.data || []).map(entry => ({ ...entry, ...calendarEntryDays(entry) })), [result]);
  const entries = datedEntries.filter(entry => !monthView || (entry.firstDay <= days.at(-1) && entry.lastDay >= days[0]));
  const forDay = day => entries.filter(entry => entry.firstDay <= day && entry.lastDay >= day);
  const today = new Date().toLocaleDateString('en-CA');
  const activeDay = days.includes(selectedDay) ? selectedDay : today.startsWith(`${month}-`) ? today : days[0];
  const agenda = mode === 'month' ? forDay(activeDay) : [];
  const nextDayInMonth = mode === 'month' && !agenda.length
    ? days.find(day => day > activeDay && forDay(day).some(entry => entry.status !== 'cancelled'))
    : null;
  const monthCategories = CALENDAR_CATEGORIES.filter(value => entries.some(entry => entry.category === value));
  const loadedMonth = result?.month;
  useEffect(() => {
    if (loading || loadedMonth !== month || pendingJump.current !== activeDay || !agendaHeading.current) return;
    agendaHeading.current.focus();
    pendingJump.current = '';
  }, [activeDay, loadedMonth, loading, month]);

  const formatDay = day => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, { dateStyle: 'long', timeZone: 'UTC' });
  function jumpToDay(day) {
    pendingJump.current = day;
    update({ month: day.slice(0, 7), day, page: '' });
  }
  function changeMonth(value) {
    if (!/^\d{4}-\d{2}$/.test(value)) return;
    update({ month: value, page: '', day: '' });
  }
  function entryLink(entry, compact = false) {
    const { firstDay: day, lastDay: finalDay } = entry;
    const cancelled = entry.status === 'cancelled';
    const now = new Date();
    const eventToday = entry.allDay ? localDateTime(now, entry.timezone).slice(0, 10) : '';
    const ongoing = !cancelled && !['election', 'poll-deadline'].includes(entry.source) && (entry.allDay
      ? day <= eventToday && finalDay >= eventToday
      : new Date(entry.start) <= now && new Date(entry.end) > now);
    const categoryStyle = CATEGORY_STYLES[entry.category];
    return <Link key={entry.id} href={entry.href} className={`block min-w-0 break-words rounded-xl border transition hover:border-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-copper ${cancelled ? 'border-red-200 bg-red-50' : 'border-brand-border bg-white'} ${compact ? 'p-2 text-xs' : 'p-4 text-sm'}`}>
      <span className={`font-semibold ${compact ? 'line-clamp-2' : 'text-base'}`}>{entry.titles?.[locale] || entry.title}</span>
      <span className="mt-1 block text-xs text-gray-600">
        {entry.allDay ? t('allDay') : new Date(entry.start).toLocaleTimeString(locale, { timeZone: entry.timezone, hour: '2-digit', minute: '2-digit' })}
        {!entry.allDay && (!compact || entry.source === 'poll-deadline') && ` · ${entry.timezone}`}
        {!compact && finalDay !== day && ` · ${formatDay(day)} – ${formatDay(finalDay)}`}
      </span>
      {!compact && entry.location && <span className="mt-1 block text-gray-600">{entry.location.name_local || entry.location.name}</span>}
      {!compact && entry.source === 'benefit' && <span className="mt-1 block text-gray-600">{t('benefitEntry')}</span>}
      <span className="mt-2 flex flex-wrap gap-2">
        {categoryStyle && <span className={`max-w-full rounded-md font-medium ${compact ? 'px-1.5 py-0.5 text-[10px] leading-tight' : 'px-2 py-1 text-xs'} ${categoryStyle.label}`}>{t(`categories.${entry.category}`)}</span>}
        {ongoing && <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">{t('ongoing')}</span>}
        {entry.status && entry.status !== 'published' && <span className={`rounded-full px-2 py-1 text-xs ${cancelled ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>{t.has(`statuses.${entry.status}`) ? t(`statuses.${entry.status}`) : entry.status}</span>}
      </span>
    </Link>;
  }
  const groups = Object.groupBy(entries, entry => entry.firstDay);
  const emptyState = <div className="rounded-2xl border border-brand-border bg-white px-6 py-10 text-center">
    <h3 className="text-lg font-semibold">{t(filtered ? 'emptyFiltered' : period === 'upcoming' && !monthView ? 'emptyUpcoming' : 'empty')}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">{t(filtered ? 'emptyFilteredHint' : 'emptyHint')}</p>
    {(!filtered || period !== 'past') && <div className="mt-5 flex flex-wrap justify-center gap-3">
      {!filtered && <Link href={addHref} className="rounded-lg bg-blue-600 px-4 py-2 text-white">{t('suggestEvent')}</Link>}
      {period !== 'past' && <button onClick={() => update({ mode: 'list', period: 'past', page: '' })} className="rounded-lg border border-brand-border px-4 py-2">{t('browsePast')}</button>}
    </div>}
  </div>;

  return <section className="min-w-0 space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-bold sm:text-3xl">{t('title')}</h2><p className="mt-2 max-w-xl text-sm text-gray-600">{t('intro')}</p></div>
      <Link href={addHref} className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">{t('suggestEvent')}</Link>
    </header>
    <div className="space-y-3 rounded-2xl border border-brand-border bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={t('view')} className="inline-flex max-w-full rounded-xl bg-ivory p-1">
          {VIEW_OPTIONS.map(({ value, Icon }) => (
            <button key={value} type="button" aria-pressed={mode === value} onClick={() => update({ mode: value, page: '' })}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition sm:px-4 ${FOCUS_RING} ${mode === value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-blue-100 hover:text-charcoal'}`}>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
              {t(value)}
            </button>
          ))}
        </div>
        <button type="button" aria-expanded={filtersOpen} aria-controls={filtersId} onClick={() => setFiltersOpen(open => !open)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${FOCUS_RING} ${filtersOpen || filtered ? 'border-copper bg-ivory text-blue-700' : 'border-brand-border text-charcoal hover:bg-ivory'}`}>
          <AdjustmentsHorizontalIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
          {t('filters')}
          {filtered && <span className="rounded-full bg-blue-600 px-1.5 text-xs leading-5 text-white">{filterCount}</span>}
          <ChevronDownIcon aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <div className="border-t border-brand-border pt-3">
        {!fixedLocationId ? <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1">
            <MapPinIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-copper" />
            <LocationSelector key={locationId} className="min-w-0 flex-1" value={locationId}
              onChange={id => update({ location: id, view: '', page: '' })} allowClear={false}
              placeholder={t('allLocations')} labels={t.raw('locationPicker')} />
          </div>
          {user?.homeLocationId && <button type="button"
            aria-pressed={descendants && locationId === String(user.homeLocationId)}
            onClick={() => update({ location: user.homeLocationId, descendants: true, view: '', page: '' })}
            className={`min-h-10 rounded-lg border border-brand-border px-3 text-sm font-semibold text-blue-700 hover:bg-ivory aria-pressed:border-copper aria-pressed:bg-ivory ${FOCUS_RING}`}>
            {t('myArea')}
          </button>}
          {locationId && <button type="button" onClick={() => update({ location: '', descendants: '', page: '' })}
            className={`min-h-10 rounded-lg px-3 text-sm font-semibold text-blue-700 hover:bg-ivory ${FOCUS_RING}`}>
            {t('allLocations')}
          </button>}
        </div> : <Link href="/calendar" className={`inline-flex items-center gap-2 rounded text-sm font-semibold text-blue-700 hover:underline ${FOCUS_RING}`}>
          <MapPinIcon aria-hidden="true" className="h-4 w-4" />
          {t('allLocations')} <span aria-hidden="true">→</span>
        </Link>}
      </div>
      <div id={filtersId} hidden={!filtersOpen} className="space-y-3 rounded-xl border border-brand-border bg-ivory p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
            {t('category')}
            <select value={category} onChange={e => update({ category: e.target.value, page: '' })}
              className={`min-h-11 w-full rounded-lg border border-brand-border bg-white px-3 text-sm font-normal ${FOCUS_RING}`}>
              <option value="">{t('allCategories')}</option>
              {CALENDAR_CATEGORIES.map(value => <option key={value} value={value}>{t(`categories.${value}`)}</option>)}
            </select>
          </label>
          {user && <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
            {t('status')}
            <select value={view} onChange={e => update({ view: e.target.value, page: '' })}
              className={`min-h-11 w-full rounded-lg border border-brand-border bg-white px-3 text-sm font-normal ${FOCUS_RING}`}>
              <option value="public">{t('public')}</option>
              <option value="mine">{t('mine')}</option>
              {(result?.canManage || view === 'review') && <option value="review">{t('review')}</option>}
            </select>
          </label>}
        </div>
        {selectedLocation && <label className="flex min-h-9 w-fit items-center gap-2 text-sm">
          <input type="checkbox" checked={descendants} onChange={e => update({ descendants: e.target.checked, page: '' })}
            className={`h-4 w-4 shrink-0 accent-copper ${FOCUS_RING}`} />
          {t('descendants')}
        </label>}
      </div>
      {filtered && <div className="flex flex-wrap items-center gap-2 border-t border-brand-border pt-3">
        {activeFilters.map(({ key, label }) => (
          <button key={key} type="button" aria-label={t('removeFilter', { filter: label })}
            onClick={() => update({ [key]: '', page: '' })}
            className={`inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full bg-ivory px-3 text-left text-sm font-medium text-blue-800 hover:bg-blue-100 ${FOCUS_RING}`}>
            {label}
            <XMarkIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
          </button>
        ))}
        <button type="button" onClick={clearFilters}
          className={`ml-auto min-h-9 rounded-lg px-2 text-sm font-semibold text-blue-700 hover:bg-ivory hover:underline ${FOCUS_RING}`}>
          {t('clearFilters')}
        </button>
      </div>}
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
          const categories = [...new Set(events.map(entry => entry.category))].filter(value => CATEGORY_STYLES[value]);
          const label = [formatDay(day) + ': ' + t('dayCount', { count: events.length }), ...categories.map(value => t(`categories.${value}`))].join(', ');
          return <div key={day} className={`min-w-0 rounded border p-1 ${activeDay === day ? 'border-blue-500 bg-blue-50' : ''}`}>
            <button onClick={() => setSelectedDay(day)} aria-pressed={activeDay === day}
              aria-label={label}
              className="flex min-h-12 w-full flex-col items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700">
              <span className="text-sm">{Number(day.slice(-2))}</span>
              {events.length > 0 && <span className="rounded-full bg-blue-700 px-1.5 text-[10px] text-white">{events.length}</span>}
              {categories.length > 0 && <span aria-hidden="true" className="mt-1 flex max-w-[1.5rem] flex-wrap justify-center gap-0.5 lg:hidden">
                {categories.map(value => <span key={value} className={`h-1 w-1 rounded-full ${CATEGORY_STYLES[value].dot}`} />)}
              </span>}
            </button>
            <div className="hidden space-y-1 lg:block">{events.slice(0, 3).map(entry => entryLink(entry, true))}
              {events.length > 3 && <button onClick={() => setSelectedDay(day)} className="text-xs text-blue-700">{t('more', { count: events.length })}</button>}
            </div>
          </div>;
        })}
      </div>
      {monthCategories.length > 0 && <ul aria-label={t('category')} className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-700 lg:hidden">
        {monthCategories.map(value => <li key={value} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_STYLES[value].dot}`} />
          {t(`categories.${value}`)}
        </li>)}
      </ul>}
      <section aria-live="polite" className="space-y-3">
        <h3 ref={agendaHeading} tabIndex={-1} className={`w-fit rounded font-semibold ${FOCUS_RING}`}>{t('selectedDay', { date: formatDay(activeDay) })}</h3>
        {agenda.length ? agenda.map(entry => entryLink(entry)) : <>
          <p className="text-sm text-gray-500">{t('emptyDay')}</p>
          {!error && activeDay < '9999-12-31' && <NextEventButton
            key={JSON.stringify([activeDay, calendarFilters, user?.id])}
            knownDay={nextDayInMonth} from={shiftDate(activeDay, 1)} filters={calendarFilters} onJump={jumpToDay} />}
        </>}
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
