import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Αγορά & Μεταβίβαση Ακινήτου - Απόφαση',
  description: 'Πλήρης οδηγός για την αγορά, πώληση και μεταβίβαση ακινήτου (γης, κατοικίας, κτιρίου) στην Ελλάδα. Έγγραφα, κόστη, φόροι, συμβολαιογράφος, Κτηματολόγιο και χρήσιμοι σύνδεσμοι.',
  openGraph: {
    title: 'Αγορά & Μεταβίβαση Ακινήτου - Απόφαση',
    description: 'Πλήρης οδηγός για την αγορά, πώληση και μεταβίβαση ακινήτου (γης, κατοικίας, κτιρίου) στην Ελλάδα. Έγγραφα, κόστη, φόροι, συμβολαιογράφος, Κτηματολόγιο και χρήσιμοι σύνδεσμοι.',
    url: `${SITE_URL}/property-transfer`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Αγορά & Μεταβίβαση Ακινήτου - Απόφαση',
    description: 'Πλήρης οδηγός για την αγορά, πώληση και μεταβίβαση ακινήτου (γης, κατοικίας, κτιρίου) στην Ελλάδα. Έγγραφα, κόστη, φόροι, συμβολαιογράφος, Κτηματολόγιο και χρήσιμοι σύνδεσμοι.',
  },
  alternates: {
    canonical: `${SITE_URL}/property-transfer`,
  },
};

