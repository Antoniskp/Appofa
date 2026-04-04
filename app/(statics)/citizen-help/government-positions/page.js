import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Κυβερνητικές Θέσεις & Αξιωματούχοι — Ελλάδα',
  description:
    'Κατάλογος κυβερνητικών θέσεων και των σημερινών κατόχων τους στην Ελλάδα — Πρόεδρος Δημοκρατίας, Πρωθυπουργός, Υπουργοί και λοιποί αξιωματούχοι.',
  openGraph: {
    title: 'Κυβερνητικές Θέσεις & Αξιωματούχοι — Ελλάδα',
    description:
      'Πρόεδρος Δημοκρατίας, Πρωθυπουργός, Υπουργοί και λοιποί αξιωματούχοι της ελληνικής κυβέρνησης.',
    url: `${SITE_URL}/citizen-help/government-positions`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Κυβερνητικές Θέσεις & Αξιωματούχοι — Ελλάδα',
    description:
      'Κατάλογος θέσεων και κατόχων τους: Πρόεδρος, Πρωθυπουργός, Υπουργοί.',
  },
  alternates: {
    canonical: `${SITE_URL}/citizen-help/government-positions`,
  },
};

const keyPositions = [
  {
    position: 'Πρόεδρος της Δημοκρατίας',
    holder: 'Κατερίνα Σακελλαροπούλου',
    since: 'Μάρτιος 2020',
    emoji: '🏛️',
    description: 'Αρχηγός Κράτους — εκλέγεται από τη Βουλή για πενταετή θητεία.',
  },
  {
    position: 'Πρωθυπουργός',
    holder: 'Κυριάκος Μητσοτάκης',
    since: 'Ιούλιος 2023 (β΄ θητεία)',
    emoji: '🏛️',
    description: 'Αρχηγός Κυβέρνησης — επικεφαλής του εκτελεστικού.',
  },
  {
    position: 'Πρόεδρος Βουλής',
    holder: 'Κωνσταντίνος Τασούλας',
    since: 'Ιούλιος 2023',
    emoji: '🗳️',
    description: 'Επικεφαλής του νομοθετικού σώματος.',
  },
];

const cabinet = [
  { ministry: 'Εξωτερικών', minister: 'Γιώργης Γεραπετρίτης', emoji: '🌍' },
  { ministry: 'Εσωτερικών', minister: 'Νίκη Κεραμέως', emoji: '🏠' },
  { ministry: 'Εθνικής Άμυνας', minister: 'Νικόλαος-Γεώργιος Δένδιας', emoji: '🛡️' },
  { ministry: 'Οικονομικών', minister: 'Κωνσταντίνος Χατζηδάκης', emoji: '💰' },
  { ministry: 'Ανάπτυξης', minister: 'Κώστας Σκρέκας', emoji: '📈' },
  { ministry: 'Παιδείας & Θρησκευμάτων', minister: 'Κυριάκος Πιερρακάκης', emoji: '📚' },
  { ministry: 'Υγείας', minister: 'Άδωνης Γεωργιάδης', emoji: '⚕️' },
  { ministry: 'Εργασίας & Κοινωνικής Ασφάλισης', minister: 'Δόμνα Μιχαηλίδου', emoji: '👷' },
  { ministry: 'Περιβάλλοντος & Ενέργειας', minister: 'Θεόδωρος Σκυλακάκης', emoji: '🌿' },
  { ministry: 'Υποδομών & Μεταφορών', minister: 'Χρήστος Σταϊκούρας', emoji: '🚧' },
  { ministry: 'Ψηφιακής Διακυβέρνησης', minister: 'Δημήτρης Παπαστεργίου', emoji: '💻' },
  { ministry: 'Τουρισμού', minister: 'Όλγα Κεφαλογιάννη', emoji: '✈️' },
  { ministry: 'Δικαιοσύνης', minister: 'Γεώργιος Φλωρίδης', emoji: '⚖️' },
  { ministry: 'Προστασίας Πολίτη', minister: 'Μιχάλης Χρυσοχοΐδης', emoji: '🚔' },
  { ministry: 'Ναυτιλίας & Νησιωτικής Πολιτικής', minister: 'Χρήστος Στυλιανίδης', emoji: '⚓' },
  { ministry: 'Αγροτικής Ανάπτυξης & Τροφίμων', minister: 'Ελευθέριος Αυγενάκης', emoji: '🌾' },
  { ministry: 'Κλιματικής Κρίσης & Πολιτικής Προστασίας', minister: 'Χρήστος Τριαντόπουλος', emoji: '🌊' },
  { ministry: 'Μεταναστευτικής Πολιτικής & Ασύλου', minister: 'Δημήτρης Καιρίδης', emoji: '🤝' },
  { ministry: 'Υπουργός Επικρατείας', minister: 'Σταύρος Παπασταύρου', emoji: '📋' },
  { ministry: 'Κρατικός Υπουργός', minister: 'Θανάσης Κρεμαστινός', emoji: '📋' },
];

