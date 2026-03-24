import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Σύγκριση Τιμών Ενέργειας - Απόφαση',
  description: 'Σύγκριση τιμών παρόχων ηλεκτρικής ενέργειας στην Ελλάδα. Χρεώσεις kWh, πάγια, εκπτώσεις και πράσινη ενέργεια για ΔΕΗ, Protergia, Elpedison, Ηρών, Volton, NRG, Watt+Volt, Zenith.',
  openGraph: {
    title: 'Σύγκριση Τιμών Ενέργειας - Απόφαση',
    description: 'Σύγκριση τιμών παρόχων ηλεκτρικής ενέργειας στην Ελλάδα. Χρεώσεις kWh, πάγια, εκπτώσεις και πράσινη ενέργεια.',
    url: `${SITE_URL}/price-comparison/energy`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Σύγκριση Τιμών Ενέργειας - Απόφαση',
    description: 'Σύγκριση τιμών παρόχων ηλεκτρικής ενέργειας στην Ελλάδα.',
  },
  alternates: {
    canonical: `${SITE_URL}/price-comparison/energy`,
  },
};

export default function EnergyPriceComparisonPage() {
  return (
    <StaticPageLayout
      title="Σύγκριση Τιμών Ενέργειας"
      maxWidth="max-w-5xl"
      breadcrumb={
        <span>
          <Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">Σελίδες</Link>
          {' → '}
          <Link href="/price-comparison" className="text-gray-500 hover:text-blue-600 transition-colors">Σύγκριση Τιμών</Link>
          {' → '}
          <span className="text-gray-700">Ενέργεια</span>
        </span>
      }
    >
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η ελληνική αγορά ενέργειας έχει απελευθερωθεί πλήρως, δίνοντας στους καταναλωτές τη δυνατότητα
          να επιλέξουν ανάμεσα σε πολλούς παρόχους ηλεκτρικής ενέργειας. Η σωστή σύγκριση μπορεί να
          οδηγήσει σε εξοικονόμηση εκατοντάδων ευρώ ετησίως για ένα μέσο νοικοκυριό.
        </p>
        <p className="mt-4 text-sm text-gray-500 italic">
          Τελευταία ενημέρωση: Μάρτιος 2026. Οι τιμές είναι ενδεικτικές για οικιακή κατανάλωση και
          ενδέχεται να έχουν αλλάξει. Επαληθεύστε πάντα στον ιστότοπο του παρόχου.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Πίνακας Σύγκρισης Παρόχων</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-indigo-700 text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">Πάροχος</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Χρέωση Ενέργειας (€/kWh)</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Πάγιο (€/μήνα)</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Έκπτωση Συνέπειας</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Πράσινη Ενέργεια</th>
                <th className="px-4 py-3 font-semibold">Σύμβαση</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">ΔΕΗ</td>
                <td className="px-4 py-3 text-gray-700">0,1380</td>
                <td className="px-4 py-3 text-gray-700">3,50</td>
                <td className="px-4 py-3 text-gray-700">Ναι – 10%</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3">
                  <a href="https://www.dei.gr/el/home/oikiakoiPelates/timologia" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">dei.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Protergia / ΜΥΤΙΛΗΝΑΙΟΣ</td>
                <td className="px-4 py-3 text-gray-700">0,1290</td>
                <td className="px-4 py-3 text-gray-700">3,00</td>
                <td className="px-4 py-3 text-gray-700">Ναι – 15%</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3">
                  <a href="https://www.protergia.gr/timologia" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">protergia.gr →</a>
                </td>
              </tr>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Elpedison</td>
                <td className="px-4 py-3 text-gray-700">0,1320</td>
                <td className="px-4 py-3 text-gray-700">3,20</td>
                <td className="px-4 py-3 text-gray-700">Ναι – 12%</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3">
                  <a href="https://www.elpedison.gr/oikiaki-xrisi/timologia" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">elpedison.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Ηρων</td>
                <td className="px-4 py-3 text-gray-700">0,1350</td>
                <td className="px-4 py-3 text-gray-700">2,80</td>
                <td className="px-4 py-3 text-gray-700">Ναι – 10%</td>
                <td className="px-4 py-3 text-gray-700">Όχι</td>
                <td className="px-4 py-3">
                  <a href="https://www.heron.gr/oikiaki-xrisi/timologia" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">heron.gr →</a>
                </td>
              </tr>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Φυσικό Αέριο ΕΕΕ</td>
                <td className="px-4 py-3 text-gray-700">0,1310</td>
                <td className="px-4 py-3 text-gray-700">3,10</td>
                <td className="px-4 py-3 text-gray-700">Όχι</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3">
                  <a href="https://www.fysikoaerio.gr/timologia" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">fysikoaerio.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Volton</td>
                <td className="px-4 py-3 text-gray-700">0,1270</td>
                <td className="px-4 py-3 text-gray-700">2,90</td>
                <td className="px-4 py-3 text-gray-700">Ναι – 10%</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3">
                  <a href="https://www.volton.gr/timologia" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">volton.gr →</a>
                </td>
              </tr>
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">NRG</td>
                <td className="px-4 py-3 text-gray-700">0,1300</td>
                <td className="px-4 py-3 text-gray-700">3,00</td>
                <td className="px-4 py-3 text-gray-700">Ναι – 8%</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3">
                  <a href="https://www.nrgenergy.gr/timologia" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">nrgenergy.gr →</a>
                </td>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">Watt+Volt</td>
                <td className="px-4 py-3 text-gray-700">0,1340</td>
                <td className="px-4 py-3 text-gray-700">3,40</td>
                <td className="px-4 py-3 text-gray-700">Ναι – 12%</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3">
                  <a href="https://www.watt-volt.gr/timologia" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">watt-volt.gr →</a>
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-3 font-medium text-gray-900">Zenith</td>
                <td className="px-4 py-3 text-gray-700">0,1360</td>
                <td className="px-4 py-3 text-gray-700">3,60</td>
                <td className="px-4 py-3 text-gray-700">Όχι</td>
                <td className="px-4 py-3 text-gray-700">Ναι</td>
                <td className="px-4 py-3">
                  <a href="https://www.zenith.gr/timologia" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">zenith.gr →</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          * Οι τιμές αφορούν τυπικό οικιακό τιμολόγιο χαμηλής τάσης (Γ1). Δεν συμπεριλαμβάνονται ΦΠΑ,
          τέλη ΕΤΜΕΑΡ, ΥΚΩ και λοιπές κρατικές επιβαρύνσεις. Η έκπτωση συνέπειας χορηγείται συνήθως
          σε εμπρόθεσμη εξόφληση.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Ανάλυση & Σύγκριση Παρόχων</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>Χαμηλότερη χρέωση ενέργειας:</strong> Η Volton εμφανίζει την πιο ανταγωνιστική χρέωση
            ανά kWh (0,1270 €), ακολουθούμενη από την Protergia (0,1290 €) και τη Φυσικό Αέριο ΕΕΕ (0,1310 €).
            Αν καταναλώνετε πάνω από 300 kWh το μήνα, η διαφορά μεταξύ φθηνότερου και ακριβότερου παρόχου
            μπορεί να ξεπεράσει τα 40 € ανά μήνα.
          </p>
          <p className="text-gray-700">
            <strong>Καλύτερες εκπτώσεις συνέπειας:</strong> Η Protergia προσφέρει την υψηλότερη έκπτωση
            συνέπειας στο 15%, ενώ Elpedison και Watt+Volt ακολουθούν με 12%. Ηρων, Volton και ΔΕΗ
            προσφέρουν 10%. Η NRG προσφέρει χαμηλότερη έκπτωση 8%, ενώ Φυσικό Αέριο ΕΕΕ και Zenith
            δεν παρέχουν έκπτωση συνέπειας.
          </p>
          <p className="text-gray-700">
            <strong>Πράσινη ενέργεια:</strong> Η πλειονότητα των παρόχων προσφέρει πλέον επιλογές πράσινης
            ενέργειας (από ανανεώσιμες πηγές). Εξαίρεση αποτελεί η Ηρων, που δεν διαθέτει αντίστοιχο
            πακέτο. Αν η περιβαλλοντική επίπτωση αποτελεί προτεραιότητα για εσάς, επαληθεύστε τα
            πιστοποιητικά εγγύησης προέλευσης (Guarantees of Origin) στον ιστότοπο του παρόχου.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Συμβουλές για Αλλαγή Παρόχου</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ελέγξτε τη ρήτρα αναπροσαρμογής</h3>
            <p className="text-gray-700 text-sm">
              Πολλά συμβόλαια περιλαμβάνουν ρήτρα αναπροσαρμογής που επιτρέπει στον πάροχο να αλλάξει
              τις τιμές με σύντομη προειδοποίηση. Διαβάστε προσεκτικά τους όρους πριν υπογράψετε,
              ιδιαίτερα για συμβόλαια σταθερής τιμής.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Προσοχή σε κρυφές χρεώσεις</h3>
            <p className="text-gray-700 text-sm">
              Πέρα από τη χρέωση ενέργειας και το πάγιο, ελέγξτε αν υπάρχουν χρεώσεις για έκδοση
              λογαριασμού, ηλεκτρονική εξυπηρέτηση ή πρόωρη καταγγελία σύμβασης. Αυτές μπορούν να
              επηρεάσουν σημαντικά το συνολικό κόστος.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Διαδικασία αλλαγής παρόχου</h3>
            <p className="text-gray-700 text-sm">
              Η αλλαγή παρόχου στην Ελλάδα είναι σχετικά απλή: επικοινωνείτε με τον νέο πάροχο,
              παρέχετε τον αριθμό παροχής σας (ΗΚΑΣΠ) και ο νέος πάροχος αναλαμβάνει τη διαδικασία
              μεταφοράς μέσω ΔΕΔΔΗΕ. Η αλλαγή ολοκληρώνεται συνήθως εντός 1-2 κύκλων τιμολόγησης
              χωρίς διακοπή ρεύματος.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Αξιοποιήστε εποχιακές προσφορές</h3>
            <p className="text-gray-700 text-sm">
              Πολλοί πάροχοι εκδίδουν ειδικές προσφορές το φθινόπωρο ή την άνοιξη. Παρακολουθείτε
              τακτικά τις ανακοινώσεις τους ή εγγραφείτε στο newsletter τους για να μην χάσετε
              ευκαιρίες εξοικονόμησης.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Χρήσιμοι Σύνδεσμοι</h2>
        <ul className="space-y-3">
          <li>
            <a href="https://www.rae.gr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
              ΡΑΕ – Ρυθμιστική Αρχή Ενέργειας
            </a>
            <span className="text-gray-600 text-sm"> — Επίσημος ρυθμιστής της ενεργειακής αγοράς στην Ελλάδα. Καταγγελίες, νομοθεσία και στατιστικά τιμών.</span>
          </li>
          <li>
            <a href="https://www.energycost.gr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
              energycost.gr
            </a>
            <span className="text-gray-600 text-sm"> — Επίσημο εργαλείο σύγκρισης τιμολογίων ενέργειας της ΡΑΕ για οικιακούς και επαγγελματικούς καταναλωτές.</span>
          </li>
          <li>
            <a href="https://www.deddie.gr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
              ΔΕΔΔΗΕ – Διαχειριστής Ελληνικού Δικτύου Διανομής Ηλεκτρικής Ενέργειας
            </a>
            <span className="text-gray-600 text-sm"> — Υπεύθυνος για τη διαχείριση του δικτύου διανομής και τη διαδικασία αλλαγής παρόχου.</span>
          </li>
          <li>
            <a href="https://www.synigoroskatanaloti.gr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
              Συνήγορος του Καταναλωτή
            </a>
            <span className="text-gray-600 text-sm"> — Για καταγγελίες και διαμεσολάβηση σε διαφορές με παρόχους ενέργειας.</span>
          </li>
        </ul>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Ψήφισε & μοιράσου εμπειρίες κόστους ενέργειας</h2>
        <p className="text-gray-700 text-sm mb-4">
          Ποιον πάροχο χρησιμοποιείς; Είσαι ικανοποιημένος με τις τιμές; Συμμετέχοντας στις ψηφοφορίες
          της κοινότητας, βοηθάς άλλα νοικοκυριά να πάρουν πιο ενημερωμένες αποφάσεις για τον πάροχο
          ενέργειάς τους.
        </p>
        <Link href="/polls" className="inline-block bg-indigo-600 text-white text-sm px-5 py-2 rounded-md hover:bg-indigo-700 transition-colors">
          Δες τις ψηφοφορίες →
        </Link>
      </section>
    </StaticPageLayout>
  );
}
