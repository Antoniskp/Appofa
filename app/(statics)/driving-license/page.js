import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Δίπλωμα Οδήγησης — Πώς Βγάζεις & Ανανεώνεις Δίπλωμα στην Ελλάδα',
  description: 'Κατηγορίες διπλώματος οδήγησης, βήματα για απόκτηση, κόστη, ανανέωση και ανάκτηση χαμένου διπλώματος στην Ελλάδα.',
  openGraph: {
    title: 'Δίπλωμα Οδήγησης — Πώς Βγάζεις & Ανανεώνεις Δίπλωμα στην Ελλάδα',
    description: 'Κατηγορίες διπλώματος οδήγησης, βήματα για απόκτηση, κόστη, ανανέωση και ανάκτηση χαμένου διπλώματος στην Ελλάδα.',
    url: `${SITE_URL}/driving-license`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Δίπλωμα Οδήγησης — Πώς Βγάζεις & Ανανεώνεις Δίπλωμα στην Ελλάδα',
    description: 'Κατηγορίες διπλώματος οδήγησης, βήματα για απόκτηση, κόστη, ανανέωση και ανάκτηση χαμένου διπλώματος στην Ελλάδα.',
  },
  alternates: {
    canonical: `${SITE_URL}/driving-license`,
  },
};