export default function PropertyTransferPage() {
  return (
    <StaticPageLayout
      title="Αγορά & Μεταβίβαση Ακινήτου στην Ελλάδα"
      maxWidth="max-w-4xl"
      breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}
    >
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η αγορά ή μεταβίβαση ακινήτου (γης, κατοικίας ή επαγγελματικού κτιρίου) στην Ελλάδα
          περιλαμβάνει συγκεκριμένα βήματα, έγγραφα και κόστη. Σε αυτόν τον οδηγό θα βρείτε
          αναλυτικά τη διαδικασία, τα απαιτούμενα δικαιολογητικά, τους φόρους και τα τέλη,
          καθώς και χρήσιμους συνδέσμους σε επίσημους φορείς.
        </p>
      </section>

      {/* Section: Overview of the process */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Επισκόπηση Διαδικασίας</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Κάθε μεταβίβαση ακινήτου στην Ελλάδα πραγματοποιείται υποχρεωτικά με συμβολαιογραφικό
            έγγραφο ενώπιον αδειούχου συμβολαιογράφου. Το συμβόλαιο καταχωρίζεται στο Κτηματολόγιο
            (ή στο Υποθηκοφυλακείο όπου δεν έχει ολοκληρωθεί η κτηματογράφηση).
          </p>
          <p className="text-gray-700">
            Η διαδικασία αφορά τόσο αγοραπωλησίες μεταξύ ιδιωτών όσο και αγορές από κατασκευαστές
            (νεόδμητα). Για νεόδμητα ακίνητα με οικοδομική άδεια μετά την 1η Ιανουαρίου 2006
            εφαρμόζεται ΦΠΑ αντί του φόρου μεταβίβασης.
          </p>
        </div>
      </section>

      {/* Section: Step-by-step guide */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Βήματα Αγοραπωλησίας Ακινήτου</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">1. Εύρεση & Συμφωνία</h3>
            <p className="text-gray-700 text-sm">
              Αγοραστής και πωλητής συμφωνούν στην τιμή και στους όρους πώλησης. Συνίσταται νομικός
              έλεγχος του τίτλου ιδιοκτησίας από δικηγόρο ή συμβολαιογράφο πριν από οποιαδήποτε
              προκαταβολή.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">2. Νομικός Έλεγχος Τίτλων</h3>
            <p className="text-gray-700 text-sm">
              Ο συμβολαιογράφος ή δικηγόρος ελέγχει τους τίτλους ιδιοκτησίας στο Κτηματολόγιο ή
              Υποθηκοφυλακείο για εμπράγματα βάρη (υποθήκες, κατασχέσεις, δουλείες), αγωγές και
              λοιπές επιβαρύνσεις.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">3. Φορολογικός Έλεγχος & Πιστοποιητικά</h3>
            <p className="text-gray-700 text-sm">
              Ο πωλητής προσκομίζει πιστοποιητικό ΕΝΦΙΑ τρέχοντος έτους και βεβαίωση μη οφειλής
              από την{' '}
              <a href="https://www.aade.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                ΑΑΔΕ
              </a>. Ελέγχεται επίσης η ύπαρξη τυχόν κατασχέσεων από την Εφορία.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">4. Πληρωμή Φόρου Μεταβίβασης (ΦΜΑ)</h3>
            <p className="text-gray-700 text-sm">
              Πριν από την υπογραφή του συμβολαίου υποβάλλεται δήλωση ΦΜΑ στην αρμόδια ΔΟΥ και
              καταβάλλεται ο φόρος μεταβίβασης (3% επί της φορολογητέας αξίας). Για νεόδμητα με
              ΦΠΑ ο φόρος είναι 24%.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">5. Υπογραφή Συμβολαίου</h3>
            <p className="text-gray-700 text-sm">
              Αγοραστής και πωλητής παρευρίσκονται ενώπιον συμβολαιογράφου για την υπογραφή του
              αγοραπωλητηρίου συμβολαίου. Απαιτείται η παρουσία και των δύο μερών ή νόμιμων
              εκπροσώπων τους (με συμβολαιογραφικό πληρεξούσιο).
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">6. Μεταγραφή στο Κτηματολόγιο</h3>
            <p className="text-gray-700 text-sm">
              Μετά την υπογραφή, το συμβόλαιο μεταγράφεται στο αρμόδιο Κτηματολόγιο ή
              Υποθηκοφυλακείο. Η μεταγραφή ολοκληρώνει τη νομική μεταβίβαση της κυριότητας και
              προστατεύει τον αγοραστή έναντι τρίτων.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Required Documents */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Απαιτούμενα Δικαιολογητικά</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>📄</span> Από τον Πωλητή
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Αστυνομική ταυτότητα ή διαβατήριο
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Τίτλος ιδιοκτησίας (συμβόλαιο κτήσης)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Πιστοποιητικό ΕΝΦΙΑ τρέχοντος έτους
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Βεβαίωση μη οφειλής (ΑΑΔΕ)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Τοπογραφικό διάγραμμα (για γη ή οικόπεδο)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Πιστοποιητικό Ενεργειακής Απόδοσης (ΠΕΑ) για κτίσμα
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Βεβαίωση μηχανικού περί μη αυθαιρεσίας
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Άδεια δόμησης / οικοδομική άδεια (για κτίριο)
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>📋</span> Από τον Αγοραστή
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Αστυνομική ταυτότητα ή διαβατήριο
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                ΑΦΜ (αριθμός φορολογικού μητρώου)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Βεβαίωση μη οφειλής (ΑΑΔΕ) — εφόσον ζητηθεί
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Αποδεικτικό τραπεζικής κατάθεσης (για νόμιμη διαδρομή χρήματος)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                Πληρεξούσιο (αν εκπροσωπείται από τρίτον)
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section: Costs & Taxes */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Κόστη, Τέλη & Φόροι</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-indigo-50">
                <th className="border border-gray-200 px-4 py-2 font-semibold text-gray-800">Κόστος</th>
                <th className="border border-gray-200 px-4 py-2 font-semibold text-gray-800">Ποσό / Ποσοστό</th>
                <th className="border border-gray-200 px-4 py-2 font-semibold text-gray-800">Βαρύνει</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Φόρος Μεταβίβασης Ακινήτου (ΦΜΑ)</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">3% επί φορολογητέας αξίας</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Αγοραστής</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 text-gray-700">ΦΠΑ (νεόδμητα)</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">24% (αντί ΦΜΑ)</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Αγοραστής</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Αμοιβή Συμβολαιογράφου</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">~1–2% αξίας ακινήτου</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Αγοραστής</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Αμοιβή Δικηγόρου (αγοραστή)</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">~0,5–1% αξίας ακινήτου</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Αγοραστής</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Τέλη Κτηματολογίου / Μεταγραφής</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">~0,5% αξίας ακινήτου</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Αγοραστής</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 text-gray-700">ΕΝΦΙΑ (ετήσιος)</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Μεταβλητό (βάσει ΑΑΔΕ)</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Κάτοχος</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Αμοιβή Μεσίτη</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">~2% (+ ΦΠΑ 24%) ανά πλευρά</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Αμφότεροι</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Πιστοποιητικό Ενεργειακής Απόδοσης (ΠΕΑ)</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">150–400 €</td>
                <td className="border border-gray-200 px-4 py-2 text-gray-700">Πωλητής</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section: Types of property */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Είδη Ακινήτων</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>🏠</span> Κατοικία
            </h3>
            <p className="text-sm text-gray-700">
              Μονοκατοικίες, διαμερίσματα, μεζονέτες και εξοχικές κατοικίες. Απαιτείται ΠΕΑ,
              βεβαίωση μηχανικού και — για νεόδμητα — οικοδομική άδεια.
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>🌿</span> Γη / Οικόπεδο
            </h3>
            <p className="text-sm text-gray-700">
              Αγροτεμάχια, οικόπεδα εντός ή εκτός σχεδίου. Απαιτείται τοπογραφικό διάγραμμα,
              έλεγχος αρτιότητας και οικοδομησιμότητας καθώς και δασικός χάρτης (αν χρειάζεται).
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span>🏢</span> Επαγγελματικό Κτίριο
            </h3>
            <p className="text-sm text-gray-700">
              Γραφεία, καταστήματα, αποθήκες και βιομηχανικοί χώροι. Ελέγχεται η χρήση γης,
              η άδεια λειτουργίας (αν υπάρχει) και τυχόν περιβαλλοντικές υποχρεώσεις.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Land Registry (Κτηματολόγιο) */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Κτηματολόγιο & Υποθηκοφυλακείο</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Το Εθνικό Κτηματολόγιο είναι το κεντρικό μητρώο ακινήτων της χώρας. Η μεταγραφή του
            συμβολαίου στο Κτηματολόγιο είναι υποχρεωτική για να αναγνωριστεί νόμιμα η νέα
            ιδιοκτησία. Σε περιοχές που δεν έχουν κτηματογραφηθεί ακόμα, η μεταγραφή γίνεται στο
            αρμόδιο Υποθηκοφυλακείο.
          </p>
          <p className="text-gray-700">
            Πριν την αγορά είναι σημαντικό να ελεγχθεί το κτηματολογικό απόσπασμα για ορθότητα
            στοιχείων και απουσία βαρών. Τυχόν σφάλματα στο Κτηματολόγιο διορθώνονται μέσω
            αίτησης διόρθωσης.
          </p>
        </div>
      </section>

      {/* Section: Tips for buyers */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Συμβουλές για Αγοραστές</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
              <span>🔍</span> Έλεγχος Τίτλων
            </h3>
            <p className="text-sm text-gray-700">
              Πάντα να ελέγχετε τους τίτλους ιδιοκτησίας τουλάχιστον 20 χρόνια πίσω για να
              εντοπίσετε πιθανές αμφισβητήσεις ή ελαττώματα κυριότητας.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
              <span>🏗️</span> Αυθαίρετα
            </h3>
            <p className="text-sm text-gray-700">
              Ζητήστε βεβαίωση μηχανικού ότι δεν υπάρχουν αυθαίρετα ή ότι τυχόν αυθαίρετα
              έχουν τακτοποιηθεί νόμιμα, καθώς αυτό επηρεάζει τη μεταβίβαση.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
              <span>💰</span> Τρόπος Πληρωμής
            </h3>
            <p className="text-sm text-gray-700">
              Η καταβολή τιμήματος άνω των 500 € υποχρεωτικά γίνεται μέσω τράπεζας (εμβάσματος
              ή επιταγής) για φορολογικούς λόγους και ασφάλεια συναλλαγής.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
              <span>📑</span> Προσύμφωνο
            </h3>
            <p className="text-sm text-gray-700">
              Για σοβαρές αγορές συνίσταται η υπογραφή συμβολαιογραφικού προσυμφώνου πριν από
              το οριστικό συμβόλαιο, για να δεσμευτούν αμφότερα τα μέρη με σαφείς όρους.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Useful Links */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοι Σύνδεσμοι</h2>
        <ul className="space-y-3 text-sm">
          <li>
            <a
              href="https://www.gov.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              🏛️ gov.gr — Κυβερνητική Πύλη Υπηρεσιών
            </a>
            <p className="text-gray-600 mt-0.5">Κεντρική πύλη για ψηφιακές κυβερνητικές υπηρεσίες.</p>
          </li>
          <li>
            <a
              href="https://www.aade.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              💼 ΑΑΔΕ — Ανεξάρτητη Αρχή Δημοσίων Εσόδων
            </a>
            <p className="text-gray-600 mt-0.5">Πιστοποιητικό ΕΝΦΙΑ, βεβαιώσεις φορολογικής ενημερότητας και δήλωση ΦΜΑ.</p>
          </li>
          <li>
            <a
              href="https://www.ktimatologio.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              🗺️ Εθνικό Κτηματολόγιο
            </a>
            <p className="text-gray-600 mt-0.5">Αποσπάσματα κτηματολογικών στοιχείων, αίτηση εγγραφής και διόρθωσης.</p>
          </li>
          <li>
            <a
              href="https://www.notaries.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              📜 Συντονιστικό Συμβούλιο Συμβολαιογραφικών Συλλόγων
            </a>
            <p className="text-gray-600 mt-0.5">Εύρεση συμβολαιογράφου, πληροφορίες για συμβολαιογραφικές αμοιβές.</p>
          </li>
          <li>
            <a
              href="https://energia.gov.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              ⚡ Πιστοποιητικό Ενεργειακής Απόδοσης (ΠΕΑ)
            </a>
            <p className="text-gray-600 mt-0.5">Πληροφορίες για το ΠΕΑ, υποχρεωτικό κατά τη μεταβίβαση κτισμάτων.</p>
          </li>
          <li>
            <a
              href="https://www.e-poleodomia.gr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              🏗️ e-Πολεοδομία — Ψηφιακές Πολεοδομικές Υπηρεσίες
            </a>
            <p className="text-gray-600 mt-0.5">Ψηφιακή έκδοση βεβαιώσεων και πολεοδομικών εγγράφων για ακίνητα.</p>
          </li>
        </ul>
      </section>

      {/* Section: Disclaimer */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Σημαντική Σημείωση</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900 leading-relaxed">
            Οι πληροφορίες αυτής της σελίδας παρέχονται για ενημερωτικούς σκοπούς και βασίζονται
            στην ισχύουσα ελληνική νομοθεσία κατά την τελευταία ενημέρωση. Δεν αποτελούν νομική
            ή φορολογική συμβουλή. Για οποιαδήποτε συναλλαγή ακινήτου συνιστάται η συνεργασία
            με αδειούχο συμβολαιογράφο, δικηγόρο και φορολογικό σύμβουλο.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
}
