'use client';

import Link from 'next/link';
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  FlagIcon,
  HandRaisedIcon,
  LightBulbIcon,
  MapPinIcon,
  MegaphoneIcon,
  NewspaperIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

const signedInActions = (user) => [
  {
    title: 'Η περιοχή σου',
    description: user?.homeLocation
      ? 'Άνοιξε τον τοπικό πίνακα με ψηφοφορίες, προτάσεις, νέα και ρόλους.'
      : 'Διάλεξε περιοχή για να βλέπεις πιο σχετικό περιεχόμενο.',
    href: user?.homeLocation?.slug ? `/locations/${user.homeLocation.slug}` : '/locations',
    icon: MapPinIcon,
    tone: 'blue',
    label: user?.homeLocation ? 'Τοπικός πίνακας' : 'Βρες περιοχή',
  },
  {
    title: 'Ψήφισε τώρα',
    description: 'Δες ανοιχτές ψηφοφορίες και θέματα όπου μπορείς να συμμετέχεις άμεσα.',
    href: '/polls',
    icon: ClipboardDocumentListIcon,
    tone: 'emerald',
    label: 'Ψηφοφορίες',
  },
  {
    title: 'Πρότεινε λύση',
    description: 'Κατέθεσε μια ιδέα ή πρόβλημα για την κοινότητα που σε αφορά.',
    href: '/suggestions/new',
    icon: LightBulbIcon,
    tone: 'amber',
    label: 'Νέα πρόταση',
  },
];

const guestActions = [
  {
    title: 'Βρες την περιοχή σου',
    description: 'Ξεκίνα από δήμο, περιφέρεια ή χώρα και δες τι συμβαίνει εκεί.',
    href: '/locations',
    icon: MapPinIcon,
    tone: 'blue',
    label: 'Περιοχές',
  },
  {
    title: 'Ψήφισε χωρίς λογαριασμό',
    description: 'Δες μόνο ψηφοφορίες που είναι ανοιχτές σε επισκέπτες χωρίς εγγραφή.',
    href: '/polls?voteRestriction=anyone',
    icon: ClipboardDocumentListIcon,
    tone: 'emerald',
    label: 'Χωρίς εγγραφή',
  },
  {
    title: 'Δες προτάσεις πολιτών',
    description: 'Παρακολούθησε ιδέες, προβλήματα και λύσεις που ανοίγουν δημόσια.',
    href: '/suggestions',
    icon: ChatBubbleLeftRightIcon,
    tone: 'amber',
    label: 'Προτάσεις',
  },
];

const secondaryLinks = [
  { href: '/news', label: 'Ειδήσεις', icon: NewspaperIcon },
  { href: '/civic-questions', label: 'Θέματα Βουλής', icon: ClipboardDocumentListIcon },
  { href: '/organizations', label: 'Οργανισμοί', icon: ChatBubbleLeftRightIcon },
];

const civicPathActions = (user) => [
  {
    href: user ? '/profile' : '/register',
    title: user ? 'Ολοκλήρωσε προφίλ' : 'Εγγράψου',
    description: user
      ? 'Κράτησε ενημερωμένη την περιοχή και τη δημόσια παρουσία σου.'
      : 'Φτιάξε προφίλ και σύνδεσε την περιοχή σου.',
    icon: UserPlusIcon,
  },
  {
    href: '/independents',
    title: 'Βρες ανεξάρτητους',
    description: 'Δες ανεξάρτητους υποψηφίους και δημόσια πρόσωπα.',
    icon: UserGroupIcon,
  },
  {
    href: '/manifest-supporters',
    title: 'Στήριξε',
    description: 'Υποστήριξε όσους δεσμεύονται σε καθαρή συμμετοχή.',
    icon: HandRaisedIcon,
  },
  {
    href: '/candidates',
    title: 'Προώθησε',
    description: 'Μοιράσου και ανάδειξε υποψηφίους που εμπιστεύεσαι.',
    icon: MegaphoneIcon,
  },
  {
    href: '/suggestions/new',
    title: 'Πρότεινε λύσεις',
    description: 'Κατέθεσε ιδέες για την περιοχή που σε αφορά.',
    icon: LightBulbIcon,
  },
  {
    href: '/suggestions',
    title: 'Ανέφερε προβλήματα',
    description: 'Άνοιξε δημόσια θέματα και ψήφισε προτεραιότητες.',
    icon: FlagIcon,
  },
];

const toneClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:bg-indigo-100',
};

function ActionCard({ action }) {
  const Icon = action.icon;
  return (
    <Link
      href={action.href}
      className="group flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${toneClasses[action.tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
          {action.label}
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <h3 className="mt-4 text-base font-bold text-gray-900">{action.title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{action.description}</p>
    </Link>
  );
}

export default function HomeActionLanes({ user }) {
  const actions = user ? signedInActions(user) : guestActions;
  const pathActions = civicPathActions(user);

  return (
    <section className="border-t border-gray-200 bg-white">
      <div className="app-container py-12">
        <div className="mb-12 rounded-lg border border-slate-200 bg-slate-950 px-5 py-6 text-white shadow-sm sm:px-7 lg:px-8">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">
                Τι μπορείς να κάνεις
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight md:text-3xl">
                Βαρέθηκες τα κόμματα και τις κενές υποσχέσεις;
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Υπάρχει πιο πρακτικός τρόπος συμμετοχής: γράψου, βρες ανεξάρτητους
                υποψηφίους, στήριξέ τους, πρότεινε λύσεις για την περιοχή σου,
                ανέφερε προβλήματα και ψήφισε όσα έχουν σημασία.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pathActions.map(({ href, title, description, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-lg border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-cyan-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-100">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm font-semibold">
                      <span>{title}</span>
                      <ArrowRightIcon className="h-4 w-4 shrink-0 text-cyan-200 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-300">{description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Ξεκίνα από εδώ</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">Τρεις απλοί τρόποι συμμετοχής</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              {user
                ? 'Άνοιξε την περιοχή σου, ψήφισε σε ενεργά θέματα ή κατέθεσε μια πρόταση για την κοινότητα.'
                : 'Δεν χρειάζεται να μάθεις όλη την πλατφόρμα. Ξεκίνα με περιοχή, ψηφοφορίες ή προτάσεις.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Περισσότερες ενότητες">
            {secondaryLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Icon className="h-4 w-4 text-gray-500" />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {actions.map((action) => (
            <ActionCard key={action.href} action={action} />
          ))}
        </div>
      </div>
    </section>
  );
}
