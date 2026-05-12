import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Εκλογικές Έδρες ανά Εκλογική Περιφέρεια — Βουλευτικές Εκλογές Ελλάδας 2023',
  description: 'Αναλυτικός πίνακας με τις 288 βουλευτικές έδρες που εκλέγονται σε κάθε εκλογική περιφέρεια της Ελλάδας και τις 12 έδρες Επικρατείας, βάσει του ΦΕΚ 16/Α/2023.',
  openGraph: {
    title: 'Εκλογικές Έδρες ανά Εκλογική Περιφέρεια — Βουλευτικές Εκλογές Ελλάδας 2023',
    description: 'Αναλυτικός πίνακας με τις 288 βουλευτικές έδρες που εκλέγονται σε κάθε εκλογική περιφέρεια της Ελλάδας και τις 12 έδρες Επικρατείας, βάσει του ΦΕΚ 16/Α/2023.',
    url: `${SITE_URL}/citizen-help/prefecture-seats`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Εκλογικές Έδρες ανά Εκλογική Περιφέρεια — Βουλευτικές Εκλογές Ελλάδας 2023',
    description: 'Αναλυτικός πίνακας με τις 288 βουλευτικές έδρες που εκλέγονται σε κάθε εκλογική περιφέρεια της Ελλάδας και τις 12 έδρες Επικρατείας, βάσει του ΦΕΚ 16/Α/2023.',
  },
  alternates: {
    canonical: `${SITE_URL}/citizen-help/prefecture-seats`,
  },
};

// Δεδομένα βάσει ΦΕΚ 16/Α/25.01.2023 (απογραφή 2021) και αποτελεσμάτων εκλογών Ιουνίου 2023
// Πηγές: Υπουργείο Εσωτερικών (ypes.gr), Βουλή των Ελλήνων (hellenicparliament.gr)
const constituencies = [
  // Αττική
  { name: 'Α΄ Αθηνών', region: 'Αττική', seats: 13 },
  { name: 'Β1΄ Βόρειου Τομέα Αθηνών', region: 'Αττική', seats: 16 },
  { name: 'Β2΄ Δυτικού Τομέα Αθηνών', region: 'Αττική', seats: 12 },
  { name: 'Β3΄ Νότιου Τομέα Αθηνών', region: 'Αττική', seats: 19 },
  { name: 'Ανατολικής Αττικής', region: 'Αττική', seats: 12 },
  { name: 'Δυτικής Αττικής', region: 'Αττική', seats: 4 },
  { name: 'Α΄ Πειραιώς', region: 'Αττική', seats: 6 },
  { name: 'Β΄ Πειραιώς', region: 'Αττική', seats: 8 },
  // Κεντρική Μακεδονία
  { name: 'Α΄ Θεσσαλονίκης', region: 'Κεντρική Μακεδονία', seats: 16 },
  { name: 'Β΄ Θεσσαλονίκης', region: 'Κεντρική Μακεδονία', seats: 10 },
  { name: 'Ημαθίας', region: 'Κεντρική Μακεδονία', seats: 4 },
  { name: 'Κιλκίς', region: 'Κεντρική Μακεδονία', seats: 3 },
  { name: 'Πέλλας', region: 'Κεντρική Μακεδονία', seats: 4 },
  { name: 'Πιερίας', region: 'Κεντρική Μακεδονία', seats: 4 },
  { name: 'Σερρών', region: 'Κεντρική Μακεδονία', seats: 5 },
  { name: 'Χαλκιδικής', region: 'Κεντρική Μακεδονία', seats: 3 },
  // Θεσσαλία
  { name: 'Καρδίτσας', region: 'Θεσσαλία', seats: 4 },
  { name: 'Λαρίσης', region: 'Θεσσαλία', seats: 8 },
  { name: 'Μαγνησίας', region: 'Θεσσαλία', seats: 5 },
  { name: 'Τρικάλων', region: 'Θεσσαλία', seats: 4 },
  // Κρήτη
  { name: 'Ηρακλείου', region: 'Κρήτη', seats: 8 },
  { name: 'Λασιθίου', region: 'Κρήτη', seats: 2 },
  { name: 'Ρεθύμνης', region: 'Κρήτη', seats: 2 },
  { name: 'Χανίων', region: 'Κρήτη', seats: 4 },
  // Ανατολική Μακεδονία & Θράκη
  { name: 'Δράμας', region: 'Ανατολική Μακεδονία & Θράκη', seats: 3 },
  { name: 'Έβρου', region: 'Ανατολική Μακεδονία & Θράκη', seats: 4 },
  { name: 'Καβάλας', region: 'Ανατολική Μακεδονία & Θράκη', seats: 4 },
  { name: 'Ξάνθης', region: 'Ανατολική Μακεδονία & Θράκη', seats: 3 },
  { name: 'Ροδόπης', region: 'Ανατολική Μακεδονία & Θράκη', seats: 3 },
  // Δυτική Ελλάδα
  { name: 'Αιτωλοακαρνανίας', region: 'Δυτική Ελλάδα', seats: 7 },
  { name: 'Αχαΐας', region: 'Δυτική Ελλάδα', seats: 9 },
  { name: 'Ηλείας', region: 'Δυτική Ελλάδα', seats: 5 },
  // Πελοπόννησος
  { name: 'Αργολίδας', region: 'Πελοπόννησος', seats: 3 },
  { name: 'Αρκαδίας', region: 'Πελοπόννησος', seats: 3 },
  { name: 'Κορινθίας', region: 'Πελοπόννησος', seats: 4 },
  { name: 'Λακωνίας', region: 'Πελοπόννησος', seats: 3 },
  { name: 'Μεσσηνίας', region: 'Πελοπόννησος', seats: 5 },
  // Στερεά Ελλάδα
  { name: 'Βοιωτίας', region: 'Στερεά Ελλάδα', seats: 3 },
  { name: 'Εύβοιας', region: 'Στερεά Ελλάδα', seats: 6 },
  { name: 'Ευρυτανίας', region: 'Στερεά Ελλάδα', seats: 1 },
  { name: 'Φθιώτιδας', region: 'Στερεά Ελλάδα', seats: 4 },
  { name: 'Φωκίδας', region: 'Στερεά Ελλάδα', seats: 1 },
  // Ήπειρος
  { name: 'Άρτας', region: 'Ήπειρος', seats: 2 },
  { name: 'Ιωαννίνων', region: 'Ήπειρος', seats: 5 },
  { name: 'Πρέβεζας', region: 'Ήπειρος', seats: 2 },
  { name: 'Θεσπρωτίας', region: 'Ήπειρος', seats: 1 },
  // Δυτική Μακεδονία
  { name: 'Γρεβενών', region: 'Δυτική Μακεδονία', seats: 1 },
  { name: 'Καστοριάς', region: 'Δυτική Μακεδονία', seats: 1 },
  { name: 'Κοζάνης', region: 'Δυτική Μακεδονία', seats: 4 },
  { name: 'Φλώρινας', region: 'Δυτική Μακεδονία', seats: 2 },
  // Νότιο Αιγαίο
  { name: 'Δωδεκανήσου', region: 'Νότιο Αιγαίο', seats: 5 },
  { name: 'Κυκλάδων', region: 'Νότιο Αιγαίο', seats: 4 },
  // Βόρειο Αιγαίο
  { name: 'Λέσβου', region: 'Βόρειο Αιγαίο', seats: 3 },
  { name: 'Σάμου', region: 'Βόρειο Αιγαίο', seats: 1 },
  { name: 'Χίου', region: 'Βόρειο Αιγαίο', seats: 2 },
  // Ιόνια Νησιά
  { name: 'Κέρκυρας', region: 'Ιόνια Νησιά', seats: 3 },
  { name: 'Κεφαλληνίας', region: 'Ιόνια Νησιά', seats: 1 },
  { name: 'Λευκάδας', region: 'Ιόνια Νησιά', seats: 1 },
  { name: 'Ζακύνθου', region: 'Ιόνια Νησιά', seats: 1 },
  // Εθνική εκλογική περιφέρεια — κατανέμεται βάσει εθνικού ποσοστού κομμάτων
  { name: 'Επικρατείας', region: 'Εθνική', seats: 12 },
];

