import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'ΔΥΠΑ — Επίδομα Ανεργίας & Υπηρεσίες Απασχόλησης',
  description: 'Επίδομα ανεργίας, εγγραφή στη ΔΥΠΑ, προγράμματα κατάρτισης και επιδοτούμενης απασχόλησης στην Ελλάδα.',
  openGraph: {
    title: 'ΔΥΠΑ — Επίδομα Ανεργίας & Υπηρεσίες Απασχόλησης',
    description: 'Επίδομα ανεργίας, εγγραφή στη ΔΥΠΑ, προγράμματα κατάρτισης και επιδοτούμενης απασχόλησης στην Ελλάδα.',
    url: `${SITE_URL}/dypa-unemployment`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'ΔΥΠΑ — Επίδομα Ανεργίας & Υπηρεσίες Απασχόλησης',
    description: 'Επίδομα ανεργίας, εγγραφή στη ΔΥΠΑ, προγράμματα κατάρτισης και επιδοτούμενης απασχόλησης στην Ελλάδα.',
  },
  alternates: {
    canonical: `${SITE_URL}/dypa-unemployment`,
  },
};

export default function DypaUnemploymentPage() {
  return (
    <StaticPageLayout title="ΔΥΠΑ — Επίδομα Ανεργίας & Υπηρεσίες Απασχόλησης" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η ΔΥΠΑ (Δημόσια Υπηρεσία Απασχόλησης), πρώην ΟΑΕΔ, είναι ο κύριος φορέας για την
          υποστήριξη ανέργων στην Ελλάδα. Παρέχει επίδομα ανεργίας, εγγραφή ανέργου, προγράμματα
          κατάρτισης και επιδοτούμενης απασχόλησης.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Επίδομα Ανεργίας</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Προϋποθέσεις</h3>
            <p className="text-gray-700 text-sm">
              Για να δικαιούστε επίδομα ανεργίας χρειάζεστε τουλάχιστον <strong>125 ημέρες ασφάλισης
              (ένσημα) στους τελευταίους 14 μήνες</strong> πριν την απόλυση, να έχετε απολυθεί (όχι
              να παραιτηθήκατε) και να εγγραφείτε στη ΔΥΠΑ εντός 60 ημερών από την απόλυση.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ποσό Επιδόματος</h3>
            <p className="text-gray-700 text-sm">
              Το βασικό επίδομα ανεργίας ανέρχεται σε <strong>~489 €/μήνα</strong> (55% × 29/30 × κατώτατος
              μισθός). Για οικογένεια με τέκνα, υπάρχουν επιπλέον επιδόματα.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Διάρκεια</h3>
            <p className="text-gray-700 text-sm">
              Η διάρκεια εξαρτάται από τον αριθμό ενσήμων:
            </p>
            <ul className="text-gray-700 text-sm mt-2 space-y-1 list-disc list-inside">
              <li>125–149 ημέρες ασφ. → 5 μήνες επίδομα</li>
              <li>150–299 ημέρες → 6 μήνες</li>
              <li>300+ ημέρες → 8–12 μήνες</li>
            </ul>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Πώς Αιτείσαι</h3>
            <p className="text-gray-700 text-sm">
              Ηλεκτρονικά μέσω{' '}
              <a href="https://www.dypa.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                dypa.gov.gr
              </a>{' '}
              ή σε Κέντρο Προώθησης Απασχόλησης (ΚΠΑ2) της περιοχής σας, εντός 60 ημερών από
              την ημερομηνία απόλυσης.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Εγγραφή στη ΔΥΠΑ</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Η εγγραφή ως άνεργος είναι απαραίτητη για να έχετε πρόσβαση στο επίδομα και σε άλλες
            υπηρεσίες απασχόλησης.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Απαιτούμενα Έγγραφα</h3>
              <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
                <li>Αστυνομική ταυτότητα ή διαβατήριο</li>
                <li>ΑΜΚΑ</li>
                <li>ΑΦΜ</li>
                <li>IBAN τραπεζικού λογαριασμού</li>
                <li>Βεβαίωση αποδοχών / λύσης σύμβασης</li>
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">🔄 Τακτική Επικαιροποίηση</h3>
              <p className="text-gray-700 text-sm">
                Οι εγγεγραμμένοι άνεργοι πρέπει να επικαιροποιούν την εγγραφή τους <strong>κάθε 3 μήνες</strong>
                ηλεκτρονικά ή στο ΚΠΑ2. Αν δεν επικαιροποιηθεί η κάρτα, διακόπτεται η αναγνώριση ανεργίας.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Προγράμματα Κατάρτισης</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📚 Επαγγελματική Κατάρτιση</h3>
            <p className="text-gray-700 text-sm">
              Δωρεάν ή επιδοτούμενα προγράμματα κατάρτισης σε ΙΕΚ, ΚΔΒΜ και άλλους φορείς. Καλύπτουν
              κλάδους όπως πληροφορική, τουρισμός, εμπόριο, υγεία κ.ά.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🎫 Voucher Κατάρτισης</h3>
            <p className="text-gray-700 text-sm">
              Ευρωπαϊκά voucher κατάρτισης για άνεργους (ΕΣΠΑ). Καλύπτουν εκπαιδευτικά προγράμματα
              και δίνουν ταυτόχρονα επίδομα συμμετοχής.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💻 Ψηφιακές Δεξιότητες</h3>
            <p className="text-gray-700 text-sm">
              Ειδικά προγράμματα για ψηφιακές δεξιότητες: χρήση Η/Υ, διαδίκτυο, ψηφιακό μάρκετινγκ,
              προγραμματισμός για άνεργους.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📖 Γλωσσική Κατάρτιση</h3>
            <p className="text-gray-700 text-sm">
              Μαθήματα ξένων γλωσσών (Αγγλικά, Γερμανικά κ.ά.) που οδηγούν σε αναγνωρισμένα πτυχία
              για ενίσχυση της απασχολησιμότητας.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Επιδοτούμενη Απασχόληση</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Πρόγραμμα Πρώτης Απασχόλησης</h3>
            <p className="text-gray-700 text-sm">
              Επιδότηση εργοδότη που προσλαμβάνει νέους άνεργους 18–29 ετών. Το Δημόσιο επιδοτεί
              μέρος των ασφαλιστικών εισφορών για συγκεκριμένο διάστημα.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Νέοι Επιχειρηματίες</h3>
            <p className="text-gray-700 text-sm">
              Προγράμματα για εγγεγραμμένους ανέργους που θέλουν να ξεκινήσουν επιχείρηση.
              Παρέχονται επιδοτήσεις, συμβουλευτική υποστήριξη και εκπαίδευση.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοί Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.dypa.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🔍</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">ΔΥΠΑ (dypa.gov.gr)</p>
              <p className="text-sm text-gray-600">Εγγραφή, επίδομα ανεργίας, προγράμματα, ΚΠΑ2</p>
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
              <p className="text-sm text-gray-600">Ένσημα, ιστορικό ασφάλισης, παροχές</p>
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
              <p className="text-sm text-gray-600">Ψηφιακές υπηρεσίες, βεβαιώσεις, πιστοποιητικά</p>
            </div>
          </a>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα. Τα ποσά επιδομάτων και
          οι προϋποθέσεις μπορεί να αλλάξουν. Για επικαιροποιημένες πληροφορίες και αίτηση
          επιδόματος, επισκεφθείτε το dypa.gov.gr ή το ΚΠΑ2 της περιοχής σας.
        </p>
      </section>
    </StaticPageLayout>
  );
}
