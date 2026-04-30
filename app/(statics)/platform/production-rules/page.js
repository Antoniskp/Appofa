import Link from 'next/link';
import {
  CheckCircleIcon,
  CodeBracketIcon,
  BeakerIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Κανόνες Παραγωγής | Appofa',
  description:
    'Κανόνες και πρότυπα για αλλαγές κώδικα, deployment και ποιότητα στην πλατφόρμα Appofa.',
  openGraph: {
    url: `${SITE_URL}/platform/production-rules`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Κανόνες Παραγωγής | Appofa',
    description:
      'Κανόνες και πρότυπα για αλλαγές κώδικα, deployment και ποιότητα στην πλατφόρμα Appofa.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Κανόνες Παραγωγής | Appofa',
    description:
      'Κανόνες και πρότυπα για αλλαγές κώδικα, deployment και ποιότητα στην πλατφόρμα Appofa.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/production-rules`,
  },
};

const rules = [
  {
    Icon: CodeBracketIcon,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    title: '🔀 Κανόνες Αλλαγών Κώδικα',
    items: [
      'Κάθε αλλαγή — ακόμα και 1 γραμμή — γίνεται μέσω Pull Request',
      'Απαγορεύεται commit/push απευθείας στο main branch',
      'Το CI pipeline πρέπει να πετύχει πριν από merge',
      'Αλλαγές εξαρτήσεων (npm) γίνονται μόνο μέσω PR ώστε να τρέξει το npm install στο CI',
    ],
  },
  {
    Icon: BeakerIcon,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: '🧪 Ποιότητα & Δοκιμές',
    items: [
      'Jest + Supertest για backend API tests — SQLite in-memory για απομόνωση',
      'Το test suite τρέχει με npm test — δεν επιτρέπεται removal ή bypass tests',
      'Κάθε νέα λειτουργικότητα πρέπει να συνοδεύεται από tests (όπου υπάρχει infrastructure)',
      'CodeQL security scan τρέχει αυτόματα σε κάθε PR',
      'npm audit --omit=dev --audit-level=high μπλοκάρει merge σε high/critical ευπάθειες',
    ],
  },
  {
    Icon: ArrowPathIcon,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: '🚀 Deployment & Ανάκαμψη',
    items: [
      'Η παραγωγή τρέχει μέσω Nginx reverse proxy που ορίζεται στο nginx/appofa.conf',
      'Η σελίδα public/502.html εξυπηρετεί ως fallback όταν η εφαρμογή είναι εκτός',
      'Σε διακοπή: επαναφορά από τελευταίο σταθερό commit, όχι rollback με force push',
      'Migrations γίνονται πριν από restart της εφαρμογής',
      'Environment variables πρέπει να οριστούν στον server πριν από deploy',
    ],
  },
  {
    Icon: ExclamationTriangleIcon,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: '🚫 Απαγορεύσεις',
    items: [
      'Ποτέ secrets ή API keys σε κώδικα ή commit messages',
      'Μη χρήση npm audit fix --force χωρίς έλεγχο breaking changes',
      'Μη αλλαγή git history (git rebase/force push) σε shared branches',
      'Μη αφαίρεση ή τροποποίηση υπαρχόντων tests χωρίς λόγο',
      'Μη εκτέλεση κώδικα που χρησιμοποιεί shell expansion για ασαφή constructs',
    ],
  },
];

const ciChecks = [
  { label: 'npm install', description: 'Επαλήθευση εγκατάστασης εξαρτήσεων' },
  { label: 'npm test', description: 'Εκτέλεση test suite (Jest)' },
  { label: 'npm audit --omit=dev', description: 'Έλεγχος ευπαθειών production dependencies' },
  { label: 'CodeQL scan', description: 'Στατική ανάλυση ασφάλειας κώδικα' },
  { label: 'ESLint', description: 'Έλεγχος ποιότητας κώδικα' },
];

export default function ProductionRulesPage() {
  return (
    <StaticPageLayout
      title="Κανόνες Παραγωγής"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Αυτοί οι κανόνες διασφαλίζουν ότι κάθε αλλαγή στην πλατφόρμα γίνεται με ασφάλεια,
        ποιότητα και διαφάνεια. Ισχύουν για όλους — ανθρώπους και AI agents — που συνεισφέρουν
        κώδικα.
      </p>

      {/* Rules Grid */}
      <section>
        <div className="grid sm:grid-cols-2 gap-5">
          {rules.map(({ Icon, iconBg, iconColor, title, items }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
                </span>
                <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
              </div>
              <ul className="space-y-1.5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-indigo-500 mt-0.5 flex-shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CI Pipeline */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          ⚙️ CI Pipeline — Τι Ελέγχεται σε Κάθε PR
        </h2>
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Έλεγχος</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Σκοπός</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-700">Αποτυχία → Merge;</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {ciChecks.map(({ label, description }) => (
                <tr key={label} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-indigo-700 text-xs">{label}</td>
                  <td className="px-5 py-3 text-gray-700">{description}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-red-500 font-semibold text-xs">🚫 Αποκλείεται</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Content Quality */}
      <section>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            📝 Ποιότητα Περιεχομένου
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-blue-800 mb-2">Ειδήσεις (news)</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />Υποβάλλονται από editors για έγκριση</li>
                <li className="flex items-start gap-2"><CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />Εγκρίνονται από admin ή moderator</li>
                <li className="flex items-start gap-2"><CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />Δημοσιεύονται μόνο μετά από έγκριση</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-blue-800 mb-2">Δημοσκοπήσεις & Προτάσεις</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />Μία ψήφος ανά χρήστη ανά δημοσκόπηση</li>
                <li className="flex items-start gap-2"><CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />Rate limiting στις ψηφοφορίες</li>
                <li className="flex items-start gap-2"><CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />Τα αποτελέσματα είναι πάντα ορατά</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Note */}
      <section>
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
          <h2 className="text-lg font-semibold text-purple-900 mb-2">🤖 Κανόνες για AI Agents</h2>
          <ul className="space-y-1.5 text-sm text-gray-700">
            {[
              'Κάθε αλλαγή γίνεται μέσω PR — ποτέ απευθείας στο main',
              'Τα platform docs (αυτές οι σελίδες) ενημερώνονται όταν αλλάζει κώδικας που τα επηρεάζει',
              'Το doc/REPOSITORY_MAP.md ενημερώνεται σε κάθε task που προσθέτει/αφαιρεί αρχεία',
              'Η σελίδα copilot-instructions.md ενημερώνεται με κάθε νέα σύμβαση ή pattern',
              'Τα tests δεν αφαιρούνται ποτέ εκτός αν αντικαθίστανται',
              'Ο κώδικας ελέγχεται από parallel_validation πριν finalize',
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5 flex-shrink-0">→</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Related Links */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">🔗 Σχετικές Σελίδες</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/platform/security', label: 'Ασφάλεια' },
            { href: '/platform/roles', label: 'Ρόλοι & Δικαιώματα' },
            { href: '/platform/responsibilities', label: 'Υπευθυνότητες' },
            { href: '/github-files', label: 'Αρχεία GitHub' },
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
            <strong>Σημείωση συντήρησης:</strong> Αυτή η σελίδα είναι ο κανονικός ορισμός των
            κανόνων παραγωγής για ανθρώπους και AI agents. Ενημερώνεται όταν αλλάζουν CI workflows,
            deployment procedures, testing standards ή governance κανόνες στο{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">.github/copilot-instructions.md</code>.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
}
