import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Αμοιβές & Παροχές Πολιτικών Αξιωματούχων — Ελλάδα',
  description:
    'Αναλυτικές πληροφορίες για τις αμοιβές, τα επιδόματα και τις παροχές του Πρωθυπουργού, Υπουργών, Βουλευτών, Περιφερειαρχών, Δημάρχων και άλλων αιρετών αξιωματούχων στην Ελλάδα.',
  openGraph: {
    title: 'Αμοιβές & Παροχές Πολιτικών Αξιωματούχων — Ελλάδα',
    description:
      'Αναλυτικές πληροφορίες για τις αμοιβές, τα επιδόματα και τις παροχές αιρετών αξιωματούχων στην Ελλάδα.',
    url: `${SITE_URL}/citizen-help/public-officials-salaries`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Αμοιβές & Παροχές Πολιτικών Αξιωματούχων — Ελλάδα',
    description:
      'Αμοιβές, επιδόματα και παροχές Πρωθυπουργού, Υπουργών, Βουλευτών, Περιφερειαρχών, Δημάρχων.',
  },
  alternates: {
    canonical: `${SITE_URL}/citizen-help/public-officials-salaries`,
  },
};

const officials = [
  {
    role: 'Πρωθυπουργός',
    emoji: '🏛️',
    baseSalary: '13.500',
    allowances: '~3.000',
    total: '~16.500',
    perks: [
      'Επίσημη κατοικία (Μέγαρο Μαξίμου)',
      'Κρατικό αυτοκίνητο & οδηγός',
      'Ασφάλεια (σωματοφύλακες)',
      'Αεροπορικές μεταφορές με κυβερνητικά αεροσκάφη',
      'Έξοδα παράστασης',
      'Σύνταξη μετά τη λήξη της θητείας',
    ],
    legalRef: 'Ν. 3205/2003, Ν. 4354/2015',
  },
  {
    role: 'Αντιπρόεδρος Κυβέρνησης',
    emoji: '🏛️',
    baseSalary: '11.500',
    allowances: '~2.500',
    total: '~14.000',
    perks: [
      'Κρατικό αυτοκίνητο & οδηγός',
      'Ασφάλεια',
      'Έξοδα παράστασης',
    ],
    legalRef: 'Ν. 3205/2003, Ν. 4354/2015',
  },
  {
    role: 'Υπουργός',
    emoji: '👔',
    baseSalary: '9.700',
    allowances: '~2.000',
    total: '~11.700',
    perks: [
      'Κρατικό αυτοκίνητο & οδηγός',
      'Ασφάλεια',
      'Έξοδα παράστασης',
      'Υπηρεσιακό γραφείο',
    ],
    legalRef: 'Ν. 3205/2003, Ν. 4354/2015',
  },
  {
    role: 'Αναπληρωτής Υπουργός',
    emoji: '👔',
    baseSalary: '8.500',
    allowances: '~1.800',
    total: '~10.300',
    perks: [
      'Κρατικό αυτοκίνητο & οδηγός',
      'Έξοδα παράστασης',
    ],
    legalRef: 'Ν. 3205/2003, Ν. 4354/2015',
  },
  {
    role: 'Υφυπουργός',
    emoji: '👔',
    baseSalary: '7.500',
    allowances: '~1.500',
    total: '~9.000',
    perks: [
      'Κρατικό αυτοκίνητο & οδηγός',
      'Έξοδα παράστασης',
    ],
    legalRef: 'Ν. 3205/2003, Ν. 4354/2015',
  },
  {
    role: 'Βουλευτής',
    emoji: '🗳️',
    baseSalary: '5.900',
    allowances: '~1.800',
    total: '~7.700',
    perks: [
      'Έξοδα μετακίνησης (ειδικά για επαρχιακούς βουλευτές)',
      'Δωρεάν μετακίνηση με μέσα μαζικής μεταφοράς',
      'Μηνιαίο επίδομα γραφείου / εκπροσώπησης',
      'Ασυλία κατά τη διάρκεια της θητείας',
      'Συνταξιοδοτικά δικαιώματα',
    ],
    legalRef: 'Ν. 3205/2003, Ν. 4354/2015, Κανονισμός Βουλής',
  },
  {
    role: 'Περιφερειάρχης',
    emoji: '🗺️',
    baseSalary: '4.400',
    allowances: '~1.200',
    total: '~5.600',
    perks: [
      'Υπηρεσιακό αυτοκίνητο',
      'Έξοδα παράστασης',
      'Ασφάλιση',
    ],
    legalRef: 'Ν. 3852/2010 (Καλλικράτης), Ν. 4354/2015',
  },
  {
    role: 'Αντιπεριφερειάρχης',
    emoji: '🗺️',
    baseSalary: '3.200',
    allowances: '~800',
    total: '~4.000',
    perks: [
      'Υπηρεσιακό αυτοκίνητο',
      'Έξοδα παράστασης',
    ],
    legalRef: 'Ν. 3852/2010, Ν. 4354/2015',
  },
  {
    role: 'Δήμαρχος (Α΄ κατηγορία, >100.000 κατ.)',
    emoji: '🏙️',
    baseSalary: '4.000',
    allowances: '~900',
    total: '~4.900',
    perks: [
      'Υπηρεσιακό αυτοκίνητο',
      'Έξοδα παράστασης',
      'Ασφάλιση ΙΚΑ/ΕΦΚΑ',
    ],
    legalRef: 'Ν. 3852/2010, Ν. 4354/2015, ΚΥΑ αντιμισθιών',
  },
  {
    role: 'Δήμαρχος (Β΄ κατηγορία, 10.000–100.000 κατ.)',
    emoji: '🏙️',
    baseSalary: '2.800',
    allowances: '~600',
    total: '~3.400',
    perks: [
      'Υπηρεσιακό αυτοκίνητο',
      'Έξοδα παράστασης',
    ],
    legalRef: 'Ν. 3852/2010, Ν. 4354/2015',
  },
  {
    role: 'Δήμαρχος (Γ΄ κατηγορία, <10.000 κατ.)',
    emoji: '🏘️',
    baseSalary: '1.700',
    allowances: '~400',
    total: '~2.100',
    perks: [
      'Έξοδα παράστασης',
      'Ασφάλιση ΕΦΚΑ',
    ],
    legalRef: 'Ν. 3852/2010, Ν. 4354/2015',
  },
  {
    role: 'Δημοτικός Σύμβουλος',
    emoji: '📋',
    baseSalary: '—',
    allowances: '~200–400 / συνεδρίαση',
    total: 'Αποζημίωση συνεδριάσεων',
    perks: [
      'Αποζημίωση ανά συνεδρίαση',
      'Χωρίς τακτικό μισθό',
    ],
    legalRef: 'Ν. 3852/2010, Ν. 4354/2015',
  },
];

