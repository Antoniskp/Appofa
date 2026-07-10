'use client';

import Link from 'next/link';
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  FlagIcon,
  HandRaisedIcon,
  LightBulbIcon,
  MapPinIcon,
  MegaphoneIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { saveReturnTo } from '@/lib/auth-redirect';

const signedInActions = (user) => [
  {
    title: 'Η περιοχή σου',
    description: user?.homeLocation
      ? 'Δες ψηφοφορίες, προτάσεις, νέα και ρόλους που αφορούν τον τόπο σου.'
      : 'Σύνδεσε την περιοχή σου για πιο σχετικές ψηφοφορίες, νέα και προτάσεις.',
    href: user?.homeLocation?.slug ? `/locations/${user.homeLocation.slug}` : '/locations',
    icon: MapPinIcon,
    tone: 'blue',
    label: user?.homeLocation ? 'Τοπικός πίνακας' : 'Βρες περιοχή',
  },
  {
    title: 'Πάρε θέση',
    description: 'Βρες ανοιχτές ψηφοφορίες και συμμετείχε στα θέματα που σε αφορούν.',
    href: '/polls',
    icon: ClipboardDocumentListIcon,
    tone: 'emerald',
    label: 'Ψηφοφορίες',
  },
  {
    title: 'Πρότεινε λύση',
    description: 'Κατέγραψε ένα πρόβλημα ή μια ιδέα και άνοιξέ τη στην κοινότητα.',
    href: '/suggestions/new',
    icon: LightBulbIcon,
    tone: 'amber',
    label: 'Νέα πρόταση',
  },
];

const guestActions = [
  {
    title: 'Βρες την περιοχή σου',
    description: 'Ξεκίνα από δήμο, περιφέρεια ή χώρα και δες τι συζητιέται εκεί πριν δημιουργήσεις προφίλ.',
    href: '/locations',
    icon: MapPinIcon,
    tone: 'blue',
    label: 'Περιοχές',
  },
  {
    title: 'Ψήφισε χωρίς εγγραφή',
    description: 'Πάρε μια πρώτη θέση σε ανοιχτές ψηφοφορίες και κράτησε ιστορικό όταν εγγραφείς.',
    href: '/polls?voteRestriction=anyone',
    icon: ClipboardDocumentListIcon,
    tone: 'emerald',
    label: 'Χωρίς εγγραφή',
  },
  {
    title: 'Δες προτάσεις πολιτών',
    description: 'Βρες ιδέες και προβλήματα που αξίζουν στήριξη, μετά φτιάξε προφίλ για να τα ακολουθείς.',
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
    title: user ? 'Συμπλήρωσε προφίλ' : 'Δημιούργησε προφίλ',
    description: user
      ? 'Κράτησε ενημερωμένη την περιοχή και τη δημόσια παρουσία σου.'
      : 'Σύνδεσε την περιοχή σου και ξεκίνα με πιο σχετικό περιεχόμενο.',
    icon: UserPlusIcon,
  },
  {
    href: '/polls/create',
    title: 'Άνοιξε ψηφοφορία',
    description: 'Ρώτησε την κοινότητα για θέματα που χρειάζονται καθαρή δημόσια γνώμη.',
    icon: ClipboardDocumentListIcon,
  },
  {
    href: '/independents',
    title: 'Δες ανεξάρτητους',
    description: 'Βρες ανεξάρτητους υποψηφίους και δημόσια πρόσωπα στην πλατφόρμα.',
    icon: UserGroupIcon,
  },
  {
    href: '/organizations',
    title: 'Κόμμα ή οργάνωση; Έλα μαζί μας',
    description: 'Δημιούργησε προφίλ οργανισμού, δημοσίευσε θέσεις και συμμετείχε στον δημόσιο διάλογο.',
    icon: BuildingOffice2Icon,
  },
  {
    href: '/manifest-supporters',
    title: 'Στήριξε δεσμεύσεις',
    description: 'Δες ποιοι αποδέχονται δημόσιες αρχές συμμετοχής και λογοδοσίας.',
    icon: HandRaisedIcon,
  },
  {
    href: '/candidates',
    title: 'Ανάδειξε πρόσωπα',
    description: 'Μοιράσου και πρότεινε υποψηφίους που εμπιστεύεσαι.',
    icon: MegaphoneIcon,
  },
  {
    href: '/become-moderator',
    title: 'Βοήθησε στη διαχείριση',
    description: 'Κράτησε τις συζητήσεις χρήσιμες, καθαρές και κοντά στα πραγματικά θέματα.',
    icon: ShieldCheckIcon,
  },
  {
    href: '/suggestions/new',
    title: 'Πρότεινε λύσεις',
    description: 'Κατέθεσε ιδέες που μπορούν να βελτιώσουν την περιοχή σου.',
    icon: LightBulbIcon,
  },
  {
    href: '/suggestions',
    title: 'Ανάδειξε προβλήματα',
    description: 'Δώσε ορατότητα σε δημόσια θέματα και ψήφισε προτεραιότητες.',
    icon: FlagIcon,
  },
];

const toneClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 group-hover:bg-amber-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 group-hover:bg-indigo-100',
};

const guestRegistrationBenefits = [
  'Αποθήκευση περιοχής και πιο σχετικές ενημερώσεις',
  'Παρακολούθηση ψηφοφοριών, προτάσεων και απαντήσεων',
  'Δημόσια παρουσία με σήματα συμμετοχής και αξιοπιστίας',
];

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

function GuestRegistrationBridge() {
  const handleAuthClick = () => saveReturnTo();

  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-5 text-gray-900 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Επόμενο βήμα
          </p>
          <h3 className="mt-1 text-lg font-bold leading-7">
            Δημιούργησε προφίλ όταν βρεις κάτι που σε αφορά.
          </h3>
          <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-3">
            {guestRegistrationBenefits.map((benefit) => (
              <div key={benefit} className="flex gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Link
            href="/register"
            onClick={handleAuthClick}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            Δημιουργία προφίλ
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            href="/newsletter"
            className="inline-flex items-center justify-center rounded-md border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            Ενημερώσεις email
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomeActionLanes({ user }) {
  const actions = user ? signedInActions(user) : guestActions;
  const pathActions = civicPathActions(user);

  return (
    <section className="border-t border-gray-200 bg-white">
      <div className="app-container py-12">
        <div className="mb-12 rounded-lg border border-blue-100 bg-blue-50 px-5 py-6 text-gray-900 shadow-sm sm:px-7 lg:px-8">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Τρόποι συμμετοχής
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight md:text-3xl">
                Βοήθησε να γίνει η κοινότητα πιο χρήσιμη.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-700">
                Ψήφισε σε ανοιχτές ψηφοφορίες, άνοιξε νέες ερωτήσεις, πρότεινε
                λύσεις, ανάδειξε ανθρώπους και βοήθησε στη διαχείριση ώστε οι
                δημόσιες συζητήσεις να μένουν καθαρές και πρακτικές.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pathActions.map(({ href, title, description, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group overflow-hidden rounded-lg border border-blue-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowRightIcon className="h-4 w-4 shrink-0 text-blue-600 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold leading-5 text-gray-900">{title}</h3>
                  <p className="mt-3 text-xs leading-5 text-gray-600">{description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Ξεκίνα εδώ</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">Τρεις απλές κινήσεις</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              {user
                ? 'Άνοιξε την περιοχή σου, ψήφισε σε ενεργά θέματα ή κατέθεσε μια πρόταση.'
                : 'Δεν χρειάζεται να μάθεις όλη την πλατφόρμα. Ξεκίνα με την περιοχή σου, μια ψηφοφορία ή μια πρόταση.'}
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
        {!user && <GuestRegistrationBridge />}
      </div>
    </section>
  );
}
