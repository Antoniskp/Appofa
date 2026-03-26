import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Ψηφιακές Υπηρεσίες Δημοσίου — myAADE, myGov, e-ΕΦΚΑ, ΕΡΓΑΝΗ',
  description: 'Οδηγός για τις ψηφιακές υπηρεσίες του Ελληνικού Δημοσίου — TAXISnet, myAADE, gov.gr, e-ΕΦΚΑ, ΕΡΓΑΝΗ, myHealth.',
  openGraph: {
    title: 'Ψηφιακές Υπηρεσίες Δημοσίου — myAADE, myGov, e-ΕΦΚΑ, ΕΡΓΑΝΗ',
    description: 'Οδηγός για τις ψηφιακές υπηρεσίες του Ελληνικού Δημοσίου — TAXISnet, myAADE, gov.gr, e-ΕΦΚΑ, ΕΡΓΑΝΗ, myHealth.',
    url: `${SITE_URL}/digital-services`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Ψηφιακές Υπηρεσίες Δημοσίου — myAADE, myGov, e-ΕΦΚΑ, ΕΡΓΑΝΗ',
    description: 'Οδηγός για τις ψηφιακές υπηρεσίες του Ελληνικού Δημοσίου — TAXISnet, myAADE, gov.gr, e-ΕΦΚΑ, ΕΡΓΑΝΗ, myHealth.',
  },
  alternates: {
    canonical: `${SITE_URL}/digital-services`,
  },
};

