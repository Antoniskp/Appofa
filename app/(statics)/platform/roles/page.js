import Link from 'next/link';
import {
  ShieldCheckIcon,
  UserIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Ρόλοι & Δικαιώματα | Appofa',
  description:
    'Πλήρης οδηγός ρόλων χρηστών της πλατφόρμας Appofa — Viewer, Editor, Moderator και Admin με αναλυτικό πίνακα δικαιωμάτων.',
  openGraph: {
    url: `${SITE_URL}/platform/roles`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Ρόλοι & Δικαιώματα | Appofa',
    description:
      'Πλήρης οδηγός ρόλων χρηστών της πλατφόρμας Appofa — Viewer, Editor, Moderator και Admin με αναλυτικό πίνακα δικαιωμάτων.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ρόλοι & Δικαιώματα | Appofa',
    description:
      'Πλήρης οδηγός ρόλων χρηστών της πλατφόρμας Appofa — Viewer, Editor, Moderator και Admin με αναλυτικό πίνακα δικαιωμάτων.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/roles`,
  },
};

const tableRows = [
  { capability: 'Περιήγηση δημόσιου περιεχομένου', viewer: true,  editor: true,  moderator: true,  admin: true  },
  { capability: 'Ψηφοφορία σε δημοσκοπήσεις',      viewer: true,  editor: true,  moderator: true,  admin: true  },
  { capability: 'Αποθήκευση bookmarks',              viewer: true,  editor: true,  moderator: true,  admin: true  },
  { capability: 'Δημιουργία personal/articles',      viewer: false, editor: true,  moderator: false, admin: true  },
  { capability: 'Υποβολή news για έγκριση',          viewer: false, editor: true,  moderator: false, admin: true  },
  { capability: 'Δημιουργία δημοσκοπήσεων',         viewer: false, editor: true,  moderator: false, admin: true  },
  { capability: 'Διαχείριση ιδίου περιεχομένου',    viewer: false, editor: true,  moderator: false, admin: true  },
  { capability: 'Έγκριση / απόρριψη ειδήσεων',      viewer: false, editor: false, moderator: true,  admin: true  },
  { capability: 'Διαχείριση τοποθεσιών',            viewer: false, editor: false, moderator: true,  admin: true  },
  { capability: 'Πρόσβαση στο admin dashboard',      viewer: false, editor: false, moderator: true,  admin: true  },
  { capability: 'Επαλήθευση χρηστών (εντός scope)', viewer: false, editor: false, moderator: true,  admin: true  },
  { capability: 'Ανάθεση/αφαίρεση moderator (child scope)', viewer: false, editor: false, moderator: true, admin: true },
  { capability: 'Πλήρης διαχείριση χρηστών & ρόλων', viewer: false, editor: false, moderator: false, admin: true  },
  { capability: 'Πλήρης έλεγχος πλατφόρμας',       viewer: false, editor: false, moderator: false, admin: true  },
];

const roleCards = [
  {
    role: 'Viewer',
    subtitle: 'Εγγεγραμμένος χρήστης',
    emoji: '👤',
    Icon: UserIcon,
    theme: {
      border: 'border-gray-200',
      bg: 'bg-gray-50',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-500',
      badge: 'bg-gray-100 text-gray-700',
      title: 'text-gray-800',
    },
    permissions: [
      'Περιήγηση & ανάγνωση όλου του δημόσιου περιεχομένου',
      'Ψηφοφορία σε δημοσκοπήσεις',
      'Αποθήκευση bookmarks',
      'Σχολιασμός (εφόσον ενεργοποιηθεί)',
    ],
  },
  {
    role: 'Editor',
    subtitle: 'Δημιουργός περιεχομένου',
    emoji: '✍️',
    Icon: UserGroupIcon,
    theme: {
      border: 'border-indigo-200',
      bg: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      badge: 'bg-indigo-100 text-indigo-700',
      title: 'text-indigo-900',
    },
    permissions: [
      'Όλα τα δικαιώματα του Viewer',
      'Δημιουργία personal & educational άρθρων',
      'Υποβολή ειδήσεων για έγκριση από admin/moderator',
      'Δημιουργία & διαχείριση δημοσκοπήσεων',
      'Επεξεργασία / διαγραφή ιδίου περιεχομένου',
    ],
  },
  {
    role: 'Moderator',
    subtitle: 'Συντονιστής περιοχής',
    emoji: '🛡️',
    Icon: WrenchScrewdriverIcon,
    theme: {
      border: 'border-teal-200',
      bg: 'bg-teal-50',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      badge: 'bg-teal-100 text-teal-700',
      title: 'text-teal-900',
    },
    permissions: [
      'Όλα τα δικαιώματα του Viewer',
      'Έγκριση / απόρριψη ειδήσεων',
      'Διαχείριση τοποθεσιών',
      'Πρόσβαση στο admin dashboard (περιορισμένη)',
      'Επαλήθευση χρηστών εντός διαχειρίσιμου scope',
      'Ανάθεση/ανάκληση moderator μόνο σε child τοποθεσίες',
      'Ο ρόλος ανατίθεται ανά τοποθεσία (UserLocationRole)',
    ],
  },
  {
    role: 'Admin',
    subtitle: 'Διαχειριστής πλατφόρμας',
    emoji: '⚙️',
    Icon: ShieldCheckIcon,
    theme: {
      border: 'border-purple-200',
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700',
      title: 'text-purple-900',
    },
    permissions: [
      'Πλήρη δικαιώματα σε όλες τις λειτουργίες',
      'Διαχείριση χρηστών, ρόλων & επαληθεύσεων',
      'Έγκριση / απόρριψη ειδήσεων',
      'Διαχείριση τοποθεσιών, organizations & περιεχομένου',
      'Πρόσβαση στο πλήρες admin dashboard',
      'Διαχείριση geo-κανόνων & ασφάλειας',
    ],
  },
];

