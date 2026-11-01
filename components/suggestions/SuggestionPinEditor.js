'use client';
import dynamic from 'next/dynamic';
import { MAP_ISSUE_TYPES } from '@/lib/constants/mapIssues';
import NearbySuggestions from './NearbySuggestions';
const Picker = dynamic(() => import('@/components/map/LocationPickerMap'), { ssr: false });
export default function SuggestionPinEditor({ form, onChange, excludeId }) {
  if (!form.locationId) return null;
  return <section className="space-y-3">
    <h2 className="text-sm font-semibold">Ακριβές σημείο αναφοράς</h2>
    <Picker lat={form.mapLat} lng={form.mapLng} onChange={({ lat, lng }) => onChange({ mapLat: lat, mapLng: lng, mapIssueType: form.mapIssueType || 'other' })} />
    {form.mapLat != null && <>
      <label className="block text-sm">Είδος ζητήματος<select className="ml-2 rounded border p-2" value={form.mapIssueType || 'other'} onChange={event => onChange({ mapIssueType: event.target.value })}>{MAP_ISSUE_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <button type="button" className="text-sm text-red-700 underline" onClick={() => onChange({ mapLat: null, mapLng: null, mapIssueType: null })}>Αφαίρεση σημείου</button>
      {form.type === 'problem' && <NearbySuggestions lat={form.mapLat} lng={form.mapLng} excludeId={excludeId} />}
    </>}
  </section>;
}
