import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata = {
  title: 'Οικονομία - Απόφαση',
  description: 'Βασικές έννοιες, τάσεις και ανάλυση της ελληνικής και παγκόσμιας οικονομίας.',
};

export default function EconomyPage() {
  return (
    <StaticPageLayout title="Οικονομία" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η οικονομία είναι το σύστημα που καθορίζει πώς παράγονται, διανέμονται και καταναλώνονται αγαθά
          και υπηρεσίες. Η κατανόησή της είναι απαραίτητη για κάθε ενεργό πολίτη.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Ελληνική Οικονομία</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Η ελληνική οικονομία βασίζεται κυρίως στον τουρισμό, τη ναυτιλία, την αγροτική παραγωγή
            και τον τομέα υπηρεσιών. Μετά τη δημοσιονομική κρίση της δεκαετίας του 2010, η χώρα
            βρίσκεται σε τροχιά ανάκαμψης με σταθερές ρυθμούς ανάπτυξης.
          </p>
          <p className="text-gray-700">
            Βασικές προκλήσεις παραμένουν η αντιμετώπιση της ανεργίας, ιδιαίτερα στους νέους, η
            βελτίωση της ανταγωνιστικότητας και η ενίσχυση του παραγωγικού ιστού.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Βασικές Οικονομικές Έννοιες</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📈 ΑΕΠ (Ακαθάριστο Εγχώριο Προϊόν)</h3>
            <p className="text-gray-700 text-sm">
              Η συνολική αξία αγαθών και υπηρεσιών που παράγονται σε μια χώρα σε συγκεκριμένο χρονικό
              διάστημα. Βασικός δείκτης μέτρησης της οικονομικής δραστηριότητας.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💹 Πληθωρισμός</h3>
            <p className="text-gray-700 text-sm">
              Η γενική αύξηση των τιμών αγαθών και υπηρεσιών σε μια οικονομία με την πάροδο του
              χρόνου. Ο έλεγχός του αποτελεί κεντρικό στόχο της νομισματικής πολιτικής.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏛️ Δημοσιονομική Πολιτική</h3>
            <p className="text-gray-700 text-sm">
              Η διαχείριση των κρατικών εσόδων (φόρων) και δαπανών με στόχο τη σταθεροποίηση και
              ανάπτυξη της οικονομίας.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🌍 Εξωτερικό Εμπόριο</h3>
            <p className="text-gray-700 text-sm">
              Η ανταλλαγή αγαθών και υπηρεσιών μεταξύ χωρών. Το ισοζύγιο εξαγωγών–εισαγωγών
              επηρεάζει άμεσα την ισχύ μιας εθνικής οικονομίας.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Τάσεις & Προκλήσεις</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ψηφιακή Οικονομία</h3>
            <p className="text-gray-700 text-sm">
              Η ραγδαία ανάπτυξη των ψηφιακών τεχνολογιών μεταμορφώνει παραγωγικές διαδικασίες,
              αγορές εργασίας και επιχειρηματικά μοντέλα.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Πράσινη Μετάβαση</h3>
            <p className="text-gray-700 text-sm">
              Η στροφή σε βιώσιμες οικονομικές πρακτικές και ανανεώσιμες πηγές ενέργειας αναδιαμορφώνει
              τις επενδυτικές προτεραιότητες και τους κλάδους παραγωγής.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ανισότητα</h3>
            <p className="text-gray-700 text-sm">
              Η διεύρυνση της εισοδηματικής ανισότητας αποτελεί παγκόσμια πρόκληση που επηρεάζει
              κοινωνική συνοχή και οικονομική μεγέθυνση.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Θέλεις να μάθεις περισσότερα;</h2>
        <p className="text-gray-700 text-sm">
          Παρακολούθησε τις ειδήσεις για τελευταίες εξελίξεις και συμμετέχε στις ψηφοφορίες
          εκφράζοντας την άποψή σου.
        </p>
      </section>
    </StaticPageLayout>
  );
}