export default function DigitalServicesPage() {
  return (
    <StaticPageLayout title="Ψηφιακές Υπηρεσίες Δημοσίου" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Το Ελληνικό Δημόσιο διαθέτει πλέον δεκάδες ψηφιακές πλατφόρμες για να εξυπηρετηθείτε
          χωρίς επίσκεψη σε δημόσια υπηρεσία. Σε αυτόν τον οδηγό θα βρείτε τι κάνει κάθε πλατφόρμα
          και πώς να συνδεθείτε.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Κύριες Ψηφιακές Πλατφόρμες</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💻 TAXISnet / myAADE</h3>
            <p className="text-gray-700 text-sm mb-3">
              Φορολογικές υπηρεσίες: υποβολή δήλωσης, ΕΝΦΙΑ, βεβαίωση φορολογικής ενημερότητας,
              e-Παράβολο, myProperty για ενοίκια.
            </p>
            <a href="https://www.aade.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              aade.gr / gsis.gr →
            </a>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🇬🇷 gov.gr</h3>
            <p className="text-gray-700 text-sm mb-3">
              Κεντρική πύλη Δημοσίου: πιστοποιητικά, βεβαιώσεις, ραντεβού υπηρεσιών, Gov.gr Wallet
              (ψηφιακά έγγραφα στο κινητό), αιτήσεις και πολλά ακόμη.
            </p>
            <a href="https://www.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              gov.gr →
            </a>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏛️ e-ΕΦΚΑ</h3>
            <p className="text-gray-700 text-sm mb-3">
              Ασφαλιστικές υπηρεσίες: ΑΜΚΑ, ένσημα, βεβαιώσεις ασφάλισης, αίτηση σύνταξης,
              επίδομα ασθενείας, μητρότητας.
            </p>
            <a href="https://www.efka.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              efka.gov.gr →
            </a>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💼 ΕΡΓΑΝΗ</h3>
            <p className="text-gray-700 text-sm mb-3">
              Εργασιακές υπηρεσίες: αναγγελία πρόσληψης/απόλυσης, ωράρια εργαζομένων, δήλωση
              υπερωριών, ψηφιακή κάρτα εργασίας.
            </p>
            <a href="https://www.ergani.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              ergani.gov.gr →
            </a>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">⚕️ myHealth</h3>
            <p className="text-gray-700 text-sm mb-3">
              Υπηρεσίες υγείας: εγγραφή σε προσωπικό γιατρό, ηλεκτρονικό παραπεμπτικό, ιστορικό
              εξετάσεων, ραντεβού σε νοσοκομεία ΕΣΥ.
            </p>
            <a href="https://www.moh.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              moh.gov.gr →
            </a>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🔍 ΔΥΠΑ</h3>
            <p className="text-gray-700 text-sm mb-3">
              Απασχόληση: εγγραφή ανέργου, αίτηση επιδόματος ανεργίας, εύρεση θέσεων εργασίας,
              προγράμματα κατάρτισης και voucher.
            </p>
            <a href="https://www.dypa.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              dypa.gov.gr →
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Πώς να Συνδεθείτε</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Οι περισσότερες πλατφόρμες χρησιμοποιούν τους κωδικούς TAXISnet για είσοδο.
            Αν δεν έχετε κωδικούς, ακολουθήστε τα παρακάτω βήματα:
          </p>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">1. Απόκτηση Κωδικών TAXISnet</h3>
            <p className="text-gray-700 text-sm">
              Επισκεφθείτε οποιαδήποτε ΔΟΥ ή χρησιμοποιήστε το σύστημα online εγγραφής στο{' '}
              <a href="https://www.gsis.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                gsis.gr
              </a>{' '}
              (απαιτεί φυσική παρουσία για πρώτη εγγραφή).
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">2. Σύνδεση στο gov.gr</h3>
            <p className="text-gray-700 text-sm">
              Στο gov.gr επιλέξτε «Είσοδος» και χρησιμοποιήστε τους κωδικούς TAXISnet ή
              κωδικούς e-Banking (για επιλεγμένες τράπεζες). Η σύνδεση γίνεται μέσω του
              συστήματος ταυτοποίησης Keycloak.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">3. Πιστοποίηση Κινητού (Gov.gr Wallet)</h3>
            <p className="text-gray-700 text-sm">
              Για την εφαρμογή Gov.gr Wallet, κατεβάστε την εφαρμογή από App Store ή Google Play
              και ακολουθήστε τη διαδικασία ταυτοποίησης με βιντεοκλήση ή φυσική παρουσία.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Συχνές Εργασίες</h2>
        <div className="space-y-3">
          <div className="border-l-4 border-indigo-500 pl-4">
            <p className="text-gray-700 text-sm">
              <strong>Φορολογική δήλωση (Ε1):</strong> TAXISnet → myAADE → Φορολογική Δήλωση
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <p className="text-gray-700 text-sm">
              <strong>Βεβαίωση αποδοχών:</strong> TAXISnet → myAADE → Βεβαιώσεις → Αποδοχές
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <p className="text-gray-700 text-sm">
              <strong>Ασφαλιστική ενημερότητα:</strong> e-ΕΦΚΑ (efka.gov.gr) → Βεβαιώσεις → Ασφαλιστική Ενημερότητα
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <p className="text-gray-700 text-sm">
              <strong>Πιστοποιητικό γέννησης:</strong> gov.gr → Οικογένεια → Γέννηση → Ληξιαρχικές Πράξεις
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <p className="text-gray-700 text-sm">
              <strong>Ένσημα IKA / e-ΕΦΚΑ:</strong> efka.gov.gr → Ασφαλισμένοι → Ιστορικό Ασφάλισης
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοί Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🇬🇷</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">gov.gr</p>
              <p className="text-sm text-gray-600">Κεντρική πύλη ψηφιακών υπηρεσιών Δημοσίου</p>
            </div>
          </a>
          <a
            href="https://www.aade.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">💻</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">myAADE / TAXISnet (aade.gr)</p>
              <p className="text-sm text-gray-600">Φορολογικές υπηρεσίες, δήλωση, ΕΝΦΙΑ</p>
            </div>
          </a>
          <a
            href="https://www.efka.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏛️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">e-ΕΦΚΑ (efka.gov.gr)</p>
              <p className="text-sm text-gray-600">Ασφαλιστικές υπηρεσίες, ΑΜΚΑ, ένσημα</p>
            </div>
          </a>
          <a
            href="https://www.ergani.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">💼</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">ΕΡΓΑΝΗ (ergani.gov.gr)</p>
              <p className="text-sm text-gray-600">Εργασιακές αναγγελίες, ωράρια, υπερωρίες</p>
            </div>
          </a>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι ψηφιακές υπηρεσίες του Δημοσίου ενημερώνονται συνεχώς. Οι σύνδεσμοι και οι
          διαδικασίες που αναφέρονται ενδέχεται να αλλάξουν. Για επικαιροποιημένες πληροφορίες,
          επισκεφθείτε τις επίσημες πλατφόρμες.
        </p>
      </section>
    </StaticPageLayout>
  );
}
