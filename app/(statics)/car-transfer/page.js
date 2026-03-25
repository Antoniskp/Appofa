import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Αγορά & Μεταβίβαση Αυτοκινήτου - Απόφαση',
  description: 'Πλήρης οδηγός για την αγορά, πώληση και μεταβίβαση αυτοκινήτου στην Ελλάδα. Έγγραφα, κόστη, φόροι, διαδικασία βήμα-βήμα και χρήσιμοι σύνδεσμοι.',
  openGraph: {
    title: 'Αγορά & Μεταβίβαση Αυτοκινήτου - Απόφαση',
    description: 'Πλήρης οδηγός για την αγορά, πώληση και μεταβίβαση αυτοκινήτου στην Ελλάδα. Έγγραφα, κόστη, φόροι, διαδικασία βήμα-βήμα και χρήσιμοι σύνδεσμοι.',
    url: `${SITE_URL}/car-transfer`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Αγορά & Μεταβίβαση Αυτοκινήτου - Απόφαση',
    description: 'Πλήρης οδηγός για την αγορά, πώληση και μεταβίβαση αυτοκινήτου στην Ελλάδα. Έγγραφα, κόστη, φόροι, διαδικασία βήμα-βήμα και χρήσιμοι σύνδεσμοι.',
  },
  alternates: {
    canonical: `${SITE_URL}/car-transfer`,
  },
};

