import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Υπηρεσίες ΚΕΠ — Τι Κάνω στο ΚΕΠ',
  description: 'Πλήρης οδηγός για τις υπηρεσίες των ΚΕΠ — έγγραφα, πιστοποιητικά, ηλεκτρονικές εναλλακτικές μέσω gov.gr.',
  openGraph: {
    title: 'Υπηρεσίες ΚΕΠ — Τι Κάνω στο ΚΕΠ',
    description: 'Πλήρης οδηγός για τις υπηρεσίες των ΚΕΠ — έγγραφα, πιστοποιητικά, ηλεκτρονικές εναλλακτικές μέσω gov.gr.',
    url: `${SITE_URL}/kep-services`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Υπηρεσίες ΚΕΠ — Τι Κάνω στο ΚΕΠ',
    description: 'Πλήρης οδηγός για τις υπηρεσίες των ΚΕΠ — έγγραφα, πιστοποιητικά, ηλεκτρονικές εναλλακτικές μέσω gov.gr.',
  },
  alternates: {
    canonical: `${SITE_URL}/kep-services`,
  },
};

export default function KepServicesPage() {
  return (
    <StaticPageLayout title="Υπηρεσίες ΚΕΠ — Τι Κάνω στο ΚΕΠ" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Τα Κέντρα Εξυπηρέτησης Πολιτών (ΚΕΠ) είναι η πρώτη γραμμή εξυπηρέτησης του Ελληνικού
          Δημοσίου. Εδώ θα βρείτε αναλυτικά ποιες υπηρεσίες παρέχουν, τι έγγραφα χρειάζεστε και
          πώς μπορείτε να εξυπηρετηθείτε ηλεκτρονικά χωρίς επίσκεψη.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Τι Είναι το ΚΕΠ</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Τα ΚΕΠ (Κέντρα Εξυπηρέτησης Πολιτών) λειτουργούν σε όλους τους δήμους της Ελλάδας και
            αποτελούν το ενιαίο σημείο επαφής του πολίτη με τη δημόσια διοίκηση. Η λειτουργία τους
            διέπεται από τον Ν. 3979/2011 και τους μεταγενέστερους νόμους ψηφιακής διακυβέρνησης.
          </p>
          <p className="text-gray-700">
            Σήμερα, πολλές υπηρεσίες που παλαιότερα απαιτούσαν επίσκεψη στο ΚΕΠ διατίθενται
            ηλεκτρονικά μέσω του{' '}
            <a href="https://www.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              gov.gr
            </a>.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Κατηγορίες Υπηρεσιών</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Πολιτική Κατάσταση</h3>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>Πιστοποιητικό γέννησης</li>
              <li>Πιστοποιητικό οικογενειακής κατάστασης</li>
              <li>Ληξιαρχικές πράξεις (γάμος, θάνατος)</li>
              <li>Αίτηση αλλαγής στοιχείων ληξιαρχείου</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🚔 Αστυνομικά</h3>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>Αίτηση για αστυνομική ταυτότητα</li>
              <li>Αίτηση για διαβατήριο</li>
              <li>Αντίγραφο ποινικού μητρώου</li>
              <li>Πιστοποιητικό μη καταδίκης</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💼 Φορολογικά</h3>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>Χορήγηση ΑΦΜ</li>
              <li>Βεβαίωση φορολογικής ενημερότητας</li>
              <li>Έκδοση φορολογικής δήλωσης (βοήθεια)</li>
              <li>Πληροφορίες ΕΝΦΙΑ</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏥 Ασφαλιστικά</h3>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>Χορήγηση / επικαιροποίηση ΑΜΚΑ</li>
              <li>Βεβαίωση ασφάλισης e-ΕΦΚΑ</li>
              <li>Αίτηση επιδόματος ανεργίας</li>
              <li>Σύνταξη — πληροφορίες αίτησης</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🗺️ Κτηματολόγιο</h3>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>Αίτηση αποσπάσματος κτηματολογίου</li>
              <li>Βεβαίωση ιδιοκτησίας</li>
              <li>Πληροφορίες για εγγραφές ακινήτων</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏗️ Πολεοδομικά</h3>
            <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
              <li>Βεβαίωση χρήσης γης</li>
              <li>Πληροφορίες οικοδομικής άδειας</li>
              <li>Τακτοποίηση αυθαιρέτων (πληροφορίες)</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Απαιτούμενα Έγγραφα</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Γενικά, για τις περισσότερες υπηρεσίες στο ΚΕΠ θα χρειαστείτε:
          </p>
          <div className="border-l-4 border-indigo-500 pl-4 space-y-2">
            <p className="text-gray-700 text-sm">✅ Αστυνομική ταυτότητα ή διαβατήριο (σε ισχύ)</p>
            <p className="text-gray-700 text-sm">✅ ΑΦΜ (Αριθμός Φορολογικού Μητρώου)</p>
            <p className="text-gray-700 text-sm">✅ ΑΜΚΑ (για ασφαλιστικές / υγειονομικές υπηρεσίες)</p>
            <p className="text-gray-700 text-sm">✅ Συμπληρωμένη αίτηση (παρέχεται στο ΚΕΠ ή αναρτάται online)</p>
            <p className="text-gray-700 text-sm">✅ Τυχόν ειδικά δικαιολογητικά ανά υπηρεσία</p>
          </div>
          <p className="text-gray-600 text-sm">
            Για κάθε υπηρεσία ξεχωριστά, ελέγξτε τα απαιτούμενα δικαιολογητικά στο{' '}
            <a href="https://www.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              gov.gr
            </a>{' '}
            ή στο{' '}
            <a href="https://www.kep.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              kep.gov.gr
            </a>.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Online Εναλλακτικές</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🇬🇷 gov.gr</h3>
            <p className="text-gray-700 text-sm mb-2">
              Εκατοντάδες υπηρεσίες διαθέσιμες ηλεκτρονικά: πιστοποιητικά, βεβαιώσεις, αιτήσεις.
            </p>
            <a href="https://www.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              Επισκεφτείτε το gov.gr →
            </a>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💻 myAADE</h3>
            <p className="text-gray-700 text-sm mb-2">
              Φορολογικές υπηρεσίες: φορολογική δήλωση, ΕΝΦΙΑ, βεβαιώσεις, ΑΦΜ.
            </p>
            <a href="https://www.aade.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              Επισκεφτείτε το myAADE →
            </a>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏛️ e-ΕΦΚΑ</h3>
            <p className="text-gray-700 text-sm mb-2">
              Ασφαλιστικές υπηρεσίες: ΑΜΚΑ, ένσημα, βεβαιώσεις ασφάλισης, αιτήσεις σύνταξης.
            </p>
            <a href="https://www.efka.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              Επισκεφτείτε τον e-ΕΦΚΑ →
            </a>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📲 Εφαρμογή Gov.gr Wallet</h3>
            <p className="text-gray-700 text-sm mb-2">
              Ψηφιακή ταυτότητα, άδεια οδήγησης και άλλα έγγραφα στο κινητό σας.
            </p>
            <a href="https://wallet.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              Gov.gr Wallet →
            </a>
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
            href="https://www.kep.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏛️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">kep.gov.gr</p>
              <p className="text-sm text-gray-600">Εύρεση ΚΕΠ, ωράρια, υπηρεσίες ανά κατηγορία</p>
            </div>
          </a>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα. Οι υπηρεσίες που παρέχουν
          τα ΚΕΠ ενδέχεται να αλλάξουν. Για ακριβείς πληροφορίες και ωράρια, επισκεφθείτε το
          kep.gov.gr ή τηλεφωνήστε στο ΚΕΠ του δήμου σας.
        </p>
      </section>
    </StaticPageLayout>
  );
}