const additionalPerks = [
  {
    title: 'Συνταξιοδοτικά Δικαιώματα',
    description:
      'Βουλευτές και κυβερνητικά μέλη αποκτούν συνταξιοδοτικά δικαιώματα μετά από συγκεκριμένο αριθμό θητειών. Η σύνταξη υπολογίζεται βάσει ετών υπηρεσίας και κυμαίνεται από ~1.500 έως ~3.500 €/μήνα.',
  },
  {
    title: 'Κρατικά Αυτοκίνητα',
    description:
      'Υπουργοί, Αντιπρόεδροι και ο Πρωθυπουργός διαθέτουν κρατικά οχήματα με οδηγούς. Περιφερειάρχες και Δήμαρχοι μεγάλων Δήμων έχουν επίσης υπηρεσιακά οχήματα.',
  },
  {
    title: 'Ιατροφαρμακευτική Κάλυψη',
    description:
      'Τα αιρετά μέλη εντάσσονται στο ΕΦΚΑ/ΙΚΑ. Κυβερνητικά μέλη διαθέτουν επιπλέον πρόσβαση σε κρατικά νοσοκομεία.',
  },
  {
    title: 'Έξοδα Μετακίνησης',
    description:
      'Βουλευτές εκτός Αττικής λαμβάνουν επίδομα μετακίνησης. Κυβερνητικά μέλη χρησιμοποιούν κρατικά μέσα μεταφοράς για επίσημες μετακινήσεις εντός και εκτός χώρας.',
  },
  {
    title: 'Γραμματειακή Υποστήριξη',
    description:
      'Βουλευτές δικαιούνται να προσλάβουν γραμματείς/συμβούλους με κρατική δαπάνη. Υπουργοί διαθέτουν πολυπληθή γραφεία.',
  },
];

