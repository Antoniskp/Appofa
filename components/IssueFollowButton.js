'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { issueFollowAPI } from '@/lib/api/issueFollows';

export default function IssueFollowButton({ entityType, entityId, onChanged }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    if (user) issueFollowAPI.status(entityType, entityId).then(result => {
      if (active) { setFollowing(result.data.following); setBusy(false); }
    }).catch(() => { if (active) { setError('Δεν ήταν δυνατή η φόρτωση. Δοκίμασε ξανά ανοίγοντας τη σελίδα.'); setBusy(false); } });
    return () => { active = false; };
  }, [user, entityType, entityId]);
  async function toggle() {
    setBusy(true);
    try {
      const result = await issueFollowAPI.set(entityType, entityId, !following);
      setFollowing(result.data.following);
      setError('');
      onChanged?.(result.data.following);
    } catch { setError('Η αλλαγή δεν αποθηκεύτηκε. Δοκίμασε ξανά.'); }
    finally { setBusy(false); }
  }
  if (!user) return <Link href={`/login?next=${encodeURIComponent(`/${entityType === 'poll' ? 'polls' : 'suggestions'}/${entityId}`)}`} className="inline-flex min-h-11 items-center font-semibold text-teal-800 underline">Συνδέσου για να ακολουθήσεις το θέμα</Link>;
  return <div>
    <button type="button" aria-pressed={following} disabled={busy} onClick={toggle} className="min-h-11 rounded-lg border border-teal-700 bg-white px-4 py-2 font-semibold text-teal-800 disabled:opacity-50">{busy ? 'Φόρτωση…' : following ? 'Ακολουθείς το θέμα · Διακοπή' : 'Ακολούθησε το θέμα'}</button>
    <p className="mt-2 text-sm text-gray-600">Οι εξελίξεις συγκεντρώνονται στα <Link href="/following" className="underline">θέματα που ακολουθείς</Link>. Δεν ενεργοποιούνται email ή ειδοποιήσεις push.</p>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </div>;
}
