import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Έναρξη Επιχείρησης στην Ελλάδα — Οδηγός Βήμα-Βήμα',
  description: 'Πώς ανοίγεις επιχείρηση στην Ελλάδα — νομικές μορφές (ΙΚΕ, ΕΠΕ, ΑΕ, ατομική), βήματα, κόστη, φορολογία.',
  openGraph: {
    title: 'Έναρξη Επιχείρησης στην Ελλάδα — Οδηγός Βήμα-Βήμα',
    description: 'Πώς ανοίγεις επιχείρηση στην Ελλάδα — νομικές μορφές (ΙΚΕ, ΕΠΕ, ΑΕ, ατομική), βήματα, κόστη, φορολογία.',
    url: `${SITE_URL}/start-business`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Έναρξη Επιχείρησης στην Ελλάδα — Οδηγός Βήμα-Βήμα',
    description: 'Πώς ανοίγεις επιχείρηση στην Ελλάδα — νομικές μορφές (ΙΚΕ, ΕΠΕ, ΑΕ, ατομική), βήματα, κόστη, φορολογία.',
  },
  alternates: {
    canonical: `${SITE_URL}/start-business`,
  },
};

export default function StartBusinessPage() {
  return (
    <StaticPageLayout title="Έναρξη Επιχείρησης στην Ελλάδα — Οδηγός Βήμα-Βήμα" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η ίδρυση επιχείρησης στην Ελλάδα έχει απλοποιηθεί σημαντικά τα τελευταία χρόνια. Σε αυτόν
          τον οδηγό θα βρείτε αναλυτικά τις νομικές μορφές, τα βήματα ίδρυσης, τα κόστη και τη
          φορολογία επιχειρήσεων.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Νομικές Μορφές Επιχείρησης</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Μορφή</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Ελάχιστο Κεφάλαιο</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Ευθύνη</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Κατάλληλη για</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700 font-medium">Ατομική Επιχείρηση</td>
                <td className="px-4 py-3 text-gray-700">Καμία</td>
                <td className="px-4 py-3 text-gray-700">Απεριόριστη (προσωπική)</td>
                <td className="px-4 py-3 text-gray-700">Μικρές δραστηριότητες, ελεύθεροι επαγγελματίες</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700 font-medium">ΙΚΕ</td>
                <td className="px-4 py-3 text-gray-700">1 € (τυπικά)</td>
                <td className="px-4 py-3 text-gray-700">Περιορισμένη (εισφορά)</td>
                <td className="px-4 py-3 text-gray-700">Startups, μικρομεσαίες επιχειρήσεις</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700 font-medium">ΕΠΕ</td>
                <td className="px-4 py-3 text-gray-700">4.500 €</td>
                <td className="px-4 py-3 text-gray-700">Περιορισμένη (εισφορά)</td>
                <td className="px-4 py-3 text-gray-700">Μεσαίες επιχειρήσεις</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700 font-medium">ΑΕ</td>
                <td className="px-4 py-3 text-gray-700">25.000 €</td>
                <td className="px-4 py-3 text-gray-700">Περιορισμένη (μετοχές)</td>
                <td className="px-4 py-3 text-gray-700">Μεγάλες επιχειρήσεις, εισηγμένες</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Βήματα Ίδρυσης (ΙΚΕ/ΕΠΕ)</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">1. Επιλογή Επωνυμίας & Έλεγχος Μοναδικότητας (ΓΕΜΗ)</h3>
            <p className="text-gray-700 text-sm">
              Ελέγξτε αν η επωνυμία που επιθυμείτε είναι διαθέσιμη μέσω του{' '}
              <a href="https://www.businessregistry.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                ΓΕΜΗ (businessregistry.gr)
              </a>.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">2. Σύνταξη Καταστατικού</h3>
            <p className="text-gray-700 text-sm">
              Για ΙΚΕ και ΕΠΕ απαιτείται καταστατικό. Για ΙΚΕ μπορεί να χρησιμοποιηθεί
              τυποποιημένο καταστατικό (άρθρο 50 Ν.4072/2012). Η ΑΕ απαιτεί συμβολαιογράφο.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">3. Εγγραφή στο ΓΕΜΗ</h3>
            <p className="text-gray-700 text-sm">
              Υποβολή καταστατικού και αίτησης εγγραφής στο Γενικό Εμπορικό Μητρώο. Η εγγραφή
              μπορεί να γίνει ηλεκτρονικά μέσω του businessregistry.gr ή μέσω συμβολαιογράφου/δικηγόρου.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">4. Έναρξη στην ΑΑΔΕ / TAXISnet</h3>
            <p className="text-gray-700 text-sm">
              Δήλωση έναρξης επιτηδεύματος στην αρμόδια ΔΟΥ ή ηλεκτρονικά μέσω myAADE. Λαμβάνεται
              ΑΦΜ επιχείρησης και ΚΑΔ (Κωδικός Αριθμός Δραστηριότητας).
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">5. Εγγραφή στον e-ΕΦΚΑ</h3>
            <p className="text-gray-700 text-sm">
              Υποχρεωτική εγγραφή εταίρων/διαχειριστών στον e-ΕΦΚΑ ως αυτοαπασχολούμενοι μέσα σε
              30 ημέρες από την έναρξη.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">6. Άνοιγμα Τραπεζικού Λογαριασμού</h3>
            <p className="text-gray-700 text-sm">
              Απαραίτητο για τις συναλλαγές της εταιρείας. Χρειάζεται καταστατικό, έγγραφα
              εγγραφής ΓΕΜΗ, ΑΦΜ εταιρείας και ταυτότητες εκπροσώπων.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Κόστη Ίδρυσης</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Κόστος</th>
                <th className="px-4 py-3 font-semibold text-gray-700">ΙΚΕ</th>
                <th className="px-4 py-3 font-semibold text-gray-700">ΕΠΕ / ΑΕ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700">Τέλη ΓΕΜΗ</td>
                <td className="px-4 py-3 text-gray-700">~10–35 €</td>
                <td className="px-4 py-3 text-gray-700">~10–70 €</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Συμβολαιογραφικά (αν απαιτούνται)</td>
                <td className="px-4 py-3 text-gray-700">0 € (τυποποιημένο)</td>
                <td className="px-4 py-3 text-gray-700">300–800 €</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Νομικές/λογιστικές υπηρεσίες</td>
                <td className="px-4 py-3 text-gray-700">200–500 €</td>
                <td className="px-4 py-3 text-gray-700">400–1.000+ €</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Ετήσιο κόστος λογιστή</td>
                <td className="px-4 py-3 text-gray-700">800–2.000+ €/έτος</td>
                <td className="px-4 py-3 text-gray-700">1.500–5.000+ €/έτος</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          * Τα ποσά είναι ενδεικτικά. Τα κόστη ποικίλλουν ανάλογα με τον πάροχο υπηρεσιών.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Φορολογία Επιχειρήσεων</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📊 Φορολογικός Συντελεστής</h3>
            <p className="text-gray-700 text-sm">
              Για ΑΕ, ΕΠΕ και ΙΚΕ: <strong>22%</strong> επί των κερδών. Για ατομικές επιχειρήσεις/ελεύθερους
              επαγγελματίες: κλίμακα εισοδήματος (9%–44%).
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🧾 ΦΠΑ</h3>
            <p className="text-gray-700 text-sm">
              Κανονικός συντελεστής: <strong>24%</strong>. Μειωμένος: <strong>13%</strong> (τρόφιμα,
              εστίαση, μεταφορές). Υπερμειωμένος: <strong>6%</strong> (φάρμακα, βιβλία, εφημερίδες).
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💰 Προκαταβολή Φόρου</h3>
            <p className="text-gray-700 text-sm">
              Κάθε χρόνο καταβάλλεται προκαταβολή φόρου επόμενου έτους (100% για νομικά πρόσωπα,
              55% για φυσικά). Για νέες επιχειρήσεις, ισχύουν μειωμένοι συντελεστές τα πρώτα χρόνια.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📅 Υποχρεώσεις</h3>
            <p className="text-gray-700 text-sm">
              Τήρηση λογιστικών βιβλίων, μηνιαίες/τριμηνιαίες δηλώσεις ΦΠΑ, ετήσια εταιρική
              δήλωση φορολογίας εισοδήματος, δήλωση στο ΓΕΜΗ.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοί Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.businessregistry.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">📋</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">ΓΕΜΗ (businessregistry.gr)</p>
              <p className="text-sm text-gray-600">Γενικό Εμπορικό Μητρώο — εγγραφή, αναζήτηση εταιρειών</p>
            </div>
          </a>
          <a
            href="https://www.aade.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">💼</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">ΑΑΔΕ (aade.gr)</p>
              <p className="text-sm text-gray-600">Έναρξη επιτηδεύματος, φορολογικές υποχρεώσεις, ΦΠΑ</p>
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
              <p className="text-sm text-gray-600">Ασφάλιση αυτοαπασχολούμενων, εισφορές</p>
            </div>
          </a>
          <a
            href="https://www.mindev.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏢</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Γεν. Γραμματεία Εμπορίου</p>
              <p className="text-sm text-gray-600">Εμπορικό δίκαιο, εταιρικές μορφές, αδειοδοτήσεις</p>
            </div>
          </a>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα και δεν αποτελούν νομική
          ή φορολογική συμβουλή. Η εταιρική νομοθεσία αλλάζει. Πριν ιδρύσετε επιχείρηση,
          συμβουλευτείτε λογιστή ή δικηγόρο.
        </p>
      </section>
    </StaticPageLayout>
  );
}