export default function PublicOfficialsSalariesPage() {
  return (
    <StaticPageLayout
      title="Αμοιβές & Παροχές Πολιτικών Αξιωματούχων"
      maxWidth="max-w-5xl"
      breadcrumb={
        <Link href="/elections" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Εκλογές &amp; Πολιτική
        </Link>
      }
    >
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Αναλυτικές πληροφορίες για τις μηνιαίες αμοιβές, τα επιδόματα και τις παροχές που
          λαμβάνουν οι αιρετοί πολιτικοί αξιωματούχοι στην Ελλάδα — από τον Πρωθυπουργό έως
          τους Δημάρχους.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Συγκριτικός Πίνακας Αμοιβών</h2>
        <p className="text-sm text-gray-500 mb-4">
          Τα ποσά είναι κατά προσέγγιση βάσει ισχύοντος νομικού πλαισίου (€/μήνα μικτά).
          Ενδέχεται να διαφέρουν ανάλογα με τροποποιήσεις νόμων.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Αξίωμα</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Βασικός Μισθός (€)</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Επιδόματα (€)</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Σύνολο (€)</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Νομική Βάση</th>
              </tr>
            </thead>
            <tbody>
              {officials.map((o, idx) => (
                <tr
                  key={o.role}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {o.emoji} {o.role}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{o.baseSalary}</td>
                  <td className="px-4 py-3 text-gray-700">{o.allowances}</td>
                  <td className="px-4 py-3 font-semibold text-blue-700">{o.total}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{o.legalRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Αναλυτικές Παροχές ανά Αξίωμα</h2>
        <div className="space-y-6">
          {officials.map((o) => (
            <div
              key={o.role}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="bg-blue-50 px-5 py-3 flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">{o.emoji}</span>
                <h3 className="text-lg font-semibold text-blue-900">{o.role}</h3>
                <span className="ml-auto text-blue-700 font-bold">{o.total} €/μήνα</span>
              </div>
              <ul className="px-5 py-4 space-y-1 list-disc list-inside text-gray-700 text-sm">
                {o.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Επιπλέον Παροχές & Προνόμια</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {additionalPerks.map((perk) => (
            <div
              key={perk.title}
              className="border border-gray-200 rounded-lg p-5 bg-white"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{perk.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{perk.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Χρήσιμες Πηγές</h2>
        <div className="space-y-3">
          {[
            {
              href: 'https://www.hellenicparliament.gr',
              label: 'Ελληνικό Κοινοβούλιο',
              desc: 'Επίσημος ιστότοπος — νόμοι, αποφάσεις, μισθολόγιο',
              emoji: '🏛️',
            },
            {
              href: 'https://www.ypes.gr',
              label: 'Υπουργείο Εσωτερικών',
              desc: 'Αντιμισθίες αιρετών — ΚΥΑ & εγκύκλιοι',
              emoji: '📜',
            },
            {
              href: 'https://www.et.gr',
              label: 'Εφημερίδα της Κυβερνήσεως (ΦΕΚ)',
              desc: 'Αναζήτηση νομοθεσίας για μισθολόγιο αξιωματούχων',
              emoji: '📰',
            },
            {
              href: 'https://diavgeia.gov.gr',
              label: 'Διαύγεια',
              desc: 'Αποφάσεις για αντιμισθίες και παροχές αιρετών',
              emoji: '🔍',
            },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <span className="text-2xl" aria-hidden="true">{link.emoji}</span>
              <div>
                <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">
                  {link.label}
                </p>
                <p className="text-sm text-gray-600">{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-4">
          <strong>Σημείωση:</strong> Οι παραπάνω αριθμοί αποτελούν εκτίμηση βάσει δημόσια
          διαθέσιμων στοιχείων και ισχύοντος νομικού πλαισίου (κυρίως Ν. 3205/2003, Ν. 4354/2015,
          Ν. 3852/2010 &laquo;Καλλικράτης&raquo;). Τα ακριβή ποσά δύνανται να μεταβληθούν με
          νεότερη νομοθεσία ή Κοινές Υπουργικές Αποφάσεις. Για επίσημα και επικαιροποιημένα
          στοιχεία απευθυνθείτε στο Υπουργείο Εσωτερικών ή στο gov.gr.
        </p>
      </section>
    </StaticPageLayout>
  );
}
