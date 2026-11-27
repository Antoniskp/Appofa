import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

const TITLE = 'Εργαλεία Πολιτών — Διαφάνεια & Λογοδοσία';
const DESCRIPTION =
  'Ανεξάρτητες εφαρμογές και επίσημες πηγές για να παρακολουθείτε αποφάσεις, δαπάνες, δημοτικά συμβούλια και τη Βουλή — MizAI, OpenCouncil, Vouliwatch, Διαύγεια.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/citizen-help/civic-tools`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
  alternates: {
    canonical: `${SITE_URL}/citizen-help/civic-tools`,
  },
};

// Independent (non-government) civic-tech projects.
const independentTools = [
  {
    emoji: '🔎',
    name: 'MizAI',
    url: 'https://mizai.gr',
    domain: 'mizai.gr',
    what: 'Αναζήτηση σε πράξεις της Διαύγειας και του ΚΗΜΔΗΣ (δημόσιες συμβάσεις), με σύνοψη κάθε απόφασης, ποσά, φορέα και ημερομηνίες, και σύνδεσμο στο επίσημο έγγραφο.',
    useFor: 'Θέλετε να δείτε τι ανέθεσε ή πλήρωσε ένας δήμος ή φορέας.',
    note: 'Ο «βαθμός προτεραιότητας» δείχνει τι αξίζει να ελεγχθεί πρώτα — δεν αποτελεί απόδειξη παρανομίας.',
  },
  {
    emoji: '🏛️',
    name: 'OpenCouncil',
    url: 'https://opencouncil.gr',
    domain: 'opencouncil.gr',
    what: 'Οι συνεδριάσεις δημοτικών συμβουλίων οργανωμένες σε θέματα, με απομαγνητοφώνηση και φίλτρα ανά δήμο, κατηγορία και περίοδο.',
    useFor: 'Θέλετε να μάθετε τι συζητήθηκε στο δημοτικό συμβούλιο της περιοχής σας χωρίς να δείτε ώρες βίντεο.',
    note: 'Καλύπτει όσους δήμους συμμετέχουν — ελέγξτε αν είναι ο δικός σας.',
  },
  {
    emoji: '🗳️',
    name: 'Vouliwatch',
    url: 'https://vouliwatch.gr',
    domain: 'vouliwatch.gr',
    what: 'Παρακολούθηση νομοθεσίας και κοινοβουλευτικού ελέγχου, συγκρίσεις θέσεων κομμάτων και ερωτήσεις πολιτών που απαντούν δημόσια οι βουλευτές.',
    useFor: 'Θέλετε να δείτε τι ψήφισε η Βουλή ή να κάνετε ερώτηση σε βουλευτή.',
  },
  {
    emoji: '📊',
    name: 'iMEdD Lab',
    url: 'https://lab.imedd.org',
    domain: 'lab.imedd.org',
    what: 'Δημοσιογραφία δεδομένων από το μη κερδοσκοπικό iMEdD: έρευνες, εργαλεία και οπτικοποιήσεις με ανοιχτά δεδομένα.',
    useFor: 'Θέλετε τεκμηριωμένα στοιχεία και γραφήματα για ένα δημόσιο ζήτημα.',
  },
];

// Official government sources the tools above build on.
const officialSources = [
  {
    name: 'Διαύγεια',
    url: 'https://diavgeia.gov.gr',
    domain: 'diavgeia.gov.gr',
    what: 'Όλες οι αποφάσεις του Δημοσίου και της Αυτοδιοίκησης, με ΑΔΑ.',
  },
  {
    name: 'ΚΗΜΔΗΣ',
    url: 'https://www.promitheus.gov.gr',
    domain: 'promitheus.gov.gr',
    what: 'Κεντρικό Ηλεκτρονικό Μητρώο Δημοσίων Συμβάσεων — διαγωνισμοί και συμβάσεις.',
  },
  {
    name: 'opengov.gr',
    url: 'https://www.opengov.gr',
    domain: 'opengov.gr',
    what: 'Δημόσιες διαβουλεύσεις νομοσχεδίων — μπορείτε να σχολιάσετε άρθρο προς άρθρο.',
  },
  {
    name: 'Βουλή των Ελλήνων',
    url: 'https://www.hellenicparliament.gr',
    domain: 'hellenicparliament.gr',
    what: 'Νομοσχέδια, πρακτικά, ψηφοφορίες και στοιχεία βουλευτών.',
  },
];

function ExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline text-sm font-medium"
    >
      {children} →
    </a>
  );
}

export default function CivicToolsPage() {
  return (
    <StaticPageLayout
      title="Εργαλεία Πολιτών"
      maxWidth="max-w-4xl"
      breadcrumb={
        <Link href="/citizen-help" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Βοήθεια Πολίτη
        </Link>
      }
    >
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Εφαρμογές και πηγές που σας βοηθούν να δείτε πώς αποφασίζει και πού ξοδεύει το Δημόσιο —
          από τον δήμο σας μέχρι τη Βουλή.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Ανεξάρτητες εφαρμογές</h2>
        <p className="text-sm text-gray-600 mb-4">
          Δεν ανήκουν στο Δημόσιο ούτε στην Απόφαση. Τις παρουσιάζουμε επειδή είναι χρήσιμες·
          για τα δεδομένα τους υπεύθυνοι είναι οι δημιουργοί τους.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {independentTools.map((tool) => (
            <div key={tool.name} className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-lg font-semibold text-indigo-700">
                  {tool.emoji} {tool.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                  Ανεξάρτητη
                </span>
              </div>
              <p className="text-gray-700 text-sm mb-2">{tool.what}</p>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Χρήσιμο όταν:</strong> {tool.useFor}
              </p>
              {tool.note && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 mb-3">ℹ️ {tool.note}</p>
              )}
              <div className="mt-auto">
                <ExternalLink href={tool.url}>{tool.domain}</ExternalLink>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">Επίσημες πηγές</h2>
        <p className="text-sm text-gray-600 mb-4">
          Οι πρωτογενείς πλατφόρμες του Δημοσίου, από όπου αντλούν δεδομένα και οι παραπάνω εφαρμογές.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {officialSources.map((src) => (
            <div key={src.name} className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-1">{src.name}</h3>
              <p className="text-gray-700 text-sm mb-2">{src.what}</p>
              <ExternalLink href={src.url}>{src.domain}</ExternalLink>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-1">Ξέρετε κάποιο άλλο εργαλείο;</h2>
          <p className="text-gray-700 text-sm">
            Αν φτιάχνετε ή χρησιμοποιείτε μια εφαρμογή για τη διαφάνεια και την ενημέρωση των πολιτών,{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              στείλτε μας μήνυμα
            </Link>{' '}
            να την προσθέσουμε.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
}