function getSeatsBadge(seats) {
  if (seats === 1) return { label: '1 έδρα', className: 'bg-gray-100 text-gray-700' };
  if (seats <= 4) return { label: '2–4 έδρες', className: 'bg-green-100 text-green-800' };
  if (seats <= 9) return { label: '5–9 έδρες', className: 'bg-blue-100 text-blue-800' };
  if (seats <= 13) return { label: '10–13 έδρες', className: 'bg-yellow-100 text-yellow-800' };
  return { label: '14+ έδρες', className: 'bg-red-100 text-red-800' };
}

export default function PrefectureSeatsPage() {
  const sorted = [...constituencies].sort((a, b) => b.seats - a.seats);

  return (
    <StaticPageLayout
      title="Εκλογικές Έδρες ανά Εκλογική Περιφέρεια"
      maxWidth="max-w-4xl"
      breadcrumb={
        <Link href="/elections" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Εκλογές &amp; Πολιτική
        </Link>
      }
    >
      {/* 1. Intro */}
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η Ελλάδα εκλέγει <strong>300 βουλευτές</strong> με ενισχυμένο αναλογικό σύστημα.
          Από αυτούς, <strong>288 έδρες</strong> κατανέμονται σε 59 εκλογικές περιφέρειες
          βάσει του εκλογικού πληθυσμού (απογραφή 2021), και <strong>12 έδρες</strong> ανήκουν
          στο ψηφοδέλτιο <strong>Επικρατείας</strong>, που κατανέμεται σε εθνικό επίπεδο βάσει
          του ποσοστού κάθε κόμματος.
        </p>
        <p className="text-sm text-gray-500 mt-3">
          Δεδομένα βάσει ΦΕΚ 16/Α/25.01.2023 και εκλογών Ιουνίου 2023.
          Πηγές: Υπουργείο Εσωτερικών (<a href="https://www.ypes.gr" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">ypes.gr</a>),
          Βουλή των Ελλήνων (<a href="https://www.hellenicparliament.gr" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">hellenicparliament.gr</a>).
        </p>
      </section>

      {/* 2. Full data table */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Εκλογικές Έδρες ανά Εκλογική Περιφέρεια (2023)</h2>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden"
            aria-label="Πίνακας εκλογικών εδρών ανά εκλογική περιφέρεια"
          >
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Εκλογική Περιφέρεια</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Περιφέρεια</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700 text-right">Έδρες</th>
                <th scope="col" className="px-4 py-3 font-semibold text-gray-700">Κατηγορία</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sorted.map((c, i) => {
                const badge = getSeatsBadge(c.seats);
                return (
                  <tr key={c.name} className={i % 2 === 1 ? 'bg-gray-50' : undefined}>
                    <td className="px-4 py-3 text-gray-700 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.region}</td>
                    <td className="px-4 py-3 text-gray-800 font-bold text-right">{c.seats}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Summary statistics */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Συνοπτικά Στοιχεία</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏛️ Εκλογικές Περιφέρειες</h3>
            <p className="text-gray-700 text-sm"><strong>288 έδρες</strong> σε 59 εκλογικές περιφέρειες</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🇬🇷 Επικρατείας</h3>
            <p className="text-gray-700 text-sm"><strong>12 έδρες</strong> πανελλαδικό ψηφοδέλτιο</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📍 Μεγαλύτερη Περιφέρεια</h3>
            <p className="text-gray-700 text-sm">Β3΄ Νότιου Τομέα Αθηνών με <strong>19 έδρες</strong></p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📌 Μονοεδρικές Περιφέρειες</h3>
            <p className="text-gray-700 text-sm"><strong>1 έδρα</strong> (Γρεβενά, Ευρυτανία, Ζάκυνθος, Θεσπρωτία, Καστοριά, Κεφαλληνία, Λευκάδα, Σάμος, Φωκίδα)</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5 md:col-span-2">
            <h3 className="text-lg font-semibold mb-3 text-indigo-700">📊 Εθνικό Σύνολο</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-800">288</p>
                <p className="text-xs text-gray-600 mt-1">Εκλογικές Περιφέρειες</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-800">12</p>
                <p className="text-xs text-gray-600 mt-1">Επικρατείας</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-800">300</p>
                <p className="text-xs text-gray-600 mt-1">Σύνολο Βουλευτών</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How distribution works */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Πώς Υπολογίζονται οι Έδρες</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">1. Βάση Πληθυσμού</h3>
            <p className="text-gray-700 text-sm">
              Οι έδρες κατανέμονται βάσει του εγγεγραμμένου εκλογικού σώματος κάθε περιφέρειας
              με τη μέθοδο Hagenbach-Bischoff (εκλογικό πηλίκο).
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">2. Πολλαπλές Κατανομές</h3>
            <p className="text-gray-700 text-sm">
              Τυχόν αδιάθετες έδρες μετά την πρώτη κατανομή διανέμονται μέσω διαδοχικών
              πηλίκων σε κόμματα που πληρούν τα όρια εισόδου (3% εθνικού ποσοστού).
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">3. Επικρατείας (12 έδρες)</h3>
            <p className="text-gray-700 text-sm">
              12 έδρες κατανέμονται ως εθνική εκλογική περιφέρεια (Επικρατείας) βάσει του
              εθνικού ποσοστού κομμάτων. Κάθε κόμμα που λαμβάνει ≥3% εθνικά δικαιούται
              τουλάχιστον 1 έδρα Επικρατείας.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Useful links */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοί Σύνδεσμοι</h2>
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
        </div>
      </section>

      {/* 6. Disclaimer */}
      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Πηγές & Σημειώσεις</h2>
        <p className="text-gray-700 text-sm">
          Τα δεδομένα βασίζονται στο <strong>ΦΕΚ 16/Α/25.01.2023</strong> (Προεδρικό Διάταγμα,
          κατανομή εδρών βάσει απογραφής 2021) και τα αποτελέσματα των βουλευτικών εκλογών
          Ιουνίου 2023. Η τελευταία ενημέρωση έγινε για τις εκλογές Ιουνίου 2023.
          Πηγές: <a href="https://www.ypes.gr" target="_blank" rel="noopener noreferrer" className="underline">Υπουργείο Εσωτερικών</a>,{' '}
          <a href="https://www.hellenicparliament.gr" target="_blank" rel="noopener noreferrer" className="underline">Βουλή των Ελλήνων</a>.
          Ο αριθμός των εδρών ανά περιφέρεια μπορεί να αναθεωρηθεί πριν από μελλοντικές εκλογές
          βάσει νέων απογραφικών δεδομένων.
        </p>
      </section>
    </StaticPageLayout>
  );
}