export default function DrivingLicensePage() {
  return (
    <StaticPageLayout title="Δίπλωμα Οδήγησης — Πώς Βγάζεις & Ανανεώνεις στην Ελλάδα" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η απόκτηση διπλώματος οδήγησης στην Ελλάδα απαιτεί τήρηση συγκεκριμένων βημάτων ανά
          κατηγορία οχήματος. Σε αυτόν τον οδηγό θα βρείτε τις κατηγορίες, τα βήματα για την Β
          κατηγορία, τα κόστη, και πώς γίνεται η ανανέωση ή ανάκτηση χαμένου διπλώματος.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Κατηγορίες Διπλώματος</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Κατηγορία</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Όχημα</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Ελάχιστη Ηλικία</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700 font-medium">ΑΜ</td>
                <td className="px-4 py-3 text-gray-700">Μοτοποδήλατα &lt;50 κ.εκ., &lt;45 km/h</td>
                <td className="px-4 py-3 text-gray-700">16 ετών</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700 font-medium">Α1</td>
                <td className="px-4 py-3 text-gray-700">Μοτοσυκλέτες 125 κ.εκ., &lt;11 kW</td>
                <td className="px-4 py-3 text-gray-700">16 ετών</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700 font-medium">Α2</td>
                <td className="px-4 py-3 text-gray-700">Μοτοσυκλέτες &lt;35 kW</td>
                <td className="px-4 py-3 text-gray-700">18 ετών</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700 font-medium">Α</td>
                <td className="px-4 py-3 text-gray-700">Μοτοσυκλέτες χωρίς περιορισμό ισχύος</td>
                <td className="px-4 py-3 text-gray-700">24 ετών (ή 20 με 2ετή Α2)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700 font-medium">Β</td>
                <td className="px-4 py-3 text-gray-700">Επιβατικά αυτοκίνητα έως 3.500 kg</td>
                <td className="px-4 py-3 text-gray-700">18 ετών</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700 font-medium">C1 / C</td>
                <td className="px-4 py-3 text-gray-700">Φορτηγά 3.500–7.500 kg / &gt;7.500 kg</td>
                <td className="px-4 py-3 text-gray-700">18 / 21 ετών</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700 font-medium">D1 / D</td>
                <td className="px-4 py-3 text-gray-700">Λεωφορεία έως 16 / άνω 16 επιβατών</td>
                <td className="px-4 py-3 text-gray-700">21 / 24 ετών</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Βήματα Απόκτησης (Β Κατηγορία)</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">1. Εγγραφή σε Σχολή Οδηγών</h3>
            <p className="text-gray-700 text-sm">
              Επιλέξτε και εγγραφείτε σε αδειοδοτημένη σχολή οδηγών. Η σχολή θα σας κατατοπίσει
              για τις επόμενες διαδικασίες.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">2. Υγειονομική Εξέταση</h3>
            <p className="text-gray-700 text-sm">
              Εξέταση από παθολόγο και οφθαλμίατρο. Απαιτείται βεβαίωση υγείας που να πιστοποιεί
              ότι δεν υπάρχει αντένδειξη για οδήγηση.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">3. Θεωρητική Εξέταση (ΥΠ.Υ.ΜΕ.ΔΙ.)</h3>
            <p className="text-gray-700 text-sm">
              Γραπτή εξέταση σε ηλεκτρονικό σύστημα του Υπουργείου Υποδομών & Μεταφορών. Περιλαμβάνει
              ερωτήσεις κώδικα οδικής κυκλοφορίας. Απαιτείται κατώτατο βαθμολόγιο.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">4. Μαθήματα Οδήγησης</h3>
            <p className="text-gray-700 text-sm">
              Ελάχιστα <strong>20 μαθήματα οδήγησης</strong> στη σχολή. Ο εκπαιδευτής αξιολογεί
              την ετοιμότητα για την πρακτική εξέταση.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">5. Πρακτική Εξέταση</h3>
            <p className="text-gray-700 text-sm">
              Εξέταση οδήγησης από εξεταστή ΥΠ.Υ.ΜΕ.ΔΙ. Περιλαμβάνει ασκήσεις στο χώρο και
              οδήγηση σε πραγματικές συνθήκες κυκλοφορίας.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">6. Έκδοση Διπλώματος</h3>
            <p className="text-gray-700 text-sm">
              Μετά την επιτυχία στις εξετάσεις, υποβάλλετε αίτηση στη Διεύθυνση Μεταφορών ή
              ηλεκτρονικά μέσω{' '}
              <a href="https://www.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                gov.gr
              </a>{' '}
              για την έκδοση του φυσικού διπλώματος.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Κόστη</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Κατηγορία Κόστους</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Κόστος (κατά προσέγγιση)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700">Εγγραφή & διδακτικά σχολής</td>
                <td className="px-4 py-3 text-gray-700">50–100 €</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Υγειονομική εξέταση</td>
                <td className="px-4 py-3 text-gray-700">30–60 €</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Παράβολο θεωρητικής εξέτασης</td>
                <td className="px-4 py-3 text-gray-700">~30 €</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Μαθήματα οδήγησης (20+)</td>
                <td className="px-4 py-3 text-gray-700">600–1.200 €</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Παράβολο πρακτικής εξέτασης</td>
                <td className="px-4 py-3 text-gray-700">~60 €</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Έκδοση διπλώματος</td>
                <td className="px-4 py-3 text-gray-700">~30 €</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          * Τα ποσά είναι ενδεικτικά και ποικίλλουν ανά σχολή και περιοχή.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Ανανέωση Διπλώματος</h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">📅 Πότε Λήγει</h3>
              <p className="text-gray-700 text-sm">
                Β κατηγορία: <strong>15 χρόνια</strong> (έως 74 ετών), <strong>3 χρόνια</strong> (75+).
                Επαγγελματικές κατηγορίες (C, D): κάθε 5 χρόνια ή λιγότερο ανάλογα με ηλικία.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Διαδικασία Ανανέωσης</h3>
              <p className="text-gray-700 text-sm">
                Υποβολή αίτησης στη Διεύθυνση Μεταφορών ή ηλεκτρονικά. Απαιτείται νέα υγειονομική
                εξέταση, φωτογραφίες και παράβολο ανανέωσης (~30 €).
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Ανάκτηση Χαμένου Διπλώματος</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Βήμα 1: Αναγγελία Απώλειας</h3>
            <p className="text-gray-700 text-sm">
              Υποβολή δήλωσης απώλειας σε αστυνομικό τμήμα ή μέσω gov.gr (ΑΥΣ — Αναγγελία Απώλειας
              Εγγράφου). Λαμβάνετε βεβαίωση αναγγελίας.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Βήμα 2: Αίτηση στη Διεύθυνση Μεταφορών</h3>
            <p className="text-gray-700 text-sm">
              Προσκομίστε αίτηση, βεβαίωση αναγγελίας απώλειας, ταυτότητα, φωτογραφία και παράβολο
              (~30 €). Εκδίδεται αντίγραφο/αντικατάσταση διπλώματος.
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
              <p className="text-sm text-gray-600">Ραντεβού, αίτηση διπλώματος, αναγγελία απώλειας</p>
            </div>
          </a>
          <a
            href="https://www.yme.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🚗</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Υπουργείο Υποδομών (yme.gov.gr)</p>
              <p className="text-sm text-gray-600">Κανονισμοί εξετάσεων, σχολές οδηγών, νομοθεσία</p>
            </div>
          </a>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα. Τα κόστη και οι
          διαδικασίες μπορεί να αλλάξουν. Για ακριβείς και επικαιροποιημένες πληροφορίες,
          απευθυνθείτε στη Διεύθυνση Μεταφορών της περιοχής σας ή στο gov.gr.
        </p>
      </section>
    </StaticPageLayout>
  );
}
