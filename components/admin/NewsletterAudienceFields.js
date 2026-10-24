'use client';

import LocationSelector from '@/components/ui/LocationSelector';

export const NEWSLETTER_SEGMENTS = [
  ['all', 'All subscribers'],
  ['registered', 'Registered accounts'],
  ['missing_location', 'Registered accounts missing a location'],
  ['with_location', 'Registered accounts with a location'],
  ['newsletter_only', 'Newsletter subscribers without an account'],
];

export default function NewsletterAudienceFields({ value, onChange, disabled = false }) {
  const reminder = value.purpose === 'profile_location';
  return <fieldset disabled={disabled} className="mb-4 space-y-3 disabled:opacity-60">
    <label className="block text-sm font-medium">Campaign purpose
      <select value={value.purpose || 'newsletter'} onChange={(e) => onChange({ purpose: e.target.value, ...(e.target.value === 'profile_location' ? { segment: 'missing_location', topic: 'general', locationId: null } : {}) })} className="mt-1 block w-full rounded-lg border border-gray-300 p-2">
        <option value="newsletter">Newsletter / update</option><option value="profile_location">One-time location reminder</option>
      </select>
    </label>
    <label className="block text-sm font-medium">Account segment
      <select disabled={disabled || reminder} value={reminder ? 'missing_location' : value.segment || 'all'} onChange={(e) => onChange({ segment: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 p-2">
        {NEWSLETTER_SEGMENTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
    </label>
    <label className="block text-sm font-medium">Email topic
      <select disabled={disabled || reminder} value={reminder ? 'general' : value.topic || 'general'} onChange={(e) => onChange({ topic: e.target.value })} className="mt-1 block w-full rounded-lg border border-gray-300 p-2">
        <option value="general">Appofasi news and profile reminders</option><option value="local">Local issues and polls</option><option value="activity">Community activity updates</option>
      </select>
    </label>
    {!reminder && <div>
      <p className="text-sm font-medium">Location (optional, includes surrounding subareas)</p>
      <LocationSelector value={value.locationId || null} onChange={(locationId) => onChange({ locationId })} placeholder="All locations" />
    </div>}
    <p className="text-xs text-gray-600">Only subscribed addresses that opted into this topic are eligible. Registration alone does not subscribe anyone.</p>
    {reminder && <p className="text-xs text-gray-600">Verified accounts missing a location only. Completed profiles and previously reminded addresses are excluded at send time. Interrupted or failed reminder attempts remain held for manual delivery review.</p>}
  </fieldset>;
}
