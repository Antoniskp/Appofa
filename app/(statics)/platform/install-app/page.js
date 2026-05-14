import Link from 'next/link';
import {
  DevicePhoneMobileIcon,
  BoltIcon,
  CloudArrowDownIcon,
} from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Πρόσθεσέ μας στην Αρχική σου | Appofa',
  description:
    'Μάθε πώς να προσθέσεις το Appofa στην αρχική οθόνη του κινητού σου και να το χρησιμοποιείς σαν εφαρμογή — χωρίς λήψη.',
  openGraph: {
    url: `${SITE_URL}/platform/install-app`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Πρόσθεσέ μας στην Αρχική σου | Appofa',
    description:
      'Μάθε πώς να προσθέσεις το Appofa στην αρχική οθόνη του κινητού σου και να το χρησιμοποιείς σαν εφαρμογή — χωρίς λήψη.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Πρόσθεσέ μας στην Αρχική σου | Appofa',
    description:
      'Μάθε πώς να προσθέσεις το Appofa στην αρχική οθόνη του κινητού σου και να το χρησιμοποιείς σαν εφαρμογή — χωρίς λήψη.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/install-app`,
  },
};

const benefits = [
  {
    Icon: DevicePhoneMobileIcon,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Άμεση πρόσβαση',
    description: 'Βρίσκεις το Appofa στην αρχική οθόνη σου, ακριβώς όπως κάθε άλλη εφαρμογή.',
  },
  {
    Icon: BoltIcon,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    title: 'Γρήγορη φόρτωση',
    description: 'Χωρίς browser bars, χωρίς περιττά tabs — εμπειρία πλήρους οθόνης.',
  },
  {
    Icon: CloudArrowDownIcon,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Χωρίς λήψη',
    description:
      'Δεν καταλαμβάνει χώρο από το κατάστημα εφαρμογών. Πάντα ενημερωμένο αυτόματα.',
  },
];

const faqs = [
  {
    question: 'Είναι ασφαλές;',
    answer:
      'Ναι. Χρησιμοποιείς πάντα τον browser σου, με HTTPS και τα ίδια cookies/ασφάλεια.',
  },
  {
    question: 'Θα λαμβάνω ειδοποιήσεις;',
    answer:
      'Αυτή τη στιγμή δεν στέλνουμε push ειδοποιήσεις. Αυτό μπορεί να αλλάξει μελλοντικά.',
  },
  {
    question: 'Πώς το αφαιρώ;',
    answer:
      'Όπως κάθε εφαρμογή — πάτησε παρατεταμένα στο εικονίδιο και επίλεξε Διαγραφή / Κατάργηση.',
  },
];

export default function InstallAppPage() {
  return (
    <StaticPageLayout
      title="Πρόσθεσέ μας στην Αρχική σου"
      maxWidth="max-w-3xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Το Appofa λειτουργεί σαν εφαρμογή απευθείας μέσα από τον browser σου. Δεν χρειάζεται να
        κατεβάσεις τίποτα — απλώς πρόσθεσέ το στην αρχική οθόνη σου και είσαι έτοιμος/η.
      </p>

      {/* Benefits */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Γιατί να το κάνεις αυτό;</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {benefits.map(({ Icon, iconBg, iconColor, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-5 rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <span
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconBg}`}
              >
                <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Instructions per device */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Οδηγίες ανά συσκευή</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* iOS */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                <DevicePhoneMobileIcon className="h-5 w-5 text-gray-600" aria-hidden="true" />
              </span>
              <h3 className="font-bold text-gray-900">iPhone / iPad (Safari)</h3>
            </div>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>
                Άνοιξε το <strong>appofasi.gr</strong> στο Safari.
              </li>
              <li>
                Πάτησε το εικονίδιο <strong>κοινοποίησης</strong> (□↑) στο κάτω μέρος της οθόνης.
              </li>
              <li>
                Κύλισε κάτω και πάτησε <strong>«Προσθήκη στην Αρχική Οθόνη»</strong>.
              </li>
              <li>
                Δώσε ένα όνομα (π.χ. <em>Appofa</em>) και πάτησε <strong>Προσθήκη</strong>.
              </li>
            </ol>
            <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ Λειτουργεί μόνο μέσω Safari. Άλλοι browsers στο iOS δεν υποστηρίζουν αυτή τη
              λειτουργία.
            </p>
          </div>

          {/* Android */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-100">
                <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
              </span>
              <h3 className="font-bold text-gray-900">Android (Chrome)</h3>
            </div>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>
                Άνοιξε το <strong>appofasi.gr</strong> στο Chrome.
              </li>
              <li>
                Πάτησε τις <strong>τρεις τελείες</strong> (⋮) πάνω δεξιά.
              </li>
              <li>
                Πάτησε <strong>«Προσθήκη στην αρχική οθόνη»</strong> ή{' '}
                <strong>«Εγκατάσταση εφαρμογής»</strong>.
              </li>
              <li>
                Επιβεβαίωσε πατώντας <strong>Προσθήκη</strong> ή <strong>Εγκατάσταση</strong>.
              </li>
            </ol>
            <p className="mt-4 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              ℹ️ Σε ορισμένες συσκευές εμφανίζεται αυτόματα ένα banner στο κάτω μέρος της οθόνης
              για άμεση εγκατάσταση.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Συχνές ερωτήσεις</h2>
        <dl>
          {faqs.map(({ question, answer }) => (
            <div key={question} className="border-b border-gray-200 py-4">
              <dt className="font-semibold text-gray-900">{question}</dt>
              <dd className="text-gray-600 mt-1 text-sm">{answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </StaticPageLayout>
  );
}
