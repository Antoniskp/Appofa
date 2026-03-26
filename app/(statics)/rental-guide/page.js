import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Ενοίκιο & Μισθωτήριο — Οδηγός για Ενοικιαστές & Ιδιοκτήτες',
  description: 'Πώς συντάσσεις και δηλώνεις μισθωτήριο, δικαιώματα ενοικιαστή και ιδιοκτήτη, ηλεκτρονική δήλωση στην ΑΑΔΕ.',
  openGraph: {
    title: 'Ενοίκιο & Μισθωτήριο — Οδηγός για Ενοικιαστές & Ιδιοκτήτες',
    description: 'Πώς συντάσσεις και δηλώνεις μισθωτήριο, δικαιώματα ενοικιαστή και ιδιοκτήτη, ηλεκτρονική δήλωση στην ΑΑΔΕ.',
    url: `${SITE_URL}/rental-guide`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Ενοίκιο & Μισθωτήριο — Οδηγός για Ενοικιαστές & Ιδιοκτήτες',
    description: 'Πώς συντάσσεις και δηλώνεις μισθωτήριο, δικαιώματα ενοικιαστή και ιδιοκτήτη, ηλεκτρονική δήλωση στην ΑΑΔΕ.',
  },
  alternates: {
    canonical: `${SITE_URL}/rental-guide`,
  },
};