const sources = [
  {
    href: 'https://primeminister.gr',
    label: 'Γραφείο Πρωθυπουργού',
    desc: 'Σύνθεση Κυβέρνησης & επίσημες ανακοινώσεις',
    emoji: '🏛️',
  },
  {
    href: 'https://www.presidency.gr',
    label: 'Προεδρία της Δημοκρατίας',
    desc: 'Επίσημος ιστότοπος Προέδρου Δημοκρατίας',
    emoji: '🏛️',
  },
  {
    href: 'https://www.hellenicparliament.gr',
    label: 'Ελληνικό Κοινοβούλιο',
    desc: 'Βουλευτές, Επιτροπές, Νόμοι',
    emoji: '🗳️',
  },
  {
    href: 'https://www.mfa.gr',
    label: 'Υπουργείο Εξωτερικών',
    desc: 'Επίσημος ιστότοπος ΥΠΕΞ',
    emoji: '🌍',
  },
];

export default function GovernmentPositionsPage() {
  return (
    <StaticPageLayout
      title="Κυβερνητικές Θέσεις & Αξιωματούχοι"
      maxWidth="max-w-5xl"
      breadcrumb={
        <Link href="/elections" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Εκλογές &amp; Πολιτική
        </Link>
      }
    >
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Κατάλογος των βασικών κυβερνητικών θέσεων της Ελληνικής Δημοκρατίας και των προσώπων που
          τις κατέχουν σήμερα — Αρχηγός Κράτους, Αρχηγός Κυβέρνησης και μέλη του Υπουργικού
          Συμβουλίου.
        </p>
        <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          ⚠️ Οι πληροφορίες αυτές αντικατοπτρίζουν τη σύνθεση της κυβέρνησης μετά τις εκλογές του
          Ιουνίου 2023. Ενδέχεται να έχουν επέλθει αλλαγές. Για τα επίσημα και ενημερωμένα
          στοιχεία ανατρέξτε στον ιστότοπο του{' '}
          <a
            href="https://primeminister.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-900"
          >
            Γραφείου Πρωθυπουργού
          </a>
          .
        </p>
      </section>

      {/* Key Positions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Ανώτατα Αξιώματα</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {keyPositions.map((item) => (
            <div
              key={item.position}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              <div className="bg-blue-50 px-5 py-3 flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">{item.emoji}</span>
                <h3 className="text-base font-semibold text-blue-900">{item.position}</h3>
              </div>
              <div className="px-5 py-4">
                <p className="text-lg font-bold text-gray-800">{item.holder}</p>
                <p className="text-sm text-gray-500 mt-1">Από: {item.since}</p>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cabinet */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Υπουργικό Συμβούλιο</h2>
        <p className="text-sm text-gray-500 mb-4">
          Σύνθεση Κυβέρνησης — Κυριάκος Μητσοτάκης (β΄ θητεία, Ιούλιος 2023)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Υπουργείο</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Υπουργός</th>
              </tr>
            </thead>
            <tbody>
              {cabinet.map((row, idx) => (
                <tr key={row.ministry} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <span className="mr-2" aria-hidden="true">{row.emoji}</span>
                    {row.ministry}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.minister}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Επίσημες Πηγές</h2>
        <div className="space-y-3">
          {sources.map((link) => (
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
          <strong>Σημείωση:</strong> Τα στοιχεία βασίζονται στη σύνθεση κυβέρνησης μετά τις
          βουλευτικές εκλογές Ιουνίου 2023. Αλλαγές στη σύνθεση (αναδιανομές χαρτοφυλακίων,
          παραιτήσεις, ανασχηματισμοί) ενδέχεται να μην αποτυπώνονται άμεσα. Για επίσημα και
          ενημερωμένα στοιχεία απευθυνθείτε στο{' '}
          <a
            href="https://primeminister.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            primeminister.gr
          </a>
          .
        </p>
      </section>
    </StaticPageLayout>
  );
}
