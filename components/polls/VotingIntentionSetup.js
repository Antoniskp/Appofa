'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { organizationAPI, pollAPI } from '@/lib/api';
import partiesConfig from '@/config/politicalParties.json';

export default function VotingIntentionSetup({ onCreated }) {
  const [parties, setParties] = useState([]);
  const [selected, setSelected] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const all = [];
        let page = 1;
        let totalPages = 1;
        do {
          const response = await organizationAPI.getAll({ type: 'party', page, limit: 100 });
          if (!response.success) throw new Error('Αποτυχία φόρτωσης κομμάτων.');
          all.push(...(response.organizations || []));
          totalPages = response.pagination?.totalPages || 1;
          page += 1;
        } while (page <= totalPages);
        const available = all.filter(party => party.isPublic);
        if (active) {
          setParties(available);
          setSelected(available.filter(party => partiesConfig.parties.some(config => config.active && config.id === party.slug)).map(party => party.id));
        }
      } catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);
  const create = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await pollAPI.createVotingIntention({ partyIds: selected, deadline: deadline ? new Date(deadline).toISOString() : null });
      if (!response.success) throw new Error(response.message);
      setCreatedId(response.data.id);
      onCreated(response.data.id);
    } catch (err) { setError(err.message || 'Αποτυχία δημιουργίας.'); }
    finally { setSaving(false); }
  };
  return (
    <section className="rounded-xl border border-blue-200 bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold">Νέα ψηφοφορία πρόθεσης ψήφου</h2>
      <p className="text-sm text-gray-600">Επιλέξτε τα κόμματα από τις υπάρχουσες οργανώσεις. Η νέα ψηφοφορία θα εμφανιστεί στην αρχική σελίδα και προαιρετικά στην εισαγωγή νέων μελών.</p>
      <Link href="/admin/organizations" className="inline-block text-sm text-blue-700 underline">Διαχείριση κομμάτων</Link>
      <fieldset disabled={saving || loading || Boolean(createdId)} className="space-y-2">
        <legend className="font-medium">Κόμματα στο ψηφοδέλτιο</legend>
        {loading && <p role="status">Φόρτωση κομμάτων...</p>}
        {!loading && !parties.length && <p>Δεν βρέθηκαν δημόσιες οργανώσεις τύπου κόμματος.</p>}
        {parties.map(party => (
          <label key={party.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.includes(party.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, party.id] : ids.filter(id => id !== party.id))} />
            {party.name}
          </label>
        ))}
        <label className="block pt-3 text-sm">Λήξη (προαιρετική)
          <input type="datetime-local" value={deadline} onChange={event => setDeadline(event.target.value)} className="mt-1 block rounded border p-2" />
        </label>
      </fieldset>
      <p className="text-xs text-gray-600">Προστίθενται: Άλλο κόμμα, Δεν έχω αποφασίσει, Λευκό / Άκυρο, Αποχή. Μία ψήφος ανά λογαριασμό Google, χωρίς δημόσια ονόματα ψηφοφόρων. Τα κόμματα δεν αλλάζουν μετά την πρώτη ψήφο.</p>
      <p className="text-xs text-gray-600">Η δημιουργία αντικαθιστά την προβεβλημένη ψηφοφορία της αρχικής. Οι προηγούμενες ψηφοφορίες παραμένουν διαθέσιμες.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {createdId ? <Link href={`/polls/${createdId}`} className="text-blue-700 underline">Η ψηφοφορία δημιουργήθηκε — Προβολή</Link> : (
        <button type="button" onClick={create} disabled={saving || loading || selected.length < 2} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? 'Δημιουργία...' : 'Δημιουργία και προβολή στην αρχική'}
        </button>
      )}
    </section>
  );
}
