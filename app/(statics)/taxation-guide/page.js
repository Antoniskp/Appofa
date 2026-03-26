import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Φορολογία Πολίτη — Οδηγός για τη Φορολογική Δήλωση στην Ελλάδα',
  description: 'Πώς υποβάλλεις φορολογική δήλωση, ΕΝΦΙΑ, τεκμήρια, φορολογικές κλίμακες — πρακτικός οδηγός.',
  openGraph: {
    title: 'Φορολογία Πολίτη — Οδηγός για τη Φορολογική Δήλωση στην Ελλάδα',
    description: 'Πώς υποβάλλεις φορολογική δήλωση, ΕΝΦΙΑ, τεκμήρια, φορολογικές κλίμακες — πρακτικός οδηγός.',
    url: `${SITE_URL}/taxation-guide`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Φορολογία Πολίτη — Οδηγός για τη Φορολογική Δήλωση στην Ελλάδα',
    description: 'Πώς υποβάλλεις φορολογική δήλωση, ΕΝΦΙΑ, τεκμήρια, φορολογικές κλίμακες — πρακτικός οδηγός.',
  },
  alternates: {
    canonical: `${SITE_URL}/taxation-guide`,
  },
};

export default function TaxationGuidePage() {
  return (
    <StaticPageLayout title="Φορολογία Πολίτη — Οδηγός για τη Φορολογική Δήλωση" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Κάθε χρόνο εκατομμύρια Έλληνες πολίτες υποβάλλουν φορολογική δήλωση μέσω TAXISnet. Σε αυτόν τον
          οδηγό θα βρείτε βήμα-βήμα τη διαδικασία, τις φορολογικές κλίμακες, τα τεκμήρια διαβίωσης
          και πληροφορίες για τον ΕΝΦΙΑ.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Φορολογική Δήλωση (Ε1) — Βήμα-Βήμα</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">1. Σύνδεση στο TAXISnet</h3>
            <p className="text-gray-700 text-sm">
              Συνδεθείτε στο{' '}
              <a href="https://www.gsis.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                TAXISnet (gsis.gr)
              </a>{' '}
              με τον κωδικό χρήστη και τον κωδικό πρόσβασής σας. Αν δεν έχετε λογαριασμό, εγγραφείτε
              μέσω της ίδιας πλατφόρμας.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">2. Συμπλήρωση Εντύπων Ε1, Ε2, Ε3</h3>
            <p className="text-gray-700 text-sm">
              Το <strong>Ε1</strong> είναι η κύρια δήλωση εισοδήματος. Το <strong>Ε2</strong> αφορά
              εισοδήματα από ενοίκια και το <strong>Ε3</strong> τα εισοδήματα από επιχειρηματική
              δραστηριότητα. Πολλά πεδία συμπληρώνονται αυτόματα από την ΑΑΔΕ.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">3. Υποβολή Δήλωσης</h3>
            <p className="text-gray-700 text-sm">
              Μετά τον έλεγχο των στοιχείων, υποβάλλετε ηλεκτρονικά τη δήλωση. Η προθεσμία υποβολής
              είναι συνήθως έως τα τέλη Ιουνίου κάθε έτους για το προηγούμενο φορολογικό έτος.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">4. Εκκαθαριστικό Σημείωμα</h3>
            <p className="text-gray-700 text-sm">
              Μετά την υποβολή, λαμβάνετε το εκκαθαριστικό σημείωμα που αναγράφει τον φόρο που
              πρέπει να πληρώσετε ή την επιστροφή που δικαιούστε. Η πληρωμή γίνεται μέσω τράπεζας
              ή e-banking, σε δόσεις ανάλογα με το ποσό.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Φορολογικές Κλίμακες Εισοδήματος</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Εισόδημα (€)</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Φορολογικός Συντελεστής</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700">0 – 10.000</td>
                <td className="px-4 py-3 text-gray-700">9%</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">10.001 – 20.000</td>
                <td className="px-4 py-3 text-gray-700">22%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">20.001 – 30.000</td>
                <td className="px-4 py-3 text-gray-700">28%</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">30.001 – 40.000</td>
                <td className="px-4 py-3 text-gray-700">36%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">&gt; 40.000</td>
                <td className="px-4 py-3 text-gray-700">44%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          * Ισχύει αφορολόγητο όριο για μισθωτούς/συνταξιούχους. Οι κλίμακες μπορεί να αλλάξουν με νέα νομοθεσία.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Τεκμήρια Διαβίωσης</h2>
        <p className="text-gray-700 mb-4">
          Τα τεκμήρια είναι ελάχιστα ποσά εισοδήματος που τεκμαίρεται ότι έχει κάποιος βάσει των
          δαπανών διαβίωσής του. Αν το δηλωθέν εισόδημα είναι χαμηλότερο από τα τεκμήρια, φορολογείστε
          βάσει αυτών.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏠 Κατοικία</h3>
            <p className="text-gray-700 text-sm">
              Υπολογίζεται βάσει τετραγωνικών μέτρων και ζώνης. Ιδιόκτητη ή μισθωμένη κύρια κατοικία
              δημιουργεί τεκμήριο ανάλογα με το εμβαδόν της.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🚗 Αυτοκίνητο</h3>
            <p className="text-gray-700 text-sm">
              Κάθε επιβατικό αυτοκίνητο δημιουργεί τεκμήριο ανάλογα με τον κυβισμό του (από 4.000 €
              για &lt;1.200 κ.εκ. έως 18.000 € για &gt;3.000 κ.εκ.).
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">⛵ Σκάφος</h3>
            <p className="text-gray-700 text-sm">
              Η κατοχή σκάφους αναψυχής δημιουργεί τεκμήριο ανάλογα με το μήκος του σκάφους και τα
              χαρακτηριστικά του (κινητήρας, ιστιοφόρο κ.λπ.).
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">⚡ Κατανάλωση Ρεύματος</h3>
            <p className="text-gray-700 text-sm">
              Υψηλή κατανάλωση ηλεκτρικής ενέργειας μπορεί να αποτελεί ένδειξη αντικειμενικής δαπάνης
              και να ελεγχθεί στο πλαίσιο φορολογικού ελέγχου.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">ΕΝΦΙΑ — Ενιαίος Φόρος Ιδιοκτησίας Ακινήτων</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Ο ΕΝΦΙΑ επιβάλλεται ετησίως σε κάθε φυσικό ή νομικό πρόσωπο που κατέχει ακίνητη
            περιουσία στην Ελλάδα την 1η Ιανουαρίου κάθε έτους.
          </p>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Πότε Πληρώνεται</h3>
            <p className="text-gray-700 text-sm">
              Ο ΕΝΦΙΑ εκδίδεται συνήθως τον Σεπτέμβριο και πληρώνεται σε δόσεις (συνήθως 6–10 μηνιαίες
              δόσεις). Η εφάπαξ πληρωμή παρέχει έκπτωση.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Πώς Υπολογίζεται</h3>
            <p className="text-gray-700 text-sm">
              Βασίζεται στην αντικειμενική αξία του ακινήτου, τα τετραγωνικά μέτρα, την παλαιότητα,
              τον όροφο και τη ζώνη. Υπάρχει κύριος ΕΝΦΙΑ (ανά ακίνητο) και συμπληρωματικός
              (για συνολική αξία ακινήτων &gt;300.000 €).
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Πού Πληρώνεται</h3>
            <p className="text-gray-700 text-sm">
              Μέσω TAXISnet (myAADE), τράπεζας, e-banking ή ΕΛΤΑ. Επίσης μέσω της εφαρμογής myAADE
              για κινητά τηλέφωνα.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοι Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.gsis.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">💻</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">TAXISnet (gsis.gr)</p>
              <p className="text-sm text-gray-600">Υποβολή φορολογικής δήλωσης, e-Παράβολο, ΕΝΦΙΑ</p>
            </div>
          </a>
          <a
            href="https://www.aade.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏛️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">ΑΑΔΕ (aade.gr)</p>
              <p className="text-sm text-gray-600">Ανεξάρτητη Αρχή Δημοσίων Εσόδων — φορολογικές πληροφορίες</p>
            </div>
          </a>
          <a
            href="https://www.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🇬🇷</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">gov.gr</p>
              <p className="text-sm text-gray-600">Ψηφιακές υπηρεσίες Δημοσίου — πιστοποιητικά, βεβαιώσεις</p>
            </div>
          </a>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα και δεν αποτελούν φορολογική
          ή νομική συμβουλή. Οι φορολογικές κλίμακες και οι διαδικασίες ενδέχεται να τροποποιηθούν με
          νέα νομοθεσία. Για εξειδικευμένες ερωτήσεις, απευθυνθείτε σε φοροτεχνικό ή στην ΑΑΔΕ.
        </p>
      </section>
    </StaticPageLayout>
  );
}
