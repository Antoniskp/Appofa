import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Καταναλωτικά Δικαιώματα στην Ελλάδα',
  description: 'Δικαιώματα καταναλωτή στην Ελλάδα — επιστροφές, εγγυήσεις, αθέμιτες εμπορικές πρακτικές, Συνήγορος Καταναλωτή.',
  openGraph: {
    title: 'Καταναλωτικά Δικαιώματα στην Ελλάδα',
    description: 'Δικαιώματα καταναλωτή στην Ελλάδα — επιστροφές, εγγυήσεις, αθέμιτες εμπορικές πρακτικές, Συνήγορος Καταναλωτή.',
    url: `${SITE_URL}/consumer-rights`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Καταναλωτικά Δικαιώματα στην Ελλάδα',
    description: 'Δικαιώματα καταναλωτή στην Ελλάδα — επιστροφές, εγγυήσεις, αθέμιτες εμπορικές πρακτικές, Συνήγορος Καταναλωτή.',
  },
  alternates: {
    canonical: `${SITE_URL}/consumer-rights`,
  },
};

export default function ConsumerRightsPage() {
  return (
    <StaticPageLayout title="Καταναλωτικά Δικαιώματα στην Ελλάδα" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Ως καταναλωτής στην Ελλάδα προστατεύεστε από μια σειρά νόμων που διασφαλίζουν δίκαιες
          συναλλαγές, εγγυήσεις προϊόντων και δυνατότητα αποκατάστασης σε περίπτωση προβλήματος.
          Σε αυτόν τον οδηγό θα βρείτε τα βασικά σας δικαιώματα.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Δικαίωμα Υπαναχώρησης (14 Ημέρες)</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Πότε Ισχύει</h3>
            <p className="text-gray-700 text-sm">
              Έχετε δικαίωμα υπαναχώρησης <strong>14 ημερολογιακών ημερών</strong> χωρίς αιτιολόγηση
              για αγορές εξ αποστάσεως (online, τηλεφωνικά, ταχυδρομικά) ή εκτός εμπορικού
              καταστήματος (πωλητές στο σπίτι κ.λπ.). Η προθεσμία ξεκινά από την παραλαβή του
              προϊόντος.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Τι Εξαιρείται</h3>
            <p className="text-gray-700 text-sm">
              Δεν ισχύει υπαναχώρηση για: προϊόντα κατασκευασμένα βάσει παραγγελίας, ψηφιακό
              περιεχόμενο που ήδη χρησιμοποιήθηκε, υπηρεσίες που εκτελέστηκαν πλήρως, τρόφιμα
              με σύντομη ημερομηνία λήξης και εισιτήρια εκδηλώσεων.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Πώς Ασκείται</h3>
            <p className="text-gray-700 text-sm">
              Στείλτε γραπτή δήλωση υπαναχώρησης στον πωλητή (email, έντυπη φόρμα). Ο πωλητής
              οφείλει να επιστρέψει το ποσό εντός <strong>14 ημερών</strong> από την παραλαβή της
              δήλωσης ή του προϊόντος.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Εγγύηση Προϊόντων</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">⚖️ Νόμιμη Εγγύηση (2 Χρόνια)</h3>
            <p className="text-gray-700 text-sm">
              Κάθε προϊόν καλύπτεται από <strong>2-ετή νόμιμη εγγύηση</strong>. Αν εμφανιστεί
              ελάττωμα εντός 2 ετών, έχετε δικαίωμα επισκευής, αντικατάστασης ή επιστροφής
              χρημάτων από τον πωλητή (όχι τον κατασκευαστή).
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🛍️ Εμπορική Εγγύηση</h3>
            <p className="text-gray-700 text-sm">
              Επιπλέον της νόμιμης, ο κατασκευαστής/πωλητής μπορεί να δίνει εμπορική εγγύηση
              (π.χ. 3 χρόνια). Πρέπει να αναφέρεται εγγράφως, να προσδιορίζει τι καλύπτει και
              τους όρους χρήσης της.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🔧 Επιλογές Αποκατάστασης</h3>
            <p className="text-gray-700 text-sm">
              Σε ελαττωματικό προϊόν: 1. Επισκευή, 2. Αντικατάσταση, 3. Μείωση τιμής,
              4. Πλήρης επιστροφή χρημάτων. Εσείς επιλέγετε τι προτιμάτε (εντός λογικής).
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Τι Χρειάζεστε</h3>
            <p className="text-gray-700 text-sm">
              Κρατήστε πάντα απόδειξη/τιμολόγιο αγοράς. Μέσα στους πρώτους 12 μήνες, το
              ελάττωμα τεκμαίρεται ότι υπήρχε κατά την αγορά. Μετά τους 12 μήνες ο καταναλωτής
              πρέπει να αποδείξει ότι το ελάττωμα ήταν προϋπάρχον.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Αθέμιτες Εμπορικές Πρακτικές</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Παραπλανητική Διαφήμιση</h3>
            <p className="text-gray-700 text-sm">
              Ψευδείς ισχυρισμοί για προϊόν, παραπλανητικές τιμές, ψεύτικες προσφορές, απόκρυψη
              πληροφοριών. Απαγορεύονται από τον Ν. 2251/1994 (Νόμος Καταναλωτή).
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Επιθετικές Πρακτικές</h3>
            <p className="text-gray-700 text-sm">
              Παρενόχληση, εκβιασμός, αδικαιολόγητη πίεση για αγορά, ψυχολογική χειραγώγηση.
              Επίσης απαγορευμένα βάσει νόμου.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Τι Κάνετε αν Είστε Θύμα</h3>
            <p className="text-gray-700 text-sm">
              Υποβάλλετε καταγγελία στη Γενική Γραμματεία Εμπορίου & Προστασίας Καταναλωτή
              (mindev.gov.gr) ή στον Συνήγορο Καταναλωτή. Μπορείτε επίσης να απευθυνθείτε
              σε καταναλωτική οργάνωση (ΕΚΠΟΙΖΩ, INKA).
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Παράπονα & Επίλυση Διαφορών</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">1. Επικοινωνία με Επιχείρηση</h3>
            <p className="text-gray-700 text-sm">
              Πρώτο βήμα: αποστολή γραπτής ειδοποίησης (email ή επιστολή) στην επιχείρηση
              περιγράφοντας το πρόβλημα και ζητώντας αποκατάσταση εντός εύλογου χρόνου (π.χ. 10–15 ημέρες).
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">2. Καταγγελία στον Συνήγορο Καταναλωτή</h3>
            <p className="text-gray-700 text-sm">
              Αν η επιχείρηση δεν ανταποκριθεί, υποβάλλετε καταγγελία στον{' '}
              <a href="https://www.synigoroskatanaloti.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Συνήγορο Καταναλωτή (synigoroskatanaloti.gr)
              </a>. Η υπηρεσία είναι δωρεάν και παρεμβαίνει για εξώδικη επίλυση.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">3. ΕΦΕΤ για Τρόφιμα</h3>
            <p className="text-gray-700 text-sm">
              Για θέματα ασφάλειας τροφίμων, αλλοίωση, ψευδείς ισχυρισμοί σε τρόφιμα: καταγγελία
              στον{' '}
              <a href="https://www.efet.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                ΕΦΕΤ (efet.gr)
              </a>.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">4. Επιτροπή Ανταγωνισμού</h3>
            <p className="text-gray-700 text-sm">
              Για θέματα αθέμιτου ανταγωνισμού, καρτέλ και καταχρηστική δεσπόζουσα θέση
              επιχειρήσεων: Επιτροπή Ανταγωνισμού (epant.gr).
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Online Αγορές & Ασφάλεια</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🔍 Πριν Αγοράσετε</h3>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>Ελέγξτε αν ο πωλητής εδρεύει στην ΕΕ</li>
              <li>Διαβάστε αξιολογήσεις πελατών</li>
              <li>Επιβεβαιώστε στοιχεία επικοινωνίας (email, τηλ.)</li>
              <li>Βεβαιωθείτε για πολιτική επιστροφών</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💳 Ασφαλής Πληρωμή</h3>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>Χρησιμοποιήστε κάρτα ή PayPal (chargeback)</li>
              <li>Ελέγξτε HTTPS (λουκέτο στη διεύθυνση)</li>
              <li>Αποφύγετε μεταφορά χρημάτων/crypto σε άγνωστους</li>
              <li>Μην δίνετε PIN ή OTP σε τρίτους</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🚨 Σε Περίπτωση Απάτης</h3>
            <p className="text-gray-700 text-sm">
              Επικοινωνήστε αμέσως με την τράπεζά σας για αντιστροφή χρέωσης (chargeback).
              Καταγγείλτε στη Δίωξη Ηλεκτρονικού Εγκλήματος (cybercrime.gr) και στον Συνήγορο
              Καταναλωτή.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🇪🇺 Διασυνοριακές Αγορές</h3>
            <p className="text-gray-700 text-sm">
              Για αγορές από άλλες χώρες ΕΕ: το ECC Greece (ECC-Net) βοηθά στην επίλυση
              διαφορών με επιχειρήσεις άλλων χωρών της ΕΕ δωρεάν.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοί Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.synigoroskatanaloti.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">⚖️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Συνήγορος Καταναλωτή (synigoroskatanaloti.gr)</p>
              <p className="text-sm text-gray-600">Δωρεάν εξώδικη επίλυση καταναλωτικών διαφορών</p>
            </div>
          </a>
          <a
            href="https://www.efet.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🍎</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">ΕΦΕΤ (efet.gr)</p>
              <p className="text-sm text-gray-600">Ασφάλεια τροφίμων, καταγγελίες, επιθεωρήσεις</p>
            </div>
          </a>
          <a
            href="https://www.mindev.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏛️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Γεν. Γραμματεία Εμπορίου & Προστασίας Καταναλωτή</p>
              <p className="text-sm text-gray-600">Νομοθεσία, καταγγελίες αθέμιτων πρακτικών (mindev.gov.gr)</p>
            </div>
          </a>
          <a
            href="https://www.eccgreece.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🇪🇺</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">ECC Greece</p>
              <p className="text-sm text-gray-600">Διασυνοριακές αγορές ΕΕ — βοήθεια σε διαφορές με ξένους πωλητές</p>
            </div>
          </a>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα και δεν αποτελούν νομική
          συμβουλή. Η καταναλωτική νομοθεσία αλλάζει. Για συγκεκριμένα νομικά ζητήματα,
          απευθυνθείτε σε δικηγόρο ή στον Συνήγορο Καταναλωτή.
        </p>
      </section>
    </StaticPageLayout>
  );
}
