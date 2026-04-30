import Link from 'next/link';
import {
  UserIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Υπευθυνότητες | Appofa',
  description:
    'Ποιος είναι υπεύθυνος για τι στην πλατφόρμα Appofa — ρόλοι, αποφάσεις, περιεχόμενο και ασφάλεια.',
  openGraph: {
    url: `${SITE_URL}/platform/responsibilities`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Υπευθυνότητες | Appofa',
    description:
      'Ποιος είναι υπεύθυνος για τι στην πλατφόρμα Appofa — ρόλοι, αποφάσεις, περιεχόμενο και ασφάλεια.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Υπευθυνότητες | Appofa',
    description:
      'Ποιος είναι υπεύθυνος για τι στην πλατφόρμα Appofa — ρόλοι, αποφάσεις, περιεχόμενο και ασφάλεια.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/responsibilities`,
  },
};

const roleResponsibilities = [
  {
    role: 'Viewer',
    emoji: '👤',
    Icon: UserIcon,
    color: 'gray',
    theme: {
      border: 'border-gray-200',
      bg: 'bg-gray-50',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-500',
      badge: 'bg-gray-100 text-gray-700',
      heading: 'text-gray-800',
    },
    owns: [
      'Ο δικός του λογαριασμός και προφίλ',
      'Ψήφους σε δημοσκοπήσεις',
      'Bookmarks',
    ],
    responsible: [
      'Σεβασμός κανόνων κοινότητας',
      'Μη κατάχρηση συστήματος ψηφοφορίας',
    ],
  },
  {
    role: 'Editor',
    emoji: '✍️',
    Icon: UserGroupIcon,
    color: 'indigo',
    theme: {
      border: 'border-indigo-200',
      bg: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      badge: 'bg-indigo-100 text-indigo-700',
      heading: 'text-indigo-900',
    },
    owns: [
      'Περιεχόμενο που δημιουργεί (άρθρα, ειδήσεις, δημοσκοπήσεις)',
      'Ακρίβεια και ποιότητα των δημοσιεύσεών του',
    ],
    responsible: [
      'Υποβολή αξιόπιστου περιεχομένου για έγκριση',
      'Ενημέρωση ή διαγραφή ανακριβούς υλικού',
      'Σεβασμός πνευματικών δικαιωμάτων',
    ],
  },
  {
    role: 'Moderator',
    emoji: '🛡️',
    Icon: WrenchScrewdriverIcon,
    color: 'teal',
    theme: {
      border: 'border-teal-200',
      bg: 'bg-teal-50',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      badge: 'bg-teal-100 text-teal-700',
      heading: 'text-teal-900',
    },
    owns: [
      'Ποιότητα περιεχομένου στη γεωγραφική του περιοχή',
      'Εγκρίσεις / απορρίψεις ειδήσεων',
      'Διαχείριση τοποθεσιών',
    ],
    responsible: [
      'Αμερόληπτη αξιολόγηση υποβολών',
      'Τήρηση editorial guidelines',
      'Αναφορά παραβιάσεων στον admin',
      'Ο ρόλος δεν μεταφέρεται — ισχύει μόνο για την ανατεθειμένη τοποθεσία',
    ],
  },
  {
    role: 'Admin',
    emoji: '⚙️',
    Icon: ShieldCheckIcon,
    color: 'purple',
    theme: {
      border: 'border-purple-200',
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-700',
      heading: 'text-purple-900',
    },
    owns: [
      'Αποφάσεις προϊόντος και πλατφόρμας',
      'Ασφάλεια και integrity της πλατφόρμας',
      'Διαχείριση χρηστών και ρόλων',
      'Εγκρίσεις organizations και επαληθεύσεις',
    ],
    responsible: [
      'Διατήρηση διαθεσιμότητας πλατφόρμας',
      'Αντίδραση σε security incidents',
      'Ενημέρωση platform docs όταν αλλάζουν κανόνες',
      'Εποπτεία moderators',
      'Τελικές αποφάσεις για περιεχόμενο',
    ],
  },
];

