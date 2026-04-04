import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Εκλογικές Έδρες ανά Περιφερειακή Ενότητα — Βουλευτικές Εκλογές Ελλάδας',
  description: 'Αναλυτικός πίνακας με τις βουλευτικές έδρες που εκλέγονται σε κάθε εκλογική περιφέρεια της Ελλάδας βάσει του εκλογικού νόμου και των αποτελεσμάτων του 2023.',
  openGraph: {
    title: 'Εκλογικές Έδρες ανά Περιφερειακή Ενότητα — Βουλευτικές Εκλογές Ελλάδας',
    description: 'Αναλυτικός πίνακας με τις βουλευτικές έδρες που εκλέγονται σε κάθε εκλογική περιφέρεια της Ελλάδας βάσει του εκλογικού νόμου και των αποτελεσμάτων του 2023.',
    url: `${SITE_URL}/citizen-help/prefecture-seats`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Εκλογικές Έδρες ανά Περιφερειακή Ενότητα — Βουλευτικές Εκλογές Ελλάδας',
    description: 'Αναλυτικός πίνακας με τις βουλευτικές έδρες που εκλέγονται σε κάθε εκλογική περιφέρεια της Ελλάδας βάσει του εκλογικού νόμου και των αποτελεσμάτων του 2023.',
  },
  alternates: {
    canonical: `${SITE_URL}/citizen-help/prefecture-seats`,
  },
};

const constituencies = [
  { name: 'Α΄ Αθηνών', region: 'Αττική', seats: 17 },
  { name: 'Β΄ Αθηνών', region: 'Αττική', seats: 9 },
  { name: 'Α΄ Θεσσαλονίκης', region: 'Κεντρική Μακεδονία', seats: 16 },
  { name: 'Ηρακλείου', region: 'Κρήτη', seats: 8 },
  { name: 'Αχαΐας', region: 'Δυτική Ελλάδα', seats: 7 },
  { name: 'Α΄ Πειραιώς', region: 'Αττική', seats: 6 },
  { name: 'Λαρίσης', region: 'Θεσσαλία', seats: 5 },
  { name: 'Αιτωλοακαρνανίας', region: 'Δυτική Ελλάδα', seats: 5 },
  { name: 'Δωδεκανήσου', region: 'Νότιο Αιγαίο', seats: 5 },
  { name: 'Έβρου', region: 'Ανατολική Μακεδονία & Θράκη', seats: 4 },
  { name: 'Εύβοιας', region: 'Στερεά Ελλάδα', seats: 4 },
  { name: 'Ηλείας', region: 'Δυτική Ελλάδα', seats: 4 },
  { name: 'Ιωαννίνων', region: 'Ήπειρος', seats: 4 },
  { name: 'Μαγνησίας', region: 'Θεσσαλία', seats: 4 },
  { name: 'Μεσσηνίας', region: 'Πελοπόννησος', seats: 4 },
  { name: 'Σερρών', region: 'Κεντρική Μακεδονία', seats: 4 },
  { name: 'Φθιώτιδας', region: 'Στερεά Ελλάδα', seats: 4 },
  { name: 'Χανίων', region: 'Κρήτη', seats: 4 },
  { name: 'Αργολίδας', region: 'Πελοπόννησος', seats: 3 },
  { name: 'Αρκαδίας', region: 'Πελοπόννησος', seats: 3 },
  { name: 'Β΄ Θεσσαλονίκης', region: 'Κεντρική Μακεδονία', seats: 3 },
  { name: 'Β΄ Πειραιώς', region: 'Αττική', seats: 3 },
  { name: 'Βοιωτίας', region: 'Στερεά Ελλάδα', seats: 3 },
  { name: 'Ημαθίας', region: 'Κεντρική Μακεδονία', seats: 3 },
  { name: 'Καβάλας', region: 'Ανατολική Μακεδονία & Θράκη', seats: 3 },
  { name: 'Καρδίτσας', region: 'Θεσσαλία', seats: 3 },
  { name: 'Κοζάνης', region: 'Δυτική Μακεδονία', seats: 3 },
  { name: 'Κορινθίας', region: 'Πελοπόννησος', seats: 3 },
  { name: 'Λέσβου', region: 'Βόρειο Αιγαίο', seats: 3 },
  { name: 'Πέλλης', region: 'Κεντρική Μακεδονία', seats: 3 },
  { name: 'Πιερίας', region: 'Κεντρική Μακεδονία', seats: 3 },
  { name: 'Τρικάλων', region: 'Θεσσαλία', seats: 3 },
  { name: 'Ξάνθης', region: 'Ανατολική Μακεδονία & Θράκη', seats: 3 },
  { name: 'Άρτας', region: 'Ήπειρος', seats: 2 },
  { name: 'Δράμας', region: 'Ανατολική Μακεδονία & Θράκη', seats: 2 },
  { name: 'Κέρκυρας', region: 'Ιόνια Νησιά', seats: 2 },
  { name: 'Κιλκίς', region: 'Κεντρική Μακεδονία', seats: 2 },
  { name: 'Κυκλάδων', region: 'Νότιο Αιγαίο', seats: 2 },
  { name: 'Λακωνίας', region: 'Πελοπόννησος', seats: 2 },
  { name: 'Λασιθίου', region: 'Κρήτη', seats: 2 },
  { name: 'Ρεθύμνης', region: 'Κρήτη', seats: 2 },
  { name: 'Ροδόπης', region: 'Ανατολική Μακεδονία & Θράκη', seats: 2 },
  { name: 'Χαλκιδικής', region: 'Κεντρική Μακεδονία', seats: 2 },
  { name: 'Γρεβενών', region: 'Δυτική Μακεδονία', seats: 1 },
  { name: 'Ευρυτανίας', region: 'Στερεά Ελλάδα', seats: 1 },
  { name: 'Ζακύνθου', region: 'Ιόνια Νησιά', seats: 1 },
  { name: 'Θεσπρωτίας', region: 'Ήπειρος', seats: 1 },
  { name: 'Καστοριάς', region: 'Δυτική Μακεδονία', seats: 1 },
  { name: 'Κεφαλληνίας', region: 'Ιόνια Νησιά', seats: 1 },
  { name: 'Λευκάδας', region: 'Ιόνια Νησιά', seats: 1 },
  { name: 'Πρέβεζας', region: 'Ήπειρος', seats: 1 },
  { name: 'Σάμου', region: 'Βόρειο Αιγαίο', seats: 1 },
  { name: 'Φλώρινας', region: 'Δυτική Μακεδονία', seats: 1 },
  { name: 'Φωκίδας', region: 'Στερεά Ελλάδα', seats: 1 },
  { name: 'Χίου', region: 'Βόρειο Αιγαίο', seats: 1 },
  // Εθνική εκλογική περιφέρεια — κατανέμεται βάσει εθνικού ποσοστού κομμάτων
  { name: 'Επικρατείας', region: 'Εθνική', seats: 1 },
];

