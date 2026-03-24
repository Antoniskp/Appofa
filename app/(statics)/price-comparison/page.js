import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Σύγκριση Τιμών - Απόφαση',
  description: 'Πληροφορίες και αναλύσεις για τις τιμές καταναλωτικών αγαθών στην Ελλάδα.',
  openGraph: {
    title: 'Σύγκριση Τιμών - Απόφαση',
    description: 'Πληροφορίες και αναλύσεις για τις τιμές καταναλωτικών αγαθών στην Ελλάδα.',
    url: `${SITE_URL}/price-comparison`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Σύγκριση Τιμών - Απόφαση',
    description: 'Πληροφορίες και αναλύσεις για τις τιμές καταναλωτικών αγαθών στην Ελλάδα.',
  },
  alternates: {
    canonical: `${SITE_URL}/price-comparison`,
  },
};

export default function PriceComparisonPage() {
  return (
    <StaticPageLayout title="Σύγκριση Τιμών" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η αύξηση των τιμών καταναλωτικών αγαθών αποτελεί κεντρικό ζήτημα για τα ελληνικά νοικοκυριά.
          Εδώ παρουσιάζουμε πληροφορίες και αναλύσεις που βοηθούν στην κατανόηση των μηχανισμών
          διαμόρφωσης τιμών.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Τιμές στην Ελλάδα</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Τα τελευταία χρόνια, η Ελλάδα παρουσίασε έντονες πιέσεις πληθωρισμού, ιδιαίτερα στα
            τρόφιμα και την ενέργεια. Η ακρίβεια επηρεάζει δυσανάλογα νοικοκυριά χαμηλού εισοδήματος
            και αποτελεί μείζον θέμα δημόσιας συζήτησης.
          </p>
          <p className="text-gray-700">
            Βασικοί παράγοντες που επηρεάζουν τις τιμές περιλαμβάνουν το κόστος ενέργειας, τα
            μεταφορικά έξοδα, τον ΦΠΑ και τα περιθώρια κέρδους στη λιανική.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Κατηγορίες Καταναλωτικών Αγαθών</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🛒 Τρόφιμα & Ποτά</h3>
            <p className="text-gray-700 text-sm">
              Τα τρόφιμα αποτελούν μεγάλο μέρος του οικογενειακού προϋπολογισμού. Η σύγκριση τιμών
              μεταξύ σούπερ μάρκετ και λαϊκών αγορών μπορεί να οδηγήσει σε σημαντική εξοικονόμηση.
            </p>
          </div>

          <Link href="/price-comparison/energy" className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-400 hover:shadow-md transition-all group">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">⚡ Ενέργεια</h3>
            <p className="text-gray-700 text-sm mb-3">
              Ηλεκτρικό ρεύμα, φυσικό αέριο και καύσιμα. Η ελεύθερη αγορά ενέργειας επιτρέπει
              σύγκριση παρόχων και επιλογή προνομιακού τιμολογίου.
            </p>
            <span className="text-indigo-600 text-sm font-medium group-hover:underline">Δες σύγκριση →</span>
          </Link>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏥 Φάρμακα & Υγεία</h3>
            <p className="text-gray-700 text-sm">
              Τιμές φαρμάκων, ιατρικές υπηρεσίες και ασφαλιστικά προϊόντα. Η σύγκριση βοηθά να
              εντοπιστούν οικονομικότερες επιλογές χωρίς συμβιβασμό στην ποιότητα.
            </p>
          </div>

          <Link href="/price-comparison/telecom" className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-400 hover:shadow-md transition-all group">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📱 Τεχνολογία & Τηλεπικοινωνίες</h3>
            <p className="text-gray-700 text-sm mb-3">
              Κινητή τηλεφωνία, ίντερνετ και ηλεκτρονικά είδη. Η συχνή αναθεώρηση πακέτων
              τηλεπικοινωνιών μπορεί να αποφέρει σημαντική εξοικονόμηση.
            </p>
            <span className="text-indigo-600 text-sm font-medium group-hover:underline">Δες σύγκριση →</span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Πώς να Συγκρίνεις Τιμές Αποτελεσματικά</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Χρήση Εργαλείων Σύγκρισης</h3>
            <p className="text-gray-700 text-sm">
              Δημόσιες πλατφόρμες όπως το e-katanalotis.gr της ΕΦΕΤ επιτρέπουν σύγκριση τιμών
              τροφίμων σε σούπερ μάρκετ σε πραγματικό χρόνο.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Παρακολούθηση Τιμολογιακής Πολιτικής</h3>
            <p className="text-gray-700 text-sm">
              Ο Συνήγορος του Καταναλωτή και η Επιτροπή Ανταγωνισμού εποπτεύουν αθέμιτες πρακτικές
              και καταγγελίες για αδικαιολόγητες αυξήσεις τιμών.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Προγραμματισμός Αγορών</h3>
            <p className="text-gray-700 text-sm">
              Η εβδομαδιαία σχεδίαση αγορών, η αξιοποίηση εκπτώσεων και η προτίμηση προϊόντων
              ιδιωτικής ετικέτας μπορεί να μειώσει σημαντικά το κόστος διατροφής.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Μοιράσου εμπειρίες & συμβουλές</h2>
        <p className="text-gray-700 text-sm">
          Έχεις ανακαλύψει κάποιο χρήσιμο εργαλείο ή τακτική εξοικονόμησης; Συμμετέχοντας στις
          ψηφοφορίες, βοήθα άλλα μέλη της κοινότητας να διαχειριστούν καλύτερα τον προϋπολογισμό τους.
        </p>
      </section>
    </StaticPageLayout>
  );
}
