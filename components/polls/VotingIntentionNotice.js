'use client';

import Link from 'next/link';

export default function VotingIntentionNotice({ poll, user }) {
  if (poll?.purpose !== 'voting_intention') return null;
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 space-y-2">
      <p className="font-semibold">Πρόθεση ψήφου · Μία ψήφος ανά λογαριασμό</p>
      <details>
        <summary className="cursor-pointer font-medium">Πώς λειτουργεί</summary>
        <p className="mt-2">Η επιλογή σας δεν εμφανίζεται δημόσια με το όνομά σας. Μπορείτε να την αλλάξετε χωρίς να προστεθεί δεύτερη ψήφος.</p>
        <p className="mt-2 text-xs">Μπορείτε να συμμετάσχετε με επιβεβαιωμένο email, επαληθευμένο προφίλ ή συνδεδεμένο λογαριασμό Google. Ανοικτή διαδικτυακή ψηφοφορία συμμετοχής, όχι αντιπροσωπευτική δημοσκόπηση. Η πλατφόρμα αποθηκεύει ψήφους συνδεδεμένες με λογαριασμούς· η απόκρυψη ονόματος δεν αποτελεί μυστική ψηφοφορία.</p>
      </details>
      {!poll.votingIntentionEligible && (
        <Link className="inline-block font-semibold underline" href={user ? (user.emailVerified === false ? '#email-verification' : '/profile') : `/login?next=${encodeURIComponent(`/polls/${poll.id}`)}`}>
          {user ? (user.emailVerified === false ? 'Επιβεβαιώστε το email σας' : 'Ρυθμίσεις λογαριασμού') : 'Συνδεθείτε για να ψηφίσετε'}
        </Link>
      )}
    </div>
  );
}
