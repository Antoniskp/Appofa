'use client';
import { useState } from 'react';
import { mediaAPI } from '@/lib/api';

export default function SuggestionPhotos({ photos = [], onChange, onBusyChange, disabled = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function upload(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true); onBusyChange?.(true); setError('');
    try {
      const result = await mediaAPI.upload(file, { usageType: 'shared', entityType: 'shared' });
      if (!result.success || !result.media) throw new Error(result.message || 'Η μεταφόρτωση απέτυχε.');
      onChange([...photos, { id: result.media.id, url: result.media.variants?.articleCover?.url || result.media.url, kind: 'report', caption: '' }]);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); onBusyChange?.(false); input.value = ''; }
  }
  if (!onChange && !photos.length) return null;
  return <section className="my-4 space-y-3" aria-label="Φωτογραφίες αναφοράς">
    <h2 className="font-semibold">Φωτογραφίες αναφοράς και αποκατάστασης</h2>
    <div className="grid gap-3 sm:grid-cols-2">{photos.map((photo, index) => <figure key={photo.id} className="space-y-2 rounded-lg border p-2">
      <a href={photo.url} target="_blank" rel="noopener noreferrer"><img src={photo.url} alt={photo.caption || (photo.kind === 'repair' ? 'Φωτογραφία αποκατάστασης' : 'Φωτογραφία προβλήματος')} className="h-44 w-full rounded object-cover" /></a>
      {onChange ? <fieldset disabled={disabled || busy} className="space-y-2">
        <label className="block text-sm">Στάδιο <select value={photo.kind} onChange={event => onChange(photos.map((item, i) => i === index ? { ...item, kind: event.target.value } : item))}><option value="report">Αναφορά</option><option value="repair">Αποκατάσταση</option></select></label>
        <input aria-label="Λεζάντα φωτογραφίας" value={photo.caption} maxLength={300} placeholder="Λεζάντα" className="w-full rounded border p-2 text-sm" onChange={event => onChange(photos.map((item, i) => i === index ? { ...item, caption: event.target.value } : item))} />
        <button type="button" className="text-sm text-red-700" onClick={() => onChange(photos.filter((_, i) => i !== index))}>Αφαίρεση φωτογραφίας</button>
      </fieldset> : <figcaption className="text-sm"><strong>{photo.kind === 'repair' ? 'Αποκατάσταση' : 'Αναφορά'}</strong>{photo.caption && ` — ${photo.caption}`}</figcaption>}
    </figure>)}</div>
    {onChange && <label className="block text-sm">{busy ? 'Μεταφόρτωση…' : `Προσθήκη φωτογραφίας (${photos.length}/6)`}<input className="mt-2 block w-full" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={disabled || busy || photos.length >= 6} onChange={upload} /></label>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>;
}