const domainMatrix = [
  { domain: 'Αποφάσεις προϊόντος',          viewer: '—', editor: '—', moderator: '—',            admin: 'Owner' },
  { domain: 'Ασφάλεια πλατφόρμας',           viewer: '—', editor: '—', moderator: '—',            admin: 'Owner' },
  { domain: 'Έγκριση ειδήσεων',              viewer: '—', editor: 'Υποβάλλει', moderator: 'Εγκρίνει', admin: 'Εγκρίνει' },
  { domain: 'Ποιότητα άρθρων',               viewer: '—', editor: 'Owner', moderator: 'Εποπτεύει', admin: 'Override' },
  { domain: 'Διαχείριση τοποθεσιών',         viewer: '—', editor: '—', moderator: 'Owner (τοπικά)', admin: 'Owner' },
  { domain: 'Διαχείριση χρηστών',            viewer: '—', editor: '—', moderator: '—',            admin: 'Owner' },
  { domain: 'Platform docs (αυτή η σελίδα)', viewer: 'Διαβάζει', editor: 'Διαβάζει', moderator: 'Διαβάζει', admin: 'Ενημερώνει' },
];

export default function ResponsibilitiesPage() {
  return (
    <StaticPageLayout
      title="Υπευθυνότητες"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Κάθε ρόλος στην πλατφόρμα Appofa έχει σαφείς υπευθυνότητες — τόσο ως προς το τι ελέγχει
        όσο και ως προς το τι φέρει. Εδώ ορίζουμε ποιος είναι υπεύθυνος για τι.
      </p>

      {/* Role Responsibility Cards */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">👥 Υπευθυνότητες ανά Ρόλο</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {roleResponsibilities.map(({ role, emoji, Icon, theme, owns, responsible }) => (
            <div
              key={role}
              className={`rounded-xl border ${theme.border} ${theme.bg} p-5 flex flex-col gap-4`}
            >
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-lg ${theme.iconBg}`}>
                  <Icon className={`h-6 w-6 ${theme.iconColor}`} aria-hidden="true" />
                </span>
                <p className={`font-bold text-lg ${theme.heading}`}>{emoji} {role}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Κατέχει / Ελέγχει</p>
                <ul className="space-y-1">
                  {owns.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-400 mt-0.5 flex-shrink-0">◆</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ευθύνεται για</p>
                <ul className="space-y-1">
                  {responsible.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Domain Matrix */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Πίνακας Αρμοδιοτήτων</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Τομέας</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Viewer</th>
                <th className="text-center px-4 py-3 font-semibold text-indigo-700">Editor</th>
                <th className="text-center px-4 py-3 font-semibold text-teal-700">Moderator</th>
                <th className="text-center px-4 py-3 font-semibold text-purple-700">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {domainMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-700 font-medium">{row.domain}</td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">{row.viewer}</td>
                  <td className="px-4 py-3 text-center text-indigo-700 text-xs font-medium">{row.editor}</td>
                  <td className="px-4 py-3 text-center text-teal-700 text-xs font-medium">{row.moderator}</td>
                  <td className="px-4 py-3 text-center text-purple-700 text-xs font-medium">{row.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Platform Docs Responsibility */}
      <section>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex items-start gap-3">
            <CodeBracketIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                📚 Ευθύνη Τεκμηρίωσης
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Οι σελίδες{' '}
                <code className="bg-blue-100 text-blue-800 px-1 rounded font-mono">/platform/*</code>{' '}
                είναι η κανονική πηγή αλήθειας τόσο για χρήστες όσο και για AI agents. Κάθε φορά
                που αλλάζουν ρόλοι, δικαιώματα, security controls, κανόνες ανάπτυξης ή governance
                αποφάσεις, ο admin ή ο developer που κάνει την αλλαγή <strong>πρέπει</strong> να
                ενημερώσει και τις αντίστοιχες platform σελίδες. Αυτό διασφαλίζει ότι η
                τεκμηρίωση παραμένει ακριβής και αξιόπιστη.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">🔗 Σχετικές Σελίδες</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/platform/roles', label: 'Ρόλοι & Δικαιώματα' },
            { href: '/platform/security', label: 'Ασφάλεια' },
            { href: '/platform/production-rules', label: 'Κανόνες Παραγωγής' },
            { href: '/become-moderator', label: 'Γίνε Moderator' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* AI Source of Truth Note */}
      <section>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5 flex gap-3">
          <InformationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Σημείωση συντήρησης:</strong> Αυτή η σελίδα αποτελεί τον κανονικό ορισμό
            αρμοδιοτήτων. Ενημερώνεται όταν προστεθούν νέοι ρόλοι, αλλάξουν υπευθυνότητες ή
            τροποποιηθεί η governance δομή της πλατφόρμας. Πηγή αλήθειας για AI agents που
            εργάζονται στον κώδικα: ο πίνακας{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">hooks/usePermissions.js</code>{' '}
            και{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">src/models/UserLocationRole.js</code>.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
}
