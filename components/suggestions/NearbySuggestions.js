'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { suggestionAPI } from '@/lib/api';

export default function NearbySuggestions({ lat, lng, excludeId }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const hasPin = lat !== null && lat !== undefined && lat !== '' && lng !== null && lng !== undefined && lng !== '';
  useEffect(() => {
    setResult(null);
    setError(false);
    if (!hasPin) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await suggestionAPI.getNearby({ lat, lng, excludeId });
        if (!response.success) throw new Error();
        if (active) setResult(response.data);
      } catch { if (active) setError(true); }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [lat, lng, excludeId, hasPin, retry]);
  if (!hasPin) return null;
  return <aside className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm" aria-live="polite">
    <h3 className="font-semibold">Υπάρχει ήδη αναφορά κοντά στο σημείο;</h3>
    {error ? <p>Ο έλεγχος δεν ήταν διαθέσιμος. <button type="button" className="underline" onClick={() => setRetry(value => value + 1)}>Δοκιμή ξανά</button></p>
      : !result ? <p>Έλεγχος κοντινών αναφορών…</p>
        : result.length ? <><p>Δείτε τις ανοιχτές αναφορές σε απόσταση 200 μ. πριν δημοσιεύσετε νέα.</p><ul className="mt-2 space-y-2">{result.map(item => <li key={item.id}><Link href={`/suggestions/${item.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline">{item.title} ↗</Link> · {item.distance} μ.</li>)}</ul></>
          : <p>Δεν βρέθηκαν ανοιχτές δημόσιες αναφορές σε απόσταση 200 μ.</p>}
  </aside>;
}