function Check() {
  return <span className="text-green-600 font-bold text-base">✅</span>;
}
function Cross() {
  return <span className="text-red-400 text-base">—</span>;
}

export default function RolesPage() {
  return (
    <StaticPageLayout
      title="Ρόλοι & Δικαιώματα"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Η πλατφόρμα Appofa διαθέτει <strong>4 ρόλους χρηστών</strong>: Viewer, Editor, Moderator
        και Admin. Κάθε ρόλος έχει συγκεκριμένα δικαιώματα που ελέγχουν την πρόσβαση στις
        λειτουργίες της πλατφόρμας.
      </p>

      {/* Comparison Table */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Πίνακας Δικαιωμάτων</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Δυνατότητα</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Viewer</th>
                <th className="text-center px-4 py-3 font-semibold text-indigo-700">Editor</th>
                <th className="text-center px-4 py-3 font-semibold text-teal-700">Moderator</th>
                <th className="text-center px-4 py-3 font-semibold text-purple-700">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {tableRows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700">{row.capability}</td>
                  <td className="px-4 py-3 text-center">{row.viewer    ? <Check /> : <Cross />}</td>
                  <td className="px-4 py-3 text-center">{row.editor    ? <Check /> : <Cross />}</td>
                  <td className="px-4 py-3 text-center">{row.moderator ? <Check /> : <Cross />}</td>
                  <td className="px-4 py-3 text-center">{row.admin     ? <Check /> : <Cross />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Role Cards */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">👥 Ανάλυση Ρόλων</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleCards.map(({ role, subtitle, emoji, Icon, theme, permissions }) => (
            <div
              key={role}
              className={`rounded-xl border ${theme.border} ${theme.bg} p-5 flex flex-col gap-4`}
            >
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-lg ${theme.iconBg}`}>
                  <Icon className={`h-6 w-6 ${theme.iconColor}`} aria-hidden="true" />
                </span>
                <div>
                  <p className={`font-bold ${theme.title}`}>{emoji} {role}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${theme.badge}`}>
                    {subtitle}
                  </span>
                </div>
              </div>
              <ul className="space-y-1.5">
                {permissions.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Moderator Location Scope */}
      <section>
        <div className="rounded-xl border border-teal-100 bg-teal-50 p-6">
          <h2 className="text-lg font-semibold text-teal-900 mb-2">
            🗺️ Εύρος Εξουσίας Moderator
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Ο ρόλος <strong>Moderator</strong> ανατίθεται ανά τοποθεσία μέσω του πίνακα{' '}
            <code className="bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded text-xs font-mono">UserLocationRole</code>.
            Κάθε moderator έχει εξουσία ακριβώς στην τοποθεσία για την οποία ανατέθηκε — δεν
            κληρονομεί δικαιώματα σε παιδικές τοποθεσίες. Η ανάθεση γίνεται μόνο αν η τοποθεσία
            είναι πρόγονος ή ίδια με το{' '}
            <code className="bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded text-xs font-mono">homeLocationId</code>{' '}
            του χρήστη.
          </p>
        </div>
      </section>

      {/* Security Note */}
      <section>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            🔒 Ασφάλεια & Προστασία Διαδρομών
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Κάθε απόπειρα πρόσβασης σε προστατευμένη διαδρομή χωρίς τα κατάλληλα δικαιώματα
            ανακατευθύνεται αυτόματα στη σελίδα σύνδεσης. Η αυθεντικοποίηση βασίζεται σε JWT
            αποθηκευμένο σε{' '}
            <code className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-mono">HttpOnly</code>{' '}
            cookie. Για περισσότερες πληροφορίες ασφάλειας δείτε τη σελίδα{' '}
            <Link href="/platform/security" className="text-blue-700 underline hover:text-blue-900">
              Ασφάλεια Πλατφόρμας
            </Link>.
          </p>
        </div>
      </section>

      {/* AI Source of Truth Note */}
      <section>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 flex gap-3">
          <InformationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Σημείωση συντήρησης:</strong> Αυτή η σελίδα αποτελεί την κανονική πηγή αλήθειας
            για ρόλους και δικαιώματα — τόσο για χρήστες όσο και για AI agents που εργάζονται στον
            κώδικα. Όταν αλλάζουν ρόλοι, δικαιώματα ή η λογική{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">hooks/usePermissions.js</code>{' '}
            και{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">src/middleware/checkRole.js</code>,
            αυτή η σελίδα πρέπει να ενημερωθεί αντίστοιχα.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
}
