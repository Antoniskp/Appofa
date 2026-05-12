import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Περιφέρειες & Εκλογικές Περιφέρειες — Χαρτογράφηση & Ανάλυση',
  description: 'Αναλυτική χαρτογράφηση των 13 διοικητικών Περιφερειών της Ελλάδας με τις αντίστοιχες εκλογικές περιφέρειες, τις βουλευτικές έδρες και σχετική ανάλυση.',
  openGraph: {
    title: 'Περιφέρειες & Εκλογικές Περιφέρειες — Χαρτογράφηση & Ανάλυση',
    description: 'Αναλυτική χαρτογράφηση των 13 διοικητικών Περιφερειών της Ελλάδας με τις αντίστοιχες εκλογικές περιφέρειες, τις βουλευτικές έδρες και σχετική ανάλυση.',
    url: `${SITE_URL}/citizen-help/regions-electoral-map`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Περιφέρειες & Εκλογικές Περιφέρειες — Χαρτογράφηση & Ανάλυση',
    description: 'Αναλυτική χαρτογράφηση των 13 διοικητικών Περιφερειών της Ελλάδας με τις αντίστοιχες εκλογικές περιφέρειες, τις βουλευτικές έδρες και σχετική ανάλυση.',
  },
  alternates: {
    canonical: `${SITE_URL}/citizen-help/regions-electoral-map`,
  },
};

/* ── Data: 13 administrative regions → electoral constituencies ── */
// Δεδομένα βάσει ΦΕΚ 16/Α/25.01.2023 (απογραφή 2021) και εκλογών Ιουνίου 2023
const regionsData = [
  {
    region: 'Αττική',
    capital: 'Αθήνα',
    constituencies: [
      { name: 'Α΄ Αθηνών', seats: 13 },
      { name: 'Β1΄ Βόρειου Τομέα Αθηνών', seats: 16 },
      { name: 'Β2΄ Δυτικού Τομέα Αθηνών', seats: 12 },
      { name: 'Β3΄ Νότιου Τομέα Αθηνών', seats: 19 },
      { name: 'Ανατολικής Αττικής', seats: 12 },
      { name: 'Δυτικής Αττικής', seats: 4 },
      { name: 'Α΄ Πειραιώς', seats: 6 },
      { name: 'Β΄ Πειραιώς', seats: 8 },
    ],
  },
  {
    region: 'Κεντρική Μακεδονία',
    capital: 'Θεσσαλονίκη',
    constituencies: [
      { name: 'Α΄ Θεσσαλονίκης', seats: 16 },
      { name: 'Β΄ Θεσσαλονίκης', seats: 10 },
      { name: 'Σερρών', seats: 5 },
      { name: 'Ημαθίας', seats: 4 },
      { name: 'Πέλλας', seats: 4 },
      { name: 'Πιερίας', seats: 4 },
      { name: 'Κιλκίς', seats: 3 },
      { name: 'Χαλκιδικής', seats: 3 },
    ],
  },
  {
    region: 'Ανατολική Μακεδονία & Θράκη',
    capital: 'Κομοτηνή',
    constituencies: [
      { name: 'Έβρου', seats: 4 },
      { name: 'Καβάλας', seats: 4 },
      { name: 'Ξάνθης', seats: 3 },
      { name: 'Δράμας', seats: 3 },
      { name: 'Ροδόπης', seats: 3 },
    ],
  },
  {
    region: 'Δυτική Μακεδονία',
    capital: 'Κοζάνη',
    constituencies: [
      { name: 'Κοζάνης', seats: 4 },
      { name: 'Φλώρινας', seats: 2 },
      { name: 'Γρεβενών', seats: 1 },
      { name: 'Καστοριάς', seats: 1 },
    ],
  },
  {
    region: 'Ήπειρος',
    capital: 'Ιωάννινα',
    constituencies: [
      { name: 'Ιωαννίνων', seats: 5 },
      { name: 'Άρτας', seats: 2 },
      { name: 'Πρέβεζας', seats: 2 },
      { name: 'Θεσπρωτίας', seats: 1 },
    ],
  },
  {
    region: 'Θεσσαλία',
    capital: 'Λάρισα',
    constituencies: [
      { name: 'Λαρίσης', seats: 8 },
      { name: 'Μαγνησίας', seats: 5 },
      { name: 'Καρδίτσας', seats: 4 },
      { name: 'Τρικάλων', seats: 4 },
    ],
  },
  {
    region: 'Στερεά Ελλάδα',
    capital: 'Λαμία',
    constituencies: [
      { name: 'Εύβοιας', seats: 6 },
      { name: 'Φθιώτιδας', seats: 4 },
      { name: 'Βοιωτίας', seats: 3 },
      { name: 'Ευρυτανίας', seats: 1 },
      { name: 'Φωκίδας', seats: 1 },
    ],
  },
  {
    region: 'Δυτική Ελλάδα',
    capital: 'Πάτρα',
    constituencies: [
      { name: 'Αχαΐας', seats: 9 },
      { name: 'Αιτωλοακαρνανίας', seats: 7 },
      { name: 'Ηλείας', seats: 5 },
    ],
  },
  {
    region: 'Πελοπόννησος',
    capital: 'Τρίπολη',
    constituencies: [
      { name: 'Μεσσηνίας', seats: 5 },
      { name: 'Κορινθίας', seats: 4 },
      { name: 'Αργολίδας', seats: 3 },
      { name: 'Αρκαδίας', seats: 3 },
      { name: 'Λακωνίας', seats: 3 },
    ],
  },
  {
    region: 'Ιόνια Νησιά',
    capital: 'Κέρκυρα',
    constituencies: [
      { name: 'Κέρκυρας', seats: 3 },
      { name: 'Ζακύνθου', seats: 1 },
      { name: 'Κεφαλληνίας', seats: 1 },
      { name: 'Λευκάδας', seats: 1 },
    ],
  },
  {
    region: 'Βόρειο Αιγαίο',
    capital: 'Μυτιλήνη',
    constituencies: [
      { name: 'Λέσβου', seats: 3 },
      { name: 'Χίου', seats: 2 },
      { name: 'Σάμου', seats: 1 },
    ],
  },
  {
    region: 'Νότιο Αιγαίο',
    capital: 'Ερμούπολη',
    constituencies: [
      { name: 'Δωδεκανήσου', seats: 5 },
      { name: 'Κυκλάδων', seats: 4 },
    ],
  },
  {
    region: 'Κρήτη',
    capital: 'Ηράκλειο',
    constituencies: [
      { name: 'Ηρακλείου', seats: 8 },
      { name: 'Χανίων', seats: 4 },
      { name: 'Λασιθίου', seats: 2 },
      { name: 'Ρεθύμνης', seats: 2 },
    ],
  },
];

