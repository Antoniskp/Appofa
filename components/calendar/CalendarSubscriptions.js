'use client';

import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LocationSelector from '@/components/ui/LocationSelector';
import { calendarAPI } from '@/lib/api/calendar';
import { CALENDAR_CATEGORIES } from '@/lib/calendar/categories';
import CalendarPill from './CalendarPill';

export default function CalendarSubscriptions({ subscriptions, selected, onToggle, onSetCategories, onChange, onUnsubscribe }) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const [manageOpen, setManageOpen] = useState(false);
  const [locationId, setLocationId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const manageId = useId();
  const categories = CALENDAR_CATEGORIES.filter(category => subscriptions.categories.includes(category));
  const allCategories = categories.length > 0 && selected.showCategories.length === categories.length;
  const locations = subscriptions.locations;
  const locationName = location => locale === 'el' ? location.name_local || location.name : location.name;

  async function save(target, subscribed) {
    setSaving(true);
    setSaveError(false);
    try {
      const { data } = await calendarAPI.setSubscription({ ...target, subscribed });
      onChange(data);
      if (!subscribed) onUnsubscribe(target);
      if (target.locationId && subscribed) setLocationId(null);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  function sourcePill(label, key, value) {
    const pressed = selected[key].includes(value);
    return <CalendarPill key={value} pressed={pressed} onClick={() => onToggle(key, value, !pressed)}>{label}</CalendarPill>;
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <h3 className="text-sm font-semibold">{t('subscriptions')}</h3>
      <button type="button" aria-expanded={manageOpen} aria-controls={manageId} onClick={() => setManageOpen(open => !open)}
        className="min-h-11 rounded-lg px-2 text-sm font-semibold text-blue-700 hover:bg-ivory hover:underline focus-visible:outline-copper">
        {t('manageSubscriptions')}
      </button>
    </div>
    {categories.length > 0 && <div role="group" aria-label={t('followedCategories')} className="flex flex-wrap gap-2">
      <CalendarPill pressed={allCategories} onClick={() => onSetCategories(allCategories ? [] : categories)}>{t('allCategories')}</CalendarPill>
      {categories.map(category => sourcePill(t(`categories.${category}`), 'showCategories', category))}
    </div>}
    {locations.length > 0 && <div role="group" aria-label={t('followedLocations')} className="flex flex-wrap gap-2">
      {locations.map(location => sourcePill(locationName(location), 'showLocations', String(location.id)))}
    </div>}
    {!categories.length && !locations.length && <p className="text-sm text-gray-600">{t('noSubscriptions')}</p>}
    <div id={manageId} hidden={!manageOpen}>
      {manageOpen && <fieldset disabled={saving} className="min-w-0 space-y-4 rounded-xl border border-brand-border bg-ivory p-3 sm:p-4">
        <legend className="sr-only">{t('manageSubscriptions')}</legend>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{t('followedCategories')}</legend>
          <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
            {CALENDAR_CATEGORIES.map(category => <label key={category} className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" checked={categories.includes(category)} onChange={event => save({ category }, event.target.checked)}
                className="h-4 w-4 shrink-0 accent-blue-700" />
              {t(`categories.${category}`)}
            </label>)}
          </div>
        </fieldset>
        <div role="group" aria-label={t('followedLocations')} className="space-y-2">
          <p className="text-sm font-semibold">{t('followedLocations')}</p>
          <div className="flex flex-wrap items-start gap-2">
            <LocationSelector className="min-w-0 flex-1 basis-48" value={locationId} onChange={setLocationId}
              allowClear={false} placeholder={t('chooseLocation')} labels={t.raw('locationPicker')} />
            <button type="button" disabled={!locationId || locations.some(location => location.id === locationId)}
              onClick={() => save({ locationId }, true)}
              className="min-h-10 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white disabled:opacity-50">
              {t('followLocation')}
            </button>
          </div>
          {locations.length > 0 && <ul className="flex flex-wrap gap-2">
            {locations.map(location => <li key={location.id}>
              <button type="button" aria-label={t('unfollowLocation', { location: locationName(location) })}
                onClick={() => save({ locationId: location.id }, false)}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-border bg-white px-3 text-sm hover:border-copper">
                {locationName(location)}
                <XMarkIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
              </button>
            </li>)}
          </ul>}
        </div>
        {saveError && <p role="alert" className="text-sm text-red-700">{t('subscriptionSaveError')}</p>}
      </fieldset>}
    </div>
  </div>;
}
