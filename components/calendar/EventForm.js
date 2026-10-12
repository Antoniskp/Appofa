'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calendarAPI } from '@/lib/api/calendar';
import LocationSelector from '@/components/ui/LocationSelector';
import { localDateTime, toInstant, shiftDate } from '@/lib/calendar/dates';
import { useAuth } from '@/lib/auth-context';
import LoginLink from '@/components/ui/LoginLink';
import { useTranslations } from 'next-intl';
import TimezoneSelector from './TimezoneSelector';

export default function EventForm({ locationId: initialLocationId = '', event, onSaved }) {
  const router = useRouter();
  const t = useTranslations('calendar');
  const { user, loading } = useAuth();
  const [locationId, setLocationId] = useState(event?.locationId || initialLocationId);
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [timezone, setTimezone] = useState(event?.timezone || 'Europe/Athens');
  async function submit(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const form = Object.fromEntries(new FormData(e.currentTarget));
      const data = { ...form, locationId, allDay, start: allDay ? `${form.start}T00:00:00.000Z` : toInstant(form.start, form.timezone), end: allDay ? `${shiftDate(form.end, 1)}T00:00:00.000Z` : toInstant(form.end, form.timezone) };
      const result = event ? await calendarAPI.update(event.id, { ...data, revision: event.revision }) : await calendarAPI.create(data);
      if (onSaved) await onSaved();
      else router.push(`/events/${result.data.id}`);
    } catch (err) { setError(err.code && t.has(err.code) ? t(err.code) : err.message); } finally { setSaving(false); }
  }
  const input = (name, label, required = false, maxLength = 200, defaultValue = event?.[name] || '') => <label className="block space-y-1">{label}<input name={name} required={required} maxLength={maxLength} defaultValue={defaultValue} className="block w-full rounded-lg border p-2" /></label>;
  if (loading) return <p>{t('loading')}</p>;
  if (!user) return <LoginLink className="text-blue-700">{t('signIn')}</LoginLink>;
  return <form onSubmit={submit} className="space-y-4">
    {!event && <div><p className="mb-1">{t('location')}</p><LocationSelector value={locationId} onChange={setLocationId} allowClear={false} placeholder={t('location')} labels={t.raw('locationPicker')} /></div>}
    {input('title', t('eventTitle'), true)}
    <label className="block">{t('description')}<textarea name="description" required maxLength={10000} defaultValue={event?.description} rows={5} className="block w-full rounded-lg border p-2" /></label>
    <label className="flex gap-2"><input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />{t('allDay')}</label>
    <p className="text-sm text-gray-600">{t(allDay ? 'allDayHint' : 'timeHint')}</p>
    {['start', 'end'].map(name => <label key={`${name}-${allDay}`} className="block">{t(name)}<input type={allDay ? 'date' : 'datetime-local'} name={name} required defaultValue={event ? (allDay ? (name === 'end' && event.allDay ? shiftDate(event.end.slice(0, 10), -1) : event[name].slice(0, 10)) : localDateTime(event[name], event.timezone)) : ''} className="block w-full rounded-lg border p-2" /></label>)}
    <TimezoneSelector value={timezone} onChange={setTimezone} />
    {input('venue', t('venue'), false, 500)}{input('organizer', t('organizer'))}{input('sourceUrl', t('sourceUrl'), false, 2048)}
    <label className="block">{t('category')}<select name="category" defaultValue={event?.category || 'community'} className="block w-full rounded-lg border p-2">{['community', 'meeting', 'culture', 'action', 'other'].map(value => <option key={value} value={value}>{t(`categories.${value}`)}</option>)}</select></label>
    <p className="text-sm text-gray-600">{t('moderationHint')}</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button disabled={saving || !locationId} className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50">{t(saving ? 'saving' : 'save')}</button>
  </form>;
}