function getRegionBadge(totalSeats) {
  if (totalSeats >= 30) return { label: '30+ έδρες', className: 'bg-red-100 text-red-800' };
  if (totalSeats >= 15) return { label: '15–29 έδρες', className: 'bg-yellow-100 text-yellow-800' };
  if (totalSeats >= 8) return { label: '8–14 έδρες', className: 'bg-blue-100 text-blue-800' };
  return { label: '< 8 έδρες', className: 'bg-green-100 text-green-800' };
}

export default function RegionsElectoralMapPage() {
  const enriched = regionsData.map((r) => {
    const totalSeats = r.constituencies.reduce((sum, c) => sum + c.seats, 0);
    return { ...r, totalSeats };
  });

  const sorted = [...enriched].sort((a, b) => b.totalSeats - a.totalSeats);
  const grandTotal = sorted.reduce((sum, r) => sum + r.totalSeats, 0);

  return (
    <StaticPageLayout
      title="Περιφέρειες & Εκλογικές Περιφέρειες"
      maxWidth="max-w-5xl"
      breadcrumb={
        <Link href="/elections" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Εκλογές &amp; Πολιτική
        </Link>
      }
    >
      {/* 1. Intro */}
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η Ελλάδα διαιρείται σε <strong>13 διοικητικές Περιφέρειες</strong> (Καλλικρατικές),
          οι οποίες αποτελούν τη δεύτερη βαθμίδα τοπικής αυτοδιοίκησης. Για τις βουλευτικές εκλογές,
          η χώρα χωρίζεται σε <strong>59 εκλογικές περιφέρειες</strong>,
          στις οποίες κατανέμονται <strong>288 βουλευτικές έδρες</strong> — συν 12 έδρες Επικρατείας.
        </p>
        <p className="text-gray-600 mt-3 text-sm">
          Η παρακάτω ανάλυση παρουσιάζει πώς οι εκλογικές περιφέρειες αντιστοιχούν
          σε κάθε μία από τις 13 Περιφέρειες, μαζί με τον αριθμό βουλευτικών εδρών
          που εκλέγονται σε κάθε περιοχή. Δεδομένα: ΦΕΚ 16/Α/25.01.2023, εκλογές Ιουνίου 2023.
        </p>
      </section>

      {/* 2. Key concepts */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Βασικές Έννοιες</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Περιφέρεια (Διοικητική)</h3>
            <p className="text-gray-700 text-sm">
              Η Περιφέρεια είναι η δεύτερη βαθμίδα αυτοδιοίκησης στην Ελλάδα (Πρόγραμμα Καλλικράτης, Ν. 3852/2010).
              Κάθε Περιφέρεια διοικείται από αιρετό Περιφερειάρχη και Περιφερειακό Συμβούλιο.
              Υπάρχουν <strong>13 Περιφέρειες</strong> στο σύνολο.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Εκλογική Περιφέρεια</h3>
            <p className="text-gray-700 text-sm">
              Η εκλογική περιφέρεια είναι η γεωγραφική μονάδα για τις βουλευτικές εκλογές.
              Αντιστοιχεί κατά κανόνα στις <strong>Περιφερειακές Ενότητες</strong> (πρώην Νομούς),
              με εξαίρεση την Αττική που χωρίζεται σε περισσότερες περιφέρειες.
              Υπάρχουν <strong>59 εκλογικές περιφέρειες</strong> + 12 έδρες Επικρατείας.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Γιατί διαφέρουν;</h3>
            <p className="text-gray-700 text-sm">
              Οι διοικητικές Περιφέρειες δημιουργήθηκαν για τη διοικητική αποκέντρωση (τοπική αυτοδιοίκηση,
              αναπτυξιακός σχεδιασμός), ενώ οι εκλογικές περιφέρειες διατηρούν τη δομή των παλαιών νομών
              για να εξασφαλίζεται τοπική αντιπροσώπευση στη Βουλή.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Summary table */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Συγκεντρωτικός Πίνακας ανά Περιφέρεια</h2>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden"
            aria-label="Πίνακας Περιφερειών με εκλογικές περιφέρειες και έδρες"
          >
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Περιφέρεια</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Πρωτεύουσα</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700 text-right">Εκλ. Περιφέρειες</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700 text-right">Σύνολο Εδρών</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Κατηγορία</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sorted.map((r, i) => {
                const badge = getRegionBadge(r.totalSeats);
                return (
                  <tr key={r.region} className={i % 2 === 1 ? 'bg-gray-50' : undefined}>
                    <td className="px-4 py-3 text-gray-700 font-medium">{r.region}</td>
                    <td className="px-4 py-3 text-gray-600">{r.capital}</td>
                    <td className="px-4 py-3 text-gray-800 font-bold text-right">{r.constituencies.length}</td>
                    <td className="px-4 py-3 text-gray-800 font-bold text-right">{r.totalSeats}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold">
              <tr>
                <td className="px-4 py-3 text-gray-700">Σύνολο</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-gray-800 text-right">{sorted.reduce((s, r) => s + r.constituencies.length, 0)}</td>
                <td className="px-4 py-3 text-gray-800 text-right">{grandTotal}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Δεν περιλαμβάνονται οι 12 έδρες Επικρατείας, οι οποίες κατανέμονται βάσει εθνικού ποσοστού.
        </p>
      </section>

      {/* 4. Detailed breakdown per region */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Αναλυτική Χαρτογράφηση</h2>
        <div className="space-y-6">
          {sorted.map((r) => {
            const badge = getRegionBadge(r.totalSeats);
            return (
              <div key={r.region} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-indigo-700">{r.region}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                    {r.totalSeats} έδρ{r.totalSeats === 1 ? 'α' : 'ες'}
                  </span>
                  <span className="text-sm text-gray-500">Πρωτεύουσα: {r.capital}</span>
                </div>
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm text-left"
                    aria-label={`Εκλογικές περιφέρειες ${r.region}`}
                  >
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th scope="col" className="py-2 pr-4 font-medium text-gray-600">Εκλογική Περιφέρεια</th>
                        <th scope="col" className="py-2 font-medium text-gray-600 text-right">Έδρες</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {r.constituencies.map((c) => (
                        <tr key={c.name}>
                          <td className="py-2 pr-4 text-gray-700">{c.name}</td>
                          <td className="py-2 text-gray-800 font-bold text-right">{c.seats}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Analysis */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Ανάλυση</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏙️ Αστικές vs Αγροτικές Περιφέρειες</h3>
            <p className="text-gray-700 text-sm">
              Η <strong>Αττική</strong> και η <strong>Κεντρική Μακεδονία</strong> συγκεντρώνουν μαζί
              <strong> {enriched.find(r => r.region === 'Αττική')?.totalSeats + enriched.find(r => r.region === 'Κεντρική Μακεδονία')?.totalSeats} από τις {grandTotal} έδρες</strong>,
              αντικατοπτρίζοντας τη δημογραφική υπεροχή της Αθήνας και Θεσσαλονίκης.
              Αντίθετα, μικρότερες Περιφέρειες όπως τα Ιόνια Νησιά, η Δυτική Μακεδονία και το Βόρειο Αιγαίο
              εκλέγουν σημαντικά λιγότερους βουλευτές.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">⚖️ Αντιπροσώπευση</h3>
            <p className="text-gray-700 text-sm">
              Οι μονοεδρικές εκλογικές περιφέρειες (Γρεβενά, Ευρυτανία κ.ά.) τείνουν να ευνοούν τα μεγάλα
              κόμματα, καθώς απαιτούν σχετική πλειοψηφία για την κατάκτηση της μοναδικής έδρας.
              Αντίθετα, πολυεδρικές περιφέρειες (Α΄ Αθηνών, Α΄ Θεσσαλονίκης) επιτρέπουν μεγαλύτερη
              πολυκομματική εκπροσώπηση.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🗺️ Γεωγραφική Κατανομή</h3>
            <p className="text-gray-700 text-sm">
              Μερικές Περιφέρειες έχουν πολλές εκλογικές περιφέρειες αλλά λίγες έδρες ανά μία.
              Π.χ. η <strong>Δυτική Μακεδονία</strong> έχει 4 εκλογικές περιφέρειες αλλά μόνο 6 έδρες
              συνολικά, ενώ η <strong>Κρήτη</strong> με 4 εκλογικές περιφέρειες εκλέγει 16 βουλευτές.
              Αυτό αντανακλά τις πληθυσμιακές διαφορές μεταξύ των περιοχών.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📊 Διοικητική vs Εκλογική Δομή</h3>
            <p className="text-gray-700 text-sm">
              Η διοικητική δομή (Περιφέρειες) δεν ταυτίζεται με την εκλογική. Κάθε Περιφέρεια περιλαμβάνει
              πολλαπλές εκλογικές περιφέρειες. Αυτό σημαίνει ότι ο Περιφερειάρχης (εκλεγμένος σε
              περιφερειακές εκλογές) και οι βουλευτές (εκλεγμένοι στις βουλευτικές εκλογές) λειτουργούν
              σε διαφορετικά γεωγραφικά πλαίσια, ακόμη και εντός της ίδιας Περιφέρειας.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Useful links */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοι Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.ypes.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏛️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Υπουργείο Εσωτερικών (ypes.gr)</p>
              <p className="text-sm text-gray-600">Εκλογική νομοθεσία και αποτελέσματα</p>
            </div>
          </a>
          <a
            href="https://www.hellenicparliament.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏟️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Hellenic Parliament (hellenicparliament.gr)</p>
              <p className="text-sm text-gray-600">Σύνθεση Βουλής</p>
            </div>
          </a>
          <a
            href="https://ekloges.ypes.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🗳️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Εθνικό Εκλογικό Κέντρο</p>
              <p className="text-sm text-gray-600">Αποτελέσματα εκλογών</p>
            </div>
          </a>
          <Link
            href="/citizen-help/prefecture-seats"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">📍</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Εκλογικές Έδρες ανά Περιφερειακή Ενότητα</p>
              <p className="text-sm text-gray-600">Αναλυτικός πίνακας εδρών ανά εκλογική περιφέρεια</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 7. Disclaimer */}
      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Τα δεδομένα βασίζονται στην ισχύουσα εκλογική νομοθεσία και τα αποτελέσματα των βουλευτικών εκλογών
          του 2023. Ο αριθμός εδρών μπορεί να τροποποιηθεί βάσει αλλαγών στον εκλογικό νόμο ή δημογραφικών
          μεταβολών. Η αντιστοίχιση Περιφερειών – εκλογικών περιφερειών αντικατοπτρίζει τη γεωγραφική
          ένταξη κάθε Περιφερειακής Ενότητας (πρώην Νομού) στην αντίστοιχη Περιφέρεια.
        </p>
      </section>
    </StaticPageLayout>
  );
}
