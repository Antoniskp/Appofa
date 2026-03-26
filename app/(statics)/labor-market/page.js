import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Αγορά Εργασίας — Εργασιακά Δικαιώματα στην Ελλάδα',
  description: 'Κατώτατος μισθός, εργασιακά δικαιώματα, άδειες, απόλυση, ωράριο — πρακτικός οδηγός για εργαζόμενους και εργοδότες.',
  openGraph: {
    title: 'Αγορά Εργασίας — Εργασιακά Δικαιώματα στην Ελλάδα',
    description: 'Κατώτατος μισθός, εργασιακά δικαιώματα, άδειες, απόλυση, ωράριο — πρακτικός οδηγός για εργαζόμενους και εργοδότες.',
    url: `${SITE_URL}/labor-market`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Αγορά Εργασίας — Εργασιακά Δικαιώματα στην Ελλάδα',
    description: 'Κατώτατος μισθός, εργασιακά δικαιώματα, άδειες, απόλυση, ωράριο — πρακτικός οδηγός για εργαζόμενους και εργοδότες.',
  },
  alternates: {
    canonical: `${SITE_URL}/labor-market`,
  },
};

export default function LaborMarketPage() {
  return (
    <StaticPageLayout title="Αγορά Εργασίας — Εργασιακά Δικαιώματα στην Ελλάδα" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η εργατική νομοθεσία στην Ελλάδα καθορίζει τα δικαιώματα και τις υποχρεώσεις εργαζομένων
          και εργοδοτών. Σε αυτόν τον οδηγό θα βρείτε πρακτικές πληροφορίες για μισθούς, ωράριο,
          άδειες, απόλυση και ασφαλιστικές εισφορές.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Κατώτατος Μισθός & Αποδοχές</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Ο κατώτατος μισθός στην Ελλάδα ορίζεται με Υπουργική Απόφαση και αναθεωρείται περιοδικά.
            Ισχύει για μισθωτούς άνω των 25 ετών. Για νέους κάτω των 25 ετών ισχύει ειδικό ποσό.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">💰 Κατώτατος Μισθός</h3>
              <p className="text-gray-700 text-sm">
                Ο κατώτατος μισθός ανέρχεται σε <strong>830 € μικτά/μήνα</strong> (1η Απριλίου 2024)
                για πλήρη απασχόληση. Το κατώτατο ημερομίσθιο είναι <strong>37,07 €</strong>.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">🎁 Δώρα & Επίδομα Αδείας</h3>
              <p className="text-gray-700 text-sm">
                Δώρο Χριστουγέννων: 1 μηνιαίος μισθός. Δώρο Πάσχα: ½ μηνιαίος μισθός.
                Επίδομα αδείας: ½ μηνιαίος μισθός. Τα ποσά είναι αναλογικά αν δεν έχει συμπληρωθεί
                πλήρες εξάμηνο/έτος.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Ωράριο Εργασίας</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Νόμιμο Ωράριο</h3>
            <p className="text-gray-700 text-sm">
              Το νόμιμο ωράριο εργασίας είναι <strong>8 ώρες/ημέρα</strong> και <strong>40 ώρες/εβδομάδα</strong>.
              Υπάρχει δυνατότητα εφαρμογής ψηφιακής κάρτας εργασίας για έλεγχο ωραρίου.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Υπερεργασία & Υπερωρίες</h3>
            <p className="text-gray-700 text-sm">
              <strong>Υπερεργασία</strong> (41η–45η ώρα): αμείβεται με προσαύξηση 20%. <strong>Νόμιμη υπερωρία</strong>{' '}
              (πέραν των 45 ωρών): 40% προσαύξηση. <strong>Παράνομη υπερωρία</strong> (χωρίς αναγγελία): 80% προσαύξηση.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Νυχτερινή & Κυριακάτικη Εργασία</h3>
            <p className="text-gray-700 text-sm">
              Νυχτερινή εργασία (22:00–06:00): προσαύξηση 25%. Εργασία Κυριακής ή αργίας:
              προσαύξηση 75% επί του νόμιμου μισθού.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Άδεια & Απουσίες</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏖️ Ετήσια Άδεια</h3>
            <p className="text-gray-700 text-sm">
              Ελάχιστη ετήσια άδεια: <strong>20 εργάσιμες ημέρες</strong> (5ήμερη εβδομάδα) ή
              24 εργάσιμες (6ήμερη) για το 1ο έτος. Αυξάνεται με τα χρόνια υπηρεσίας.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏥 Αναρρωτική Άδεια</h3>
            <p className="text-gray-700 text-sm">
              Δικαίωμα αναρρωτικής άδειας με αποδοχές. Για &lt;4 χρόνια υπηρεσίας: 1 μήνας. Με
              ιατρική βεβαίωση. Πέραν του ορίου, ο εργαζόμενος μπορεί να λάβει επίδομα ασθενείας
              από τον e-ΕΦΚΑ.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">👶 Μητρότητα</h3>
            <p className="text-gray-700 text-sm">
              Άδεια μητρότητας: <strong>119 ημέρες</strong> συνολικά (56 πριν + 63 μετά τον τοκετό).
              Επίδομα από τον e-ΕΦΚΑ. Ακολουθεί γονική άδεια 4 μηνών (χωρίς αποδοχές ή με εισφορά).
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">👨 Πατρότητα</h3>
            <p className="text-gray-700 text-sm">
              Άδεια πατρότητας: <strong>14 εργάσιμες ημέρες</strong> με αποδοχές, αμέσως μετά τον
              τοκετό. Επιπλέον γονική άδεια 4 μηνών κοινή με τη μητέρα.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Απόλυση & Αποζημίωση</h2>
        <div className="space-y-4 mb-4">
          <p className="text-gray-700">
            Η καταγγελία σύμβασης εργασίας γίνεται είτε από τον εργοδότη (απόλυση) είτε από τον
            εργαζόμενο (παραίτηση). Σε απόλυση, ο εργαζόμενος δικαιούται αποζημίωση εκτός αν
            απολυθεί για σπουδαίο λόγο (ΑΚ 672).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Χρόνια Υπηρεσίας</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Αποζημίωση (μισθοί)</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Προειδοποίηση</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700">1 – 2 έτη</td>
                <td className="px-4 py-3 text-gray-700">1 μηνιαίος μισθός</td>
                <td className="px-4 py-3 text-gray-700">1 μήνας</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">2 – 5 έτη</td>
                <td className="px-4 py-3 text-gray-700">2 μηνιαίοι μισθοί</td>
                <td className="px-4 py-3 text-gray-700">2 μήνες</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">5 – 10 έτη</td>
                <td className="px-4 py-3 text-gray-700">3 μηνιαίοι μισθοί</td>
                <td className="px-4 py-3 text-gray-700">3 μήνες</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">10 – 15 έτη</td>
                <td className="px-4 py-3 text-gray-700">4 μηνιαίοι μισθοί</td>
                <td className="px-4 py-3 text-gray-700">4 μήνες</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">&gt; 20 έτη</td>
                <td className="px-4 py-3 text-gray-700">έως 12 μηνιαίοι μισθοί</td>
                <td className="px-4 py-3 text-gray-700">4 μήνες</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          * Τα ποσά αφορούν υπαλλήλους. Για εργατοτεχνίτες ισχύουν διαφορετικοί υπολογισμοί.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Ασφαλιστικές Εισφορές</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Οι ασφαλιστικές εισφορές καταβάλλονται από εργαζόμενο και εργοδότη στον e-ΕΦΚΑ
            (Ηλεκτρονικός Εθνικός Φορέας Κοινωνικής Ασφάλισης).
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">👤 Εργαζόμενος</h3>
              <p className="text-gray-700 text-sm">
                Σύνολο εισφορών εργαζομένου: <strong>~16% επί του μισθού</strong> (κύρια σύνταξη,
                υγεία, επικουρική ασφάλιση κ.ά.).
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏢 Εργοδότης</h3>
              <p className="text-gray-700 text-sm">
                Σύνολο εισφορών εργοδότη: <strong>~24% επί του μισθού</strong>. Συνολικό κόστος
                εργασίας για τον εργοδότη: μισθός + ~24% εισφορές.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοι Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.ergani.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">💼</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">ΕΡΓΑΝΗ (ergani.gov.gr)</p>
              <p className="text-sm text-gray-600">Σύστημα δήλωσης εργαζομένων, ωράριο, αναγγελίες</p>
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
              <p className="text-sm text-gray-600">Ασφαλιστικές εισφορές, ένσημα, παροχές ασθενείας</p>
            </div>
          </a>
          <a
            href="https://www.dypa.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🔍</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">ΔΥΠΑ (dypa.gov.gr)</p>
              <p className="text-sm text-gray-600">Επίδομα ανεργίας, εύρεση εργασίας, προγράμματα κατάρτισης</p>
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
              <p className="text-sm text-gray-600">Ψηφιακές υπηρεσίες — βεβαιώσεις, αιτήσεις</p>
            </div>
          </a>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα και δεν αποτελούν νομική
          συμβουλή. Η εργατική νομοθεσία αλλάζει συχνά. Για συγκεκριμένα εργασιακά ζητήματα,
          απευθυνθείτε σε δικηγόρο εργατολόγο ή στον ΣΕΠΕ (Σώμα Επιθεώρησης Εργασίας).
        </p>
      </section>
    </StaticPageLayout>
  );
}
