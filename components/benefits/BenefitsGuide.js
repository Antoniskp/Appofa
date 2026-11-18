'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDaysIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { benefits, groups, checkedOn } from '@/lib/benefits/catalog';
import { eventToICalendar } from '@/lib/calendar/ical';

const formatDate = value => new Date(`${value}T12:00:00Z`).toLocaleDateString('el-GR', { dateStyle: 'long', timeZone: 'UTC' });
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('el').replaceAll('ς', 'σ');
const kinds = { cash: 'Χρηματική παροχή', voucher: 'Voucher / ψηφιακή κάρτα', service: 'Έκπτωση / υπηρεσία' };

function downloadReminder(item, date, occurrence) {
  const start = `${date}T00:00:00.000Z`;
  const content = eventToICalendar({
    id: `${item.id}-${occurrence?.id || `reminder-${date}`}`, source: 'benefit', revision: 0,
    title: occurrence?.label || `Προσωπική υπενθύμιση — ${item.title}`,
    description: `${occurrence ? 'Επίσημη ημερομηνία' : 'Ημερομηνία που επέλεξες εσύ, όχι επίσημη προθεσμία'}.\n${item.timing}\n${occurrence?.sourceUrl || item.sources[0].url}`,
    venue: '', status: 'published', allDay: true, start,
    end: new Date(Date.parse(start) + 86400000).toISOString(),
  });
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `benefit-${item.id}-${date}.ics`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function BenefitCard({ item }) {
  const [reminderDate, setReminderDate] = useState('');
  return <article id={item.id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-brand-border bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
      <span className="rounded-full bg-ivory px-3 py-1">{groups[item.group]}</span>
      <span>{kinds[item.kind]}</span><span aria-hidden="true">·</span><span>{item.agency}</span>
    </div>
    <h3 className="mt-3 text-xl font-semibold text-blue-900"><a href={`#${item.id}`} className="hover:underline">{item.title}</a></h3>
    <p className="mt-2 font-medium text-gray-800">{item.amount}</p>
    <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm leading-relaxed text-blue-900">{item.timing}</p>
    <details id={`details-${item.id}`} className="mt-4">
      <summary className="cursor-pointer py-2 font-semibold text-blue-800">Δικαιούχοι, δικαιολογητικά & αίτηση</summary>
      <div className="mt-3 space-y-5 text-sm leading-relaxed text-gray-700">
        <div><h4 className="font-semibold text-gray-900">Ποιοι δικαιούνται</h4><ul className="mt-2 list-disc space-y-2 pl-5">{item.eligibility.map(text => <li key={text}>{text}</li>)}</ul></div>
        <div><h4 className="font-semibold text-gray-900">Πώς γίνεται η αίτηση</h4><p className="mt-2">{item.application}</p></div>
        <div><h4 className="font-semibold text-gray-900">Τι θα χρειαστείτε</h4><ul className="mt-2 list-disc space-y-2 pl-5">{item.documents.map(text => <li key={text}>{text}</li>)}</ul></div>
        <p>Η αρμόδια υπηρεσία ελέγχει όλες τις προϋποθέσεις, τα εξαιρούμενα εισοδήματα και τη δυνατότητα συνδυασμού με άλλες παροχές.</p>
      </div>
    </details>
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 border-t border-brand-border pt-4">
      {item.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">{source.label}<ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0" aria-hidden="true" /></a>)}
    </div>
    <details className="mt-4 rounded-lg bg-ivory p-3 text-sm">
      <summary className="cursor-pointer font-medium text-blue-900">Προσθήκη στο προσωπικό ημερολόγιο (.ics)</summary>
      <div className="mt-3 space-y-3">
        {item.dates.map(occurrence => <button key={occurrence.id} onClick={() => downloadReminder(item, occurrence.date, occurrence)} className="block text-left text-blue-700 underline">{formatDate(occurrence.date)} — {occurrence.label}</button>)}
        <p className="text-gray-600">Επίλεξε δική σου ημέρα για έλεγχο αίτησης ή ανανέωση. Αυτή η υπενθύμιση δεν αποτελεί επίσημη προθεσμία. Το αρχείο εισάγεται σε Google Calendar, Apple Calendar ή Outlook.</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0">Ημερομηνία υπενθύμισης για {item.title}<input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} className="mt-1 block max-w-full rounded-lg border border-gray-300 bg-white p-2" /></label>
          <button disabled={!/^\d{4}-\d{2}-\d{2}$/.test(reminderDate)} onClick={() => downloadReminder(item, reminderDate)} className="rounded-lg bg-blue-800 px-4 py-2 text-white disabled:opacity-40">Λήψη υπενθύμισης</button>
        </div>
      </div>
    </details>
    <p className="mt-3 text-xs text-gray-500">Έλεγχος πηγών: {formatDate(item.checkedOn)}</p>
  </article>;
}

export default function BenefitsGuide() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  const [kind, setKind] = useState('');
  useEffect(() => {
    const reveal = () => {
      const id = window.location.hash.slice(1);
      if (!benefits.some(item => item.id === id)) return;
      setQuery(''); setGroup(''); setKind('');
      requestAnimationFrame(() => {
        const details = document.getElementById(`details-${id}`);
        if (details) details.open = true;
        document.getElementById(id)?.scrollIntoView({ block: 'start' });
      });
    };
    reveal(); window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, []);
  const filtered = benefits.filter(item => (!group || item.group === group) && (!kind || item.kind === kind)
    && normalize([item.title, item.agency, item.amount, groups[item.group], ...item.eligibility].join(' ')).includes(normalize(query.trim())));
  return <div className="space-y-8">
    <div className="space-y-4">
      <p className="text-lg leading-relaxed text-gray-700">Βρες την παροχή που σε αφορά, ποιοι μπορούν να την αιτηθούν και τι χρειάζεται για το επόμενο βήμα.</p>
      <div className="flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-blue-50 px-3 py-1 text-blue-900">{benefits.length} παροχές</span><span className="rounded-full bg-ivory px-3 py-1">{Object.keys(groups).length} κατηγορίες</span><span className="py-1 text-gray-500">Έλεγχος πηγών: {formatDate(checkedOn)}</span></div>
      <p className="text-sm leading-relaxed text-gray-600">Ο κατάλογος καλύπτει βασικές εθνικές χρηματικές παροχές, αναπηρικά προγράμματα και συναφή vouchers. Ειδικά επαγγελματικά βοηθήματα, τοπικές ενισχύσεις και έκτακτες προσκλήσεις ελέγχονται επιπλέον στα επίσημα μητρώα παρακάτω. Οι όροι και οι ημερομηνίες ενημερώνονται όταν αλλάζει το επίσημο πλαίσιο· δεν ελέγχονται αυτόματα σε πραγματικό χρόνο.</p>
    </div>
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <div className="flex items-start gap-3"><CalendarDaysIcon className="mt-1 h-6 w-6 shrink-0 text-blue-800" aria-hidden="true" /><div>
        <h2 className="text-xl font-semibold text-blue-900">Οι προθεσμίες στο ημερολόγιο</h2>
        <p className="mt-2 text-sm leading-relaxed text-blue-900">Οι επιβεβαιωμένες ημερομηνίες εμφανίζονται και στο κοινό ημερολόγιο. Για γέννηση, απώλεια εργασίας, ανανέωση ή παροχή χωρίς κοινή λήξη, πρόσθεσε προσωπική υπενθύμιση από την αντίστοιχη κάρτα.</p>
        <Link href="/calendar?category=benefits" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white">Άνοιγμα ημερολογίου επιδομάτων →</Link>
      </div></div>
    </section>
    <section aria-label="Αναζήτηση επιδομάτων" className="space-y-4 rounded-2xl border border-brand-border bg-ivory p-4 sm:p-5">
      <label className="block text-sm font-semibold" htmlFor="benefit-search">Αναζήτηση επιδόματος ή δικαιούχου</label>
      <div className="relative"><MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" aria-hidden="true" /><input id="benefit-search" type="search" placeholder="π.χ. ενοίκιο, παιδί, άνεργοι, αναπηρία" value={query} onChange={e => setQuery(e.target.value)} className="min-h-11 w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm" /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="benefit-group" className="text-sm">Κατηγορία</label><select id="benefit-group" value={group} onChange={e => setGroup(e.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white p-2"><option value="">Όλες οι κατηγορίες</option>{Object.entries(groups).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
        <div><label htmlFor="benefit-kind" className="text-sm">Είδος παροχής</label><select id="benefit-kind" value={kind} onChange={e => setKind(e.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white p-2"><option value="">Όλα τα είδη</option>{Object.entries(kinds).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p role="status">{filtered.length} από {benefits.length} παροχές</p>{(query || group || kind) && <button onClick={() => { setQuery(''); setGroup(''); setKind(''); }} className="text-blue-700 underline">Καθαρισμός φίλτρων</button>}</div>
    </section>
    <section aria-label="Κατάλογος επιδομάτων" className="space-y-5">
      {filtered.length ? filtered.map(item => <BenefitCard key={item.id} item={item} />) : <p className="rounded-xl border p-6 text-gray-600">Δεν βρέθηκε παροχή. Δοκίμασε άλλη λέξη ή καθάρισε τα φίλτρα.</p>}
    </section>
    <section className="space-y-3 border-t border-brand-border pt-6 text-sm leading-relaxed text-gray-700">
      <h2 className="text-xl font-semibold text-gray-900">Πλήρη επίσημα μητρώα & ειδικές περιπτώσεις</h2>
      <p>Για ειδικό κλάδο εργασίας, τοπική ενίσχυση, πρόσθετη παροχή αναπηρίας ή έκτακτο πρόγραμμα, αναζήτησε και στις αρμόδιες υπηρεσίες. Το Κέντρο Κοινότητας του Δήμου ή ένα ΚΕΠ μπορεί να βοηθήσει στον έλεγχο δικαιολογητικών.</p>
      <ul className="list-disc space-y-2 pl-5">
        <li><a className="text-blue-700 underline" href="https://www.gov.gr/ipiresies/ugeia-kai-pronoia/epidomata">gov.gr — υπηρεσίες επιδομάτων</a></li>
        <li><a className="text-blue-700 underline" href="https://mitos.gov.gr/index.php/Κατηγορία:Επιδόματα_πολιτών">Μίτος — διαδικασίες επιδομάτων πολιτών</a></li>
        <li><a className="text-blue-700 underline" href="https://paroxes.epan.gov.gr/">Εθνική Πύλη Αναπηρίας — μητρώο παροχών και δικαιωμάτων</a></li>
        <li><a className="text-blue-700 underline" href="https://oikogeneia.gov.gr/">Πύλη Οικογενειακής Πολιτικής</a></li>
      </ul>
    </section>
  </div>;
}
