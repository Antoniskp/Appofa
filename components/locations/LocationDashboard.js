'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDaysIcon, UsersIcon, VideoCameraIcon, HandRaisedIcon, ChatBubbleLeftRightIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { calendarAPI } from '@/lib/api/calendar';

export default function LocationDashboard({ location, polls = [], usersCount = 0, sections = [], loading }) {
  const [agenda, setAgenda] = useState({ locationId: null, loading: true, entries: [], error: false });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    setAgenda({ locationId: location.id, loading: true, entries: [], error: false });
    const now = Date.now();
    calendarAPI.list({ locationId: location.id, view: 'public', period: 'upcoming', page: 1,
      start: new Date(now).toISOString(), end: new Date(now + 30 * 86400000).toISOString(),
    }).then(result => {
      if (result.success === false) throw new Error('Calendar unavailable');
      if (current) setAgenda({ locationId: location.id, loading: false, entries: result.data || [], error: false });
    }).catch(() => {
      if (current) setAgenda({ locationId: location.id, loading: false, entries: [], error: true });
    });
    return () => { current = false; };
  }, [location.id, retry]);

  const base = `/locations/${location.slug || location.id}`;
  const tabHref = tab => `${base}?tab=${tab}#location-content`;
  const votes = polls.filter(p => ['active', 'open'].includes(p.status)).length;
  const cameras = sections.filter(s => s.isPublished && s.type === 'webcams').reduce((total, s) => total + (s.content?.webcams?.length || 0), 0);
  const shortcuts = [
    { title: 'Ημερολόγιο', hint: 'Εκδηλώσεις και συναντήσεις', icon: CalendarDaysIcon, href: tabHref('events'), tone: 'bg-blue-50 text-blue-700' },
    { title: 'Ψηφοφορίες', hint: !loading && votes ? `${votes} ανοιχτές ψηφοφορίες` : 'Πάρε μέρος στις αποφάσεις', icon: HandRaisedIcon, href: tabHref('polls'), tone: 'bg-violet-50 text-violet-700' },
    { title: 'Ζητήματα & ιδέες', hint: 'Δες προτάσεις για την περιοχή', icon: ChatBubbleLeftRightIcon, href: tabHref('suggestions'), tone: 'bg-amber-50 text-amber-800' },
    { title: 'Κοινότητα', hint: !loading && usersCount ? `${usersCount} μέλη στην περιοχή` : 'Γνώρισε τους ανθρώπους της', icon: UsersIcon, href: tabHref('users'), tone: 'bg-emerald-50 text-emerald-700' },
    { title: 'Κάμερες', hint: !loading && cameras ? `${cameras} διαθέσιμες κάμερες` : 'Πρόσθεσε μια τοπική κάμερα', icon: VideoCameraIcon, href: cameras ? '#location-cameras' : `${base}/improve`, tone: 'bg-sky-50 text-sky-700' },
  ];
  const pending = agenda.loading || agenda.locationId !== location.id;
  const entries = agenda.entries.slice(0, 3);

  return <section aria-label="Η περιοχή με μια ματιά" className="mb-8 space-y-5">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {shortcuts.map(({ title, hint, icon: Icon, href, tone }) => <Link key={title} href={href} className="group rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
        <span className={`mb-4 inline-flex rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <h2 className="text-sm font-semibold text-gray-950">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-gray-500">{hint}</p>
      </Link>)}
    </div>
    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <div className="bg-blue-50/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Στην ατζέντα</p>
        <h2 className="mt-2 text-xl font-semibold text-gray-950">Τι έρχεται σύντομα</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">Οι επόμενες 30 ημέρες στην περιοχή.</p>
        <Link href={tabHref('events')} className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">Όλο το ημερολόγιο <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <div className="min-w-0 p-5">
        {pending ? <p role="status" className="py-6 text-sm text-gray-500">Φόρτωση εκδηλώσεων…</p> : agenda.error ? <div role="status" className="py-4 text-sm text-gray-600"><p>Το ημερολόγιο δεν είναι διαθέσιμο αυτή τη στιγμή.</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-3 min-h-11 font-semibold text-blue-700 hover:underline">Δοκίμασε ξανά</button></div> : entries.length ? <ul className="divide-y divide-gray-100">
          {entries.map(entry => <li key={entry.id}><Link href={entry.href} className="flex items-start gap-4 rounded-lg py-3 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
            <CalendarDaysIcon className="mt-1 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
            <div className="min-w-0"><p className="break-words text-sm font-semibold text-gray-900">{entry.title}</p><p className="mt-1 text-xs text-gray-500">{new Date(entry.start).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', ...(entry.allDay ? { timeZone: 'UTC' } : { timeZone: entry.timezone, hour: '2-digit', minute: '2-digit' }) })}{entry.status === 'cancelled' && ' · Ακυρώθηκε'}</p></div>
          </Link></li>)}
        </ul> : <div className="py-3"><h3 className="font-semibold text-gray-900">Η επόμενη συνάντηση μπορεί να ξεκινήσει από εσένα.</h3><p className="mt-2 text-sm leading-6 text-gray-600">Δεν υπάρχουν προγραμματισμένες εκδηλώσεις για τις επόμενες 30 ημέρες. Μοιράσου μια δράση, μια συνάντηση ή μια τοπική εκδήλωση.</p><Link href={`/events/new?locationId=${location.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 hover:underline">Πρότεινε εκδήλωση →</Link></div>}
      </div>
    </div>
  </section>;
}
