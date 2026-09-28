'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { pollAPI } from '@/lib/api';

export default function VotingIntentionOnboarding() {
  const [poll, setPoll] = useState(null);
  useEffect(() => {
    let active = true;
    pollAPI.getVotingIntention().then(response => {
      if (active && response.success) setPoll(response.data);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!poll || poll.userVote) return null;
  return (
    <aside className="mb-6 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-gray-900">Πρόθεση ψήφου</h2>
      <p className="mt-2 text-sm text-gray-600">Αν είχαμε σήμερα βουλευτικές εκλογές, ποιο κόμμα θα ψηφίζατε;</p>
      <p className="mt-2 text-xs text-gray-500">Προαιρετική συμμετοχή με Google. Η επιλογή σας δεν εμφανίζεται δημόσια με το όνομά σας και δεν επηρεάζει την ολοκλήρωση της εγγραφής σας.</p>
      <Link href={`/polls/${poll.id}`} className="mt-3 inline-block font-semibold text-blue-700 underline">Δείτε την ψηφοφορία</Link>
    </aside>
  );
}