export default function CarTransferPage() {
  return (
    <StaticPageLayout title="Αγορά & Μεταβίβαση Αυτοκινήτου στην Ελλάδα" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η αγορά ή μεταβίβαση αυτοκινήτου στην Ελλάδα περιλαμβάνει συγκεκριμένα βήματα, έγγραφα και
          κόστη. Σε αυτόν τον οδηγό θα βρείτε αναλυτικά τη διαδικασία, τα απαιτούμενα δικαιολογητικά,
          τους φόρους και τα τέλη, καθώς και χρήσιμους συνδέσμους σε επίσημους φορείς.
        </p>
      </section>

      {/* Section: Overview of the process */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Επισκόπηση Διαδικασίας</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Η μεταβίβαση αυτοκινήτου γίνεται μέσω της αρμόδιας Διεύθυνσης Μεταφορών και Επικοινωνιών
            της Περιφερειακής Ενότητας στην οποία ανήκει το όχημα. Η διαδικασία αφορά τόσο αγοραπωλησίες
            μεταχειρισμένων οχημάτων μεταξύ ιδιωτών όσο και αγορές από εμπόρους.
          </p>
          <p className="text-gray-700">
            Για νέα αυτοκίνητα η αντιπροσωπεία αναλαμβάνει τη διαδικασία ταξινόμησης. Για μεταχειρισμένα
            από το εξωτερικό (εισαγωγή), απαιτείται επιπλέον εκτελωνισμός και πληρωμή φόρων.
          </p>
        </div>
      </section>

      {/* Section: Step-by-step guide */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Βήματα Μεταβίβασης (Μεταξύ Ιδιωτών)</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">1. Συμφωνία Αγοραπωλησίας</h3>
            <p className="text-gray-700 text-sm">
              Αγοραστής και πωλητής συμφωνούν στην τιμή. Δεν χρειάζεται συμβολαιογραφικό έγγραφο — αρκεί
              ιδιωτικό συμφωνητικό ή απλά η κοινή παρουσία στη Διεύθυνση Μεταφορών.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">2. Έλεγχος Οφειλών & ΚΤΕΟ</h3>
            <p className="text-gray-700 text-sm">
              Πριν τη μεταβίβαση βεβαιωθείτε ότι το όχημα δεν έχει ανεξόφλητα τέλη κυκλοφορίας, πρόστιμα
              ή ληξιπρόθεσμο ΚΤΕΟ. Ζητήστε βεβαίωση μη οφειλής τελών κυκλοφορίας από τη{' '}
              <a href="https://www.aade.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                ΑΑΔΕ (aade.gr)
              </a>.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">3. Πληρωμή Τέλους Μεταβίβασης</h3>
            <p className="text-gray-700 text-sm">
              Πληρωμή του τέλους μεταβίβασης (e-Παράβολο) στο{' '}
              <a href="https://www.gsis.gr/e-paravolo" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                e-Παράβολο (gsis.gr)
              </a>. Η πληρωμή μπορεί να γίνει και μέσω τράπεζας ή ΕΛΤΑ.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">4. Επίσκεψη στη Διεύθυνση Μεταφορών</h3>
            <p className="text-gray-700 text-sm">
              Και οι δύο πλευρές (ή εξουσιοδοτημένοι εκπρόσωποι με πληρεξούσιο/εξουσιοδότηση)
              προσέρχονται στη Διεύθυνση Μεταφορών και Επικοινωνιών με τα απαιτούμενα δικαιολογητικά.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">5. Έκδοση Νέας Άδειας Κυκλοφορίας</h3>
            <p className="text-gray-700 text-sm">
              Μετά τον έλεγχο των εγγράφων, εκδίδεται νέα άδεια κυκλοφορίας στο όνομα του αγοραστή.
              Οι πινακίδες παραμένουν οι ίδιες εκτός αν ζητηθεί αλλαγή ή αλλάξει Περιφερειακή Ενότητα.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Required documents */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Απαιτούμενα Δικαιολογητικά</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📄 Από τον Πωλητή</h3>
            <ul className="text-gray-700 text-sm space-y-2 list-disc list-inside">
              <li>Αστυνομική ταυτότητα ή διαβατήριο</li>
              <li>Άδεια κυκλοφορίας του οχήματος</li>
              <li>Βεβαίωση μη οφειλής τελών κυκλοφορίας</li>
              <li>Ισχύον δελτίο ΚΤΕΟ (αν απαιτείται)</li>
              <li>ΑΦΜ (Αριθμός Φορολογικού Μητρώου)</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Από τον Αγοραστή</h3>
            <ul className="text-gray-700 text-sm space-y-2 list-disc list-inside">
              <li>Αστυνομική ταυτότητα ή διαβατήριο</li>
              <li>ΑΦΜ (Αριθμός Φορολογικού Μητρώου)</li>
              <li>Αίτηση μεταβίβασης (παρέχεται στη Δ/νση Μεταφορών)</li>
              <li>e-Παράβολο πληρωμής τέλους μεταβίβασης</li>
              <li>Ασφαλιστήριο συμβόλαιο (νέα ασφάλεια στο όνομα αγοραστή)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section: Costs and taxes */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Κόστη, Τέλη & Φόροι</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Κατηγορία</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Κόστος (κατά προσέγγιση)</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Σημειώσεις</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700">Τέλος μεταβίβασης (e-Παράβολο)</td>
                <td className="px-4 py-3 text-gray-700">~75 €</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Εξαρτάται από τον κυβισμό</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Τέλη Μηχανογράφησης</td>
                <td className="px-4 py-3 text-gray-700">~9 €</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Ενσωματώνονται στο παράβολο</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Ασφάλεια αυτοκινήτου</td>
                <td className="px-4 py-3 text-gray-700">150–600+ €/έτος</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Ανάλογα με κάλυψη, ηλικία οδηγού κ.ά.</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">ΚΤΕΟ (αν έχει λήξει)</td>
                <td className="px-4 py-3 text-gray-700">~40–65 €</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Ιδιωτικό ΚΤΕΟ ≈ 45–65 €, Δημόσιο ≈ 40 €</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Τέλη κυκλοφορίας (ετήσια)</td>
                <td className="px-4 py-3 text-gray-700">22–1.380+ €/έτος</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Ανάλογα με τον κυβισμό και τις εκπομπές CO₂</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Εισαγωγή (τελωνείο + φόροι)</td>
                <td className="px-4 py-3 text-gray-700">Μεταβλητό</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Τέλος ταξινόμησης, ΦΠΑ 24%, δασμοί (εκτός ΕΕ)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          * Τα ποσά είναι ενδεικτικά και μπορεί να αλλάξουν. Ελέγχετε πάντα στις επίσημες πηγές.
        </p>
      </section>

      {/* Section: Import from abroad */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Εισαγωγή Αυτοκινήτου από το Εξωτερικό</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Αν αγοράζετε αυτοκίνητο από χώρα της ΕΕ ή εκτός ΕΕ, η διαδικασία περιλαμβάνει επιπλέον βήματα:
          </p>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Από χώρα ΕΕ</h3>
            <p className="text-gray-700 text-sm">
              Δεν πληρώνονται δασμοί, αλλά καταβάλλεται <strong>τέλος ταξινόμησης</strong> και{' '}
              <strong>ΦΠΑ 24%</strong> (αν αγοράστηκε χωρίς ΦΠΑ ή είναι καινούργιο). Απαιτείται πιστοποιητικό
              συμμόρφωσης (CoC) ή έγκριση τύπου.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Από χώρα εκτός ΕΕ</h3>
            <p className="text-gray-700 text-sm">
              Πληρώνονται <strong>δασμοί</strong> (συνήθως 6,5% για επιβατικά), <strong>ΦΠΑ 24%</strong> και{' '}
              <strong>τέλος ταξινόμησης</strong>. Ο εκτελωνισμός γίνεται στο τελωνείο εισόδου. Συνιστάται η
              χρήση εκτελωνιστή.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Τέλος Ταξινόμησης</h3>
            <p className="text-gray-700 text-sm">
              Υπολογίζεται βάσει κυβισμού, εκπομπών CO₂ και αξίας του οχήματος. Μπορεί να κυμαίνεται
              από μερικές εκατοντάδες μέχρι χιλιάδες ευρώ, ιδίως για οχήματα μεγάλου κυβισμού ή υψηλών
              εκπομπών. Υπολογισμός μέσω{' '}
              <a href="https://www.aade.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                ΑΑΔΕ
              </a>.
            </p>
          </div>
        </div>
      </section>

      {/* Section: KTEO */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">ΚΤΕΟ (Τεχνικός Έλεγχος)</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Ο περιοδικός τεχνικός έλεγχος (ΚΤΕΟ) είναι υποχρεωτικός και απαραίτητος για τη μεταβίβαση.
            Ο πρώτος έλεγχος γίνεται 4 χρόνια μετά την πρώτη κυκλοφορία και στη συνέχεια κάθε 2 χρόνια.
          </p>
          <p className="text-gray-700">
            Μπορείτε να κλείσετε ραντεβού σε δημόσιο ΚΤΕΟ μέσω{' '}
            <a href="https://www.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              gov.gr
            </a>{' '}
            ή να επισκεφτείτε ιδιωτικό ΚΤΕΟ χωρίς ραντεβού.
          </p>
        </div>
      </section>

      {/* Section: Annual road tax */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Τέλη Κυκλοφορίας (Ετήσια)</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Τα ετήσια τέλη κυκλοφορίας πληρώνονται κάθε Δεκέμβριο μέσω{' '}
            <a href="https://www.gsis.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              myCAR (gsis.gr)
            </a>{' '}
            ή σε τράπεζα/ΕΛΤΑ. Η μη πληρωμή οδηγεί σε πρόστιμο και ακινητοποίηση του οχήματος.
          </p>
          <p className="text-gray-700">
            Το ποσό εξαρτάται από τον κυβισμό (κ.εκ.) και τις εκπομπές CO₂ του οχήματος. Ηλεκτρικά
            αυτοκίνητα απαλλάσσονται πλήρως από τα τέλη κυκλοφορίας (μέχρι νεοτέρας).
          </p>
        </div>
      </section>

      {/* Section: Tips for buyers */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Συμβουλές για Αγοραστές</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🔍 Έλεγχος Ιστορικού</h3>
            <p className="text-gray-700 text-sm">
              Ζητήστε αντίγραφο του ιστορικού service, ελέγξτε χιλιόμετρα (πιθανή παραποίηση) και ζητήστε
              έλεγχο από ανεξάρτητο μηχανικό πριν κλείσετε τη συμφωνία.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📑 Βεβαίωση Μη Οφειλών</h3>
            <p className="text-gray-700 text-sm">
              Ζητήστε βεβαίωση μη οφειλής τελών κυκλοφορίας. Αν υπάρχουν ανεξόφλητα τέλη, η μεταβίβαση δεν
              μπορεί να ολοκληρωθεί.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🛡️ Ασφάλεια</h3>
            <p className="text-gray-700 text-sm">
              Φροντίστε να συνάψετε ασφαλιστήριο συμβόλαιο πριν παραλάβετε το όχημα. Η οδήγηση χωρίς
              ασφάλεια είναι παράνομη και επιφέρει βαριά πρόστιμα.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💰 Τρόπος Πληρωμής</h3>
            <p className="text-gray-700 text-sm">
              Προτιμήστε τραπεζική μεταφορά ή επιταγή αντί μετρητών, ώστε να υπάρχει αποδεικτικό
              συναλλαγής. Κρατήστε αντίγραφο όλων των εγγράφων.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Useful links */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοι Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏛️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">gov.gr</p>
              <p className="text-sm text-gray-600">Ψηφιακές υπηρεσίες Δημοσίου — μεταβίβαση, ΚΤΕΟ, βεβαιώσεις</p>
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
              <p className="text-sm text-gray-600">Τέλη κυκλοφορίας, φόροι, τελωνεία, τέλος ταξινόμησης</p>
            </div>
          </a>
          <a
            href="https://www.gsis.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">💻</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">myCAR / TAXISnet (gsis.gr)</p>
              <p className="text-sm text-gray-600">Πληρωμή τελών κυκλοφορίας, e-Παράβολο, φορολογικές υπηρεσίες</p>
            </div>
          </a>
          <a
            href="https://drivers-vehicles.services.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🚗</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Ψηφιακές Υπηρεσίες Οχημάτων</p>
              <p className="text-sm text-gray-600">Ηλεκτρονική υπηρεσία μεταβίβασης οχημάτων, αίτηση και ραντεβού</p>
            </div>
          </a>
        </div>
      </section>

      {/* Section: Disclaimer */}
      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα και δεν αποτελούν νομική
          συμβουλή. Τα κόστη και οι διαδικασίες μπορεί να αλλάξουν. Για τις πιο ενημερωμένες
          πληροφορίες, απευθυνθείτε στη Διεύθυνση Μεταφορών της Περιφέρειάς σας ή στις επίσημες
          ιστοσελίδες που αναφέρονται παραπάνω.
        </p>
      </section>
    </StaticPageLayout>
  );
}
