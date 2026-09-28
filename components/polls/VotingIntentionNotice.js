'use client';

import Link from 'next/link';

export default function VotingIntentionNotice({ poll, user }) {
  if (poll?.purpose !== 'voting_intention') return null;
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 space-y-2">
      <p className="font-semibold">Πρόθεση ψήφου · Μία ψήφος ανά λογαριασμό Google</p>
      <p>Η επιλογή σας δεν εμφανίζεται δημόσια με το όνομά σας. Μπορείτε να την αλλάξετε χωρίς να προστεθεί δεύτερη ψήφος.</p>
      <p className="text-xs">Η Google επιβεβαιώνει τον λογαριασμό, όχι μοναδικό φυσικό πρόσωπο. Ανοικτή διαδικτυακή ψηφοφορία συμμετοχής, όχι αντιπροσωπευτική δημοσκόπηση.</p>
      {!poll.googleVotingEligible && (
        <Link className="inline-block font-semibold underline" href={user ? '/profile' : `/login?next=${encodeURIComponent(`/polls/${poll.id}`)}`}>
          {user ? 'Σύνδεση Google από το προφίλ σας' : 'Συνδεθείτε με Google για να ψηφίσετε'}
        </Link>
      )}
    </div>
  );
}