export default function RentalGuidePage() {
  return (
    <StaticPageLayout title="Ενοίκιο & Μισθωτήριο — Οδηγός για Ενοικιαστές & Ιδιοκτήτες" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η σύναψη και δήλωση μισθωτηρίου συμβολαίου αποτελεί υποχρέωση τόσο για τον ιδιοκτήτη
          όσο και για τον ενοικιαστή. Σε αυτόν τον οδηγό θα βρείτε τι πρέπει να περιλαμβάνει
          το μισθωτήριο, πώς δηλώνεται στην ΑΑΔΕ και ποια είναι τα δικαιώματα κάθε πλευράς.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Σύνταξη Μισθωτηρίου</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Το μισθωτήριο συμβόλαιο είναι η γραπτή συμφωνία μεταξύ εκμισθωτή (ιδιοκτήτη) και
            μισθωτή (ενοικιαστή). Πρέπει να περιλαμβάνει τα ακόλουθα στοιχεία:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Υποχρεωτικά Στοιχεία</h3>
              <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
                <li>Στοιχεία ιδιοκτήτη και ενοικιαστή (ΑΦΜ, ταυτότητα)</li>
                <li>Περιγραφή ακινήτου (διεύθυνση, εμβαδόν, χρήση)</li>
                <li>Μηνιαίο ενοίκιο και τρόπος πληρωμής</li>
                <li>Διάρκεια μίσθωσης (έναρξη - λήξη)</li>
                <li>Εγγύηση (συνήθως 1–2 μήνες ενοίκιο)</li>
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">📅 Ελάχιστη Διάρκεια</h3>
              <p className="text-gray-700 text-sm">
                Για κατοικία: <strong>ελάχιστη διάρκεια 3 χρόνια</strong>, ακόμα και αν το
                συμφωνητικό ορίζει μικρότερη. Για επαγγελματική χρήση: ελάχιστη 3 χρόνια
                (εξαιρούνται ορισμένες περιπτώσεις). Για βραχυχρόνια μίσθωση (Airbnb): ειδικές
                διατάξεις μέσω ΑΑΔΕ.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Δήλωση στην ΑΑΔΕ</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Υποχρεωτική Δήλωση</h3>
            <p className="text-gray-700 text-sm">
              Κάθε μισθωτήριο πρέπει να δηλώνεται υποχρεωτικά στην ΑΑΔΕ μέσω <strong>myProperty</strong>
              (TAXISnet). Η δήλωση γίνεται εντός <strong>1 μήνα</strong> από την υπογραφή του
              μισθωτηρίου ή την έναρξη της μίσθωσης.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Πώς Γίνεται η Δήλωση</h3>
            <p className="text-gray-700 text-sm">
              Συνδεθείτε στο{' '}
              <a href="https://www.gsis.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                TAXISnet (gsis.gr)
              </a>{' '}
              → myAADE → myProperty → Νέα Μίσθωση. Συμπληρώστε τα στοιχεία του μισθωτηρίου
              και του ενοικιαστή. Το σύστημα εκδίδει αριθμό καταχώρησης.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Συνέπειες Μη Δήλωσης</h3>
            <p className="text-gray-700 text-sm">
              Η μη δήλωση μισθωτηρίου επιφέρει πρόστιμα και η τεκμαρτή μίσθωση
              (βάσει αντικειμενικής αξίας) μπορεί να φορολογηθεί. Επίσης, ο ενοικιαστής δεν
              μπορεί να εκπέσει το ενοίκιο από τα τεκμήρια.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Δικαιώματα Ενοικιαστή</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏠 Ήρεμη Χρήση</h3>
            <p className="text-gray-700 text-sm">
              Δικαίωμα απρόσκοπτης και ήρεμης χρήσης του μισθίου. Ο ιδιοκτήτης δεν μπορεί να
              εισέρχεται χωρίς προειδοποίηση και συναίνεση του ενοικιαστή.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🔧 Επισκευές</h3>
            <p className="text-gray-700 text-sm">
              Ο ιδιοκτήτης υποχρεούται να πραγματοποιεί τις αναγκαίες επισκευές για τη διατήρηση
              της κατοικίας σε κατάλληλη κατάσταση (δομικά, αδρανοποιήσεις, κεντρική θέρμανση).
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🛡️ Προστασία από Έξωση</h3>
            <p className="text-gray-700 text-sm">
              Ο ενοικιαστής προστατεύεται από αυθαίρετη έξωση. Η καταγγελία μισθωτηρίου από τον
              ιδιοκτήτη απαιτεί νόμιμους λόγους (π.χ. μη καταβολή ενοικίου, βαριά παραβίαση).
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📊 Ρήτρα Αναπροσαρμογής</h3>
            <p className="text-gray-700 text-sm">
              Κάθε αύξηση ενοικίου πρέπει να προβλέπεται στο μισθωτήριο (π.χ. κατ' έτος βάσει
              ΔΤΚ ή σταθερό ποσοστό). Αυθαίρετες αυξήσεις δεν είναι νόμιμες.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Δικαιώματα Ιδιοκτήτη</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💰 Καταβολή Ενοικίου</h3>
            <p className="text-gray-700 text-sm">
              Δικαίωμα εμπρόθεσμης καταβολής ενοικίου. Σε καθυστέρηση, ο ιδιοκτήτης μπορεί να
              ζητήσει διαταγή πληρωμής ή καταγγελία του μισθωτηρίου.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏗️ Διατήρηση Κατάστασης</h3>
            <p className="text-gray-700 text-sm">
              Ο ενοικιαστής οφείλει να παραδώσει το ακίνητο στην κατάσταση που το παρέλαβε
              (εκτός φυσιολογικής φθοράς). Η εγγύηση καλύπτει τυχόν ζημιές.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🔑 Πρόσβαση για Επισκευές</h3>
            <p className="text-gray-700 text-sm">
              Ο ιδιοκτήτης έχει δικαίωμα πρόσβασης για αναγκαίες επισκευές, με προηγούμενη
              ειδοποίηση και σε εύλογο χρόνο.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Καταγγελία</h3>
            <p className="text-gray-700 text-sm">
              Δυνατότητα καταγγελίας για σοβαρές παραβάσεις (μη καταβολή ενοικίου άνω των 2 μηνών,
              υπεκμίσθωση χωρίς άδεια, μεταβολή χρήσης). Απαιτείται έγγραφη ειδοποίηση 30 ημερών.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Φορολογία Εισοδήματος από Ενοίκια</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Ετήσιο Εισόδημα Ενοικίων (€)</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Φορολογικός Συντελεστής</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700">0 – 12.000</td>
                <td className="px-4 py-3 text-gray-700">15%</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">12.001 – 35.000</td>
                <td className="px-4 py-3 text-gray-700">35%</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">&gt; 35.000</td>
                <td className="px-4 py-3 text-gray-700">45%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          * Τα εισοδήματα από ενοίκια δηλώνονται στο Ε1 και το Ε2 κατά την υποβολή φορολογικής δήλωσης.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοί Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.gsis.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">💻</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">myProperty / TAXISnet (gsis.gr)</p>
              <p className="text-sm text-gray-600">Δήλωση μισθωτηρίου, εισοδήματα ενοικίων, Ε2</p>
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
              <p className="text-sm text-gray-600">Φορολογικές πληροφορίες για ενοίκια και ακίνητα</p>
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
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα και δεν αποτελούν νομική
          συμβουλή. Η νομοθεσία για τις μισθώσεις αλλάζει. Για συγκεκριμένα ζητήματα μισθωτηρίου,
          απευθυνθείτε σε δικηγόρο ή σε αρμόδιο φοροτεχνικό.
        </p>
      </section>
    </StaticPageLayout>
  );
}