function getSeatsBadge(seats) {
  if (seats === 1) return { label: '1 έδρα', className: 'bg-green-100 text-green-800' };
  if (seats <= 3) return { label: '2–3 έδρες', className: 'bg-blue-100 text-blue-800' };
  if (seats <= 5) return { label: '4–5 έδρες', className: 'bg-yellow-100 text-yellow-800' };
  return { label: '6+ έδρες', className: 'bg-red-100 text-red-800' };
}

export default function PrefectureSeatsPage() {
  const sorted = [...constituencies].sort((a, b) => b.seats - a.seats);

  return (
    <StaticPageLayout
      title="Εκλογικές Έδρες ανά Περιφερειακή Ενότητα"
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
          Η Ελλάδα χρησιμοποιεί <strong>αναλογικό εκλογικό σύστημα</strong>
          όπου κάθε εκλογική περιφέρεια (περιφερειακή ενότητα) εκλέγει έναν αριθμό βουλευτών
          ανάλογα με τον εγγεγραμμένο εκλογικό πληθυσμό της. Το σύνολο των βουλευτικών εδρών
          είναι <strong>300</strong>. Μία έδρα ανήκει στην Επικρατεία (Επικρατείας), ενώ οι
          υπόλοιπες <strong>299</strong> κατανέμονται στις εκλογικές περιφέρειες.
        </p>
      </section>

      {/* 2. Full data table */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Εκλογικές Έδρες ανά Εκλογική Περιφέρεια</h2>
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
        <h2 className="text-2xl font-semibold mb-3">Στατιστικά Στοιχεία</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏛️ Συνολικές Έδρες</h3>
            <p className="text-gray-700 text-sm"><strong>300</strong> βουλευτικές έδρες συνολικά</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🗺️ Εκλογικές Περιφέρειες</h3>
            <p className="text-gray-700 text-sm"><strong>{constituencies.filter(c => c.region !== 'Εθνική').length}</strong> εκλογικές περιφέρειες + Επικρατείας</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📍 Μεγαλύτερη Περιφέρεια</h3>
            <p className="text-gray-700 text-sm">Α΄ Αθηνών με <strong>17 έδρες</strong></p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📌 Μικρότερες Περιφέρειες</h3>
            <p className="text-gray-700 text-sm"><strong>1 έδρα</strong> (Γρεβενά, Ευρυτανία κ.α.)</p>
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
            <h3 className="text-lg font-semibold mb-1">3. Επικρατείας</h3>
            <p className="text-gray-700 text-sm">
              1 έδρα απονέμεται ως εθνική εκλογική περιφέρεια (Επικρατείας) βάσει του
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
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες βασίζονται στην εκλογική νομοθεσία και τα αποτελέσματα των εκλογών του 2023.
          Ο αριθμός των εδρών μπορεί να αναθεωρείται πριν από κάθε εκλογική αναμέτρηση βάσει του εκλογικού νόμου.
        </p>
      </section>
    </StaticPageLayout>
  );
}
