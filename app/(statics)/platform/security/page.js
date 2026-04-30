import Link from 'next/link';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Ασφάλεια Πλατφόρμας | Appofa',
  description:
    'Επισκόπηση των μέτρων ασφάλειας της πλατφόρμας Appofa — αυθεντικοποίηση, CSRF, rate limiting, κρυπτογράφηση και προστασία δεδομένων.',
  openGraph: {
    url: `${SITE_URL}/platform/security`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Ασφάλεια Πλατφόρμας | Appofa',
    description:
      'Επισκόπηση των μέτρων ασφάλειας της πλατφόρμας Appofa — αυθεντικοποίηση, CSRF, rate limiting, κρυπτογράφηση και προστασία δεδομένων.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ασφάλεια Πλατφόρμας | Appofa',
    description:
      'Επισκόπηση των μέτρων ασφάλειας της πλατφόρμας Appofa — αυθεντικοποίηση, CSRF, rate limiting, κρυπτογράφηση και προστασία δεδομένων.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/security`,
  },
};

const securityPillars = [
  {
    Icon: LockClosedIcon,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: '🔐 Αυθεντικοποίηση',
    items: [
      'JWT αποθηκευμένο σε HttpOnly cookie — απρόσιτο από JavaScript (XSS protection)',
      'Κωδικοί κρυπτογραφημένοι με bcrypt (10 rounds)',
      'Λήξη token: 24 ώρες',
      'Υποστήριξη OAuth: GitHub & Google',
    ],
  },
  {
    Icon: ShieldCheckIcon,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: '🛡️ Εξουσιοδότηση & Έλεγχος Πρόσβασης',
    items: [
      'Role-Based Access Control (RBAC): viewer, editor, moderator, admin',
      'Κάθε endpoint προστατεύεται από αντίστοιχο middleware',
      'Η προστασία διαδρομών ελέγχεται frontend (ProtectedRoute) ΚΑΙ backend (checkRole)',
      'Moderator εξουσία ανά τοποθεσία μέσω UserLocationRole',
    ],
  },
  {
    Icon: BoltIcon,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: '⚡ Rate Limiting & Anti-Abuse',
    items: [
      'Σύνδεση/Εγγραφή: 5 αιτήματα / 15 λεπτά',
      'Δημιουργία περιεχομένου: 20 αιτήματα / 15 λεπτά',
      'Γενικά API: 100 αιτήματα / 15 λεπτά',
      'Ψηφοφορία (ανώνυμοι): 10 ψήφοι / ώρα',
      'Ψηφοφορία (συνδεδεμένοι): 50 ψήφοι / ώρα',
      'Αυτόματο blacklisting IPs που σαρώνουν για ευπάθειες',
    ],
  },
  {
    Icon: GlobeAltIcon,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    title: '🌐 Γεωγραφικός Έλεγχος & Παρακολούθηση',
    items: [
      'Ανίχνευση χώρας επισκέπτη μέσω Cloudflare headers',
      'Δυνατότητα αποκλεισμού χωρών ή ανακατεύθυνσης',
      'Telemetry επισκεψιμότητας ανά διαδρομή (GeoTracker) — ανεξάρτητο από ρυθμίσεις GDPR',
      'IP whitelist/blacklist με διαχείριση από admins',
    ],
  },
  {
    Icon: ExclamationTriangleIcon,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: '🔏 CSRF & Κεφαλίδες Ασφάλειας',
    items: [
      'CSRF double-submit tokens σε όλα τα POST/PUT/DELETE',
      'HTTP security headers μέσω Helmet.js (CSP, X-Frame-Options κ.α.)',
      'CORS περιορισμένο στο εγκεκριμένο frontend origin',
      'Σφάλματα επιστρέφουν μόνο γενικό μήνυμα — χωρίς stack traces σε production',
    ],
  },
];

export default function SecurityPage() {
  return (
    <StaticPageLayout
      title="Ασφάλεια Πλατφόρμας"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Η πλατφόρμα Appofa εφαρμόζει ένα πολυεπίπεδο μοντέλο ασφάλειας. Παρακάτω παρουσιάζεται
        μια δημόσια επισκόπηση των βασικών μηχανισμών που χρησιμοποιούνται για την προστασία των
        χρηστών και των δεδομένων.
      </p>

      {/* Security Pillars */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🔒 Πυλώνες Ασφάλειας</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {securityPillars.map(({ Icon, iconBg, iconColor, title, items }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
                </span>
                <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
              </div>
              <ul className="space-y-1.5">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Input Validation */}
      <section>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🧹 Επικύρωση Εισόδου & Βάση Δεδομένων</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-800 mb-2">Επικύρωση δεδομένων</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>Server-side validation σε όλα τα endpoints</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>Έλεγχος μορφής email, μήκους πεδίων, τύπων δεδομένων</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>Μέγιστο μέγεθος αρχείων στα uploads (10 MB)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-2">Βάση δεδομένων</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>SQL Injection προστασία μέσω Sequelize ORM (parameterized queries)</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>Credentials αποθηκευμένα αποκλειστικά σε environment variables</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>JWT_SECRET υποχρεωτικό σε production environment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dependency Security */}
      <section>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">📦 Ασφάλεια Εξαρτήσεων</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Εκτελείται τακτικός έλεγχος <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">npm audit</code> και
            το CI pipeline μπλοκάρει σε οποιαδήποτε εξάρτηση με βαθμολογία ευπάθειας{' '}
            <strong>high</strong> ή παραπάνω. Εντοπισμένες ευπάθειες αντιμετωπίζονται εντός της
            ίδιας commit/PR. Τρέχουσα κατάσταση: 0 γνωστές ευπάθειες σε production dependencies.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">✅ 0 critical</span>
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">✅ 0 high</span>
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">✅ 0 moderate</span>
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">npm audit --omit=dev</span>
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section>
        <div className="rounded-xl border border-red-100 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-3">🚨 Αντίδραση σε Περιστατικά</h2>
          <ol className="space-y-2 text-sm text-gray-700">
            {[
              'Άμεση ανανέωση του JWT_SECRET (αναγκαστική αποσύνδεση όλων των χρηστών)',
              'Επανεξέταση access logs για ύποπτη δραστηριότητα',
              'Ενημέρωση επηρεαζόμενων dependencies',
              'Ενημέρωση χρηστών σε περίπτωση διαρροής δεδομένων',
              'Post-mortem ανάλυση και ενίσχυση ελέγχων',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-200 text-red-800 text-xs font-bold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Related Links */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">🔗 Σχετικές Σελίδες</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/platform/roles', label: 'Ρόλοι & Δικαιώματα' },
            { href: '/platform/responsibilities', label: 'Υπευθυνότητες' },
            { href: '/platform/production-rules', label: 'Κανόνες Παραγωγής' },
            { href: '/privacy', label: 'Πολιτική Απορρήτου' },
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
            <strong>Σημείωση συντήρησης:</strong> Αυτή η σελίδα αποτελεί δημόσια επισκόπηση της
            ασφάλειας. Η λεπτομερής τεκμηρίωση βρίσκεται στο{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">doc/SECURITY.md</code> του
            repository. Όταν αλλάζουν security controls, rate limits, auth flows ή geo-access
            κανόνες, και αυτή η σελίδα και το{' '}
            <code className="bg-amber-100 px-1 rounded font-mono">doc/SECURITY.md</code> πρέπει να
            ενημερωθούν.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
}
