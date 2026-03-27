import Link from 'next/link';
import { ShieldCheckIcon, UserIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Ρόλοι Χρηστών | Appofa',
  description:
    'Μάθετε για τους ρόλους χρηστών της πλατφόρμας Appofa — Επισκέπτης, Editor και Admin.',
  openGraph: {
    url: `${SITE_URL}/platform/roles`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Ρόλοι Χρηστών | Appofa',
    description:
      'Μάθετε για τους ρόλους χρηστών της πλατφόρμας Appofa — Επισκέπτης, Editor και Admin.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ρόλοι Χρηστών | Appofa',
    description:
      'Μάθετε για τους ρόλους χρηστών της πλατφόρμας Appofa — Επισκέπτης, Editor και Admin.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/roles`,
  },
};

const tableRows = [
  { capability: 'Περιήγηση δημόσιου περιεχομένου', viewer: true, editor: true, admin: true },
  { capability: 'Ψηφοφορία σε δημοσκοπήσεις', viewer: true, editor: true, admin: true },
  { capability: 'Δημιουργία personal/articles', viewer: false, editor: true, admin: true },
  { capability: 'Υποβολή news για έγκριση', viewer: false, editor: true, admin: true },
  { capability: 'Δημιουργία δημοσκοπήσεων', viewer: false, editor: true, admin: true },
  { capability: 'Διαχείριση ιδίου περιεχομένου', viewer: false, editor: true, admin: true },
  { capability: 'Έγκριση/Απόρριψη ειδήσεων', viewer: false, editor: false, admin: true },
  { capability: 'Διαχείριση χρηστών', viewer: false, editor: false, admin: true },
  { capability: 'Διαχείριση τοποθεσιών', viewer: false, editor: false, admin: true },
  { capability: 'Πρόσβαση στο admin dashboard', viewer: false, editor: false, admin: true },
];

const roleCards = [
  {
    role: 'Επισκέπτης / Viewer',
    subtitle: 'Βασική πρόσβαση',
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
      'Περιήγηση δημόσιου περιεχομένου',
      'Ανάγνωση ειδήσεων και άρθρων',
      'Ψηφοφορία σε δημοσκοπήσεις',
      'Προβολή αποτελεσμάτων ψηφοφορίας',
    ],
  },
  {
    role: 'Editor',
    subtitle: 'Δημιουργός περιεχομένου',
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
      'Όλες οι δυνατότητες του Viewer',
      'Δημιουργία personal & educational άρθρων',
      'Υποβολή ειδήσεων για έγκριση',
      'Δημιουργία δημοσκοπήσεων',
      'Διαχείριση ιδίου περιεχομένου',
      'Αποθήκευση bookmarks',
    ],
  },
  {
    role: 'Admin',
    subtitle: 'Πλήρης πρόσβαση',
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
      'Όλες οι δυνατότητες του Editor',
      'Έγκριση ή απόρριψη ειδήσεων',
      'Διαχείριση χρηστών & ρόλων',
      'Διαχείριση τοποθεσιών',
      'Πρόσβαση στο admin dashboard',
      'Πλήρης έλεγχος πλατφόρμας',
    ],
  },
];

function Check() {
  return <span className="text-green-600 font-bold text-base">✅</span>;
}
function Cross() {
  return <span className="text-red-400 font-bold text-base">❌</span>;
}

export default function RolesPage() {
  return (
    <StaticPageLayout
      title="Ρόλοι Χρηστών"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Η πλατφόρμα Appofa διαθέτει <strong>3 ρόλους χρηστών</strong>: Επισκέπτης (Viewer), Editor
        και Admin. Κάθε ρόλος έχει συγκεκριμένα δικαιώματα που ελέγχουν την πρόσβαση στις
        λειτουργίες της πλατφόρμας.
      </p>

      {/* Comparison Table */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Πίνακας Δικαιωμάτων</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Δυνατότητα</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Επισκέπτης</th>
                <th className="text-center px-5 py-3 font-semibold text-indigo-700">Editor</th>
                <th className="text-center px-5 py-3 font-semibold text-purple-700">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {tableRows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-700">{row.capability}</td>
                  <td className="px-5 py-3 text-center">
                    {row.viewer ? <Check /> : <Cross />}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {row.editor ? <Check /> : <Cross />}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {row.admin ? <Check /> : <Cross />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Role Cards */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ανάλυση Ρόλων</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {roleCards.map(({ role, subtitle, Icon, theme, permissions }) => (
            <div
              key={role}
              className={`rounded-xl border ${theme.border} ${theme.bg} p-5 flex flex-col gap-4`}
            >
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-lg ${theme.iconBg}`}>
                  <Icon className={`h-6 w-6 ${theme.iconColor}`} aria-hidden="true" />
                </span>
                <div>
                  <p className={`font-bold ${theme.title}`}>{role}</p>
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

      {/* Security Note */}
      <section>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            🔒 Ασφάλεια & Προστασία Διαδρομών
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            Η πλατφόρμα χρησιμοποιεί το component <code className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-mono">ProtectedRoute</code> για
            την προστασία σελίδων που απαιτούν συγκεκριμένο ρόλο. Κάθε απόπειρα πρόσβασης σε
            προστατευμένη διαδρομή χωρίς τα κατάλληλα δικαιώματα ανακατευθύνεται αυτόματα στη
            σελίδα σύνδεσης. Η αυθεντικοποίηση βασίζεται σε JWT αποθηκευμένο σε{' '}
            <code className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs font-mono">HttpOnly</code>{' '}
            cookie για μέγιστη ασφάλεια έναντι XSS επιθέσεων.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
}
