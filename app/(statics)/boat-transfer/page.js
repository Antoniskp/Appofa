import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Αγορά & Μεταβίβαση Σκάφους - Απόφαση',
  description: 'Πλήρης οδηγός για την αγορά, πώληση και μεταβίβαση σκάφους αναψυχής στην Ελλάδα. Έγγραφα, κόστη, νηολόγηση, διαδικασία βήμα-βήμα και χρήσιμοι σύνδεσμοι.',
  openGraph: {
    title: 'Αγορά & Μεταβίβαση Σκάφους - Απόφαση',
    description: 'Πλήρης οδηγός για την αγορά, πώληση και μεταβίβαση σκάφους αναψυχής στην Ελλάδα. Έγγραφα, κόστη, νηολόγηση, διαδικασία βήμα-βήμα και χρήσιμοι σύνδεσμοι.',
    url: `${SITE_URL}/boat-transfer`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Αγορά & Μεταβίβαση Σκάφους - Απόφαση',
    description: 'Πλήρης οδηγός για την αγορά, πώληση και μεταβίβαση σκάφους αναψυχής στην Ελλάδα. Έγγραφα, κόστη, νηολόγηση, διαδικασία βήμα-βήμα και χρήσιμοι σύνδεσμοι.',
  },
  alternates: {
    canonical: `${SITE_URL}/boat-transfer`,
  },
};

export default function BoatTransferPage() {
  return (
    <StaticPageLayout title="Αγορά & Μεταβίβαση Σκάφους στην Ελλάδα" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η αγορά ή μεταβίβαση σκάφους αναψυχής στην Ελλάδα περιλαμβάνει συγκεκριμένα βήματα, έγγραφα
          και κόστη. Σε αυτόν τον οδηγό θα βρείτε αναλυτικά τη διαδικασία, τα απαιτούμενα δικαιολογητικά,
          τους φόρους και τα τέλη, καθώς και χρήσιμους συνδέσμους σε επίσημους φορείς.
        </p>
      </section>

      {/* Section: Overview of the process */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Επισκόπηση Διαδικασίας</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Η μεταβίβαση σκάφους αναψυχής γίνεται μέσω της αρμόδιας Λιμενικής Αρχής (Λιμεναρχείου)
            στην οποία είναι νηολογημένο το σκάφος. Η διαδικασία αφορά τόσο αγοραπωλησίες μεταξύ
            ιδιωτών όσο και αγορές από ναυτιλιακούς εμπόρους.
          </p>
          <p className="text-gray-700">
            Για νέα σκάφη η εταιρεία-αντιπρόσωπος αναλαμβάνει συνήθως τη διαδικασία νηολόγησης. Για
            μεταχειρισμένα από το εξωτερικό απαιτείται επιπλέον εκτελωνισμός και πληρωμή φόρων.
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
              Αγοραστής και πωλητής συμφωνούν στην τιμή και συντάσσουν ιδιωτικό συμφωνητικό
              αγοραπωλησίας ή προσέρχονται από κοινού στη Λιμενική Αρχή. Για σκάφη μεγάλης αξίας
              συνίσταται συμβολαιογραφικό έγγραφο.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">2. Έλεγχος Οφειλών & Νηολογίου</h3>
            <p className="text-gray-700 text-sm">
              Πριν τη μεταβίβαση βεβαιωθείτε ότι το σκάφος δεν έχει ανεξόφλητα τέλη ή εμπράγματα
              βάρη (υποθήκες, κατασχέσεις). Ζητήστε πιστοποιητικό από τη Λιμενική Αρχή που τηρεί
              το νηολόγιο.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">3. Πληρωμή Τέλους Μεταβίβασης</h3>
            <p className="text-gray-700 text-sm">
              Πληρωμή του τέλους μεταβίβασης (e-Παράβολο) μέσω{' '}
              <a href="https://www.gsis.gr/e-paravolo" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                e-Παράβολο (gsis.gr)
              </a>. Η πληρωμή μπορεί να γίνει και μέσω τράπεζας ή ΕΛΤΑ.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">4. Επίσκεψη στη Λιμενική Αρχή</h3>
            <p className="text-gray-700 text-sm">
              Και οι δύο πλευρές (ή εξουσιοδοτημένοι εκπρόσωποι με συμβολαιογραφικό πληρεξούσιο)
              προσέρχονται στη Λιμενική Αρχή με τα απαιτούμενα δικαιολογητικά για την ολοκλήρωση
              της μεταβίβασης.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">5. Έκδοση Νέου Εθνικότητας & Νηολογίου</h3>
            <p className="text-gray-700 text-sm">
              Μετά τον έλεγχο των εγγράφων, γίνεται η εγγραφή της μεταβίβασης στο νηολόγιο και
              εκδίδονται τα νέα έγγραφα (Δελτίο Ταυτότητας Σκάφους ή άδεια εκτέλεσης πλόων)
              στο όνομα του νέου ιδιοκτήτη.
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
              <li>Δελτίο Ταυτότητας Σκάφους (ΔΤΣ) ή Εθνικότητα & Νηολόγιο</li>
              <li>Άδεια εκτέλεσης πλόων (αν υπάρχει)</li>
              <li>Πιστοποιητικό μη εμπράγματων βαρών</li>
              <li>ΑΦΜ (Αριθμός Φορολογικού Μητρώου)</li>
              <li>Αποδεικτικό εξόφλησης τελών (αν απαιτείται)</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Από τον Αγοραστή</h3>
            <ul className="text-gray-700 text-sm space-y-2 list-disc list-inside">
              <li>Αστυνομική ταυτότητα ή διαβατήριο</li>
              <li>ΑΦΜ (Αριθμός Φορολογικού Μητρώου)</li>
              <li>Αίτηση μεταβίβασης (παρέχεται στη Λιμενική Αρχή)</li>
              <li>e-Παράβολο πληρωμής τέλους μεταβίβασης</li>
              <li>Ασφαλιστήριο συμβόλαιο σκάφους</li>
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
                <td className="px-4 py-3 text-gray-700">~50–150 €</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Εξαρτάται από το μέγεθος/αξία σκάφους</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Τέλη Λιμενικής Αρχής</td>
                <td className="px-4 py-3 text-gray-700">~30–80 €</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Για έκδοση εγγράφων νηολόγησης</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Ασφάλεια σκάφους (ετήσια)</td>
                <td className="px-4 py-3 text-gray-700">200–2.000+ €/έτος</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Ανάλογα με τύπο, μέγεθος και κάλυψη</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Τέλη ελλιμενισμού (ετήσια)</td>
                <td className="px-4 py-3 text-gray-700">Μεταβλητό</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Εξαρτάται από μαρίνα και μήκος σκάφους</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Εισαγωγή (τελωνείο + φόροι)</td>
                <td className="px-4 py-3 text-gray-700">Μεταβλητό</td>
                <td className="px-4 py-3 text-gray-600 text-xs">ΦΠΑ 24%, δασμοί (εκτός ΕΕ), τέλος ταξινόμησης</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Τέλος ναυαγοσωστικής κάλυψης (ΕΦΣΕΑ)</td>
                <td className="px-4 py-3 text-gray-700">~20–50 €/έτος</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Υποχρεωτικό για σκάφη αναψυχής</td>
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
        <h2 className="text-2xl font-semibold mb-3">Εισαγωγή Σκάφους από το Εξωτερικό</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Αν αγοράζετε σκάφος από χώρα της ΕΕ ή εκτός ΕΕ, η διαδικασία περιλαμβάνει επιπλέον βήματα:
          </p>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Από χώρα ΕΕ</h3>
            <p className="text-gray-700 text-sm">
              Δεν πληρώνονται δασμοί για σκάφη εντός ΕΕ, αλλά καταβάλλεται <strong>ΦΠΑ 24%</strong> (αν
              δεν έχει ήδη αποδοθεί στη χώρα αγοράς). Απαιτείται πιστοποιητικό CE (σήμανση συμμόρφωσης)
              για σκάφη αναψυχής που κατασκευάστηκαν μετά το 1998.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Από χώρα εκτός ΕΕ</h3>
            <p className="text-gray-700 text-sm">
              Πληρώνονται <strong>δασμοί</strong> (συνήθως 1,7% για σκάφη αναψυχής), <strong>ΦΠΑ 24%</strong>{' '}
              και πιθανό <strong>τέλος ταξινόμησης</strong>. Ο εκτελωνισμός γίνεται στο τελωνείο εισόδου.
              Συνιστάται η χρήση εκτελωνιστή.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Σήμανση CE για Σκάφη</h3>
            <p className="text-gray-700 text-sm">
              Τα σκάφη αναψυχής που κατασκευάστηκαν μετά το 1998 και πωλούνται εντός ΕΕ πρέπει να
              φέρουν σήμανση CE. Αν το σκάφος δεν τη φέρει, χρειάζεται αξιολόγηση από εγκεκριμένο
              οργανισμό πριν νηολογηθεί.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Registration types */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Τύποι Νηολόγησης</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Στην Ελλάδα τα σκάφη αναψυχής μπορούν να νηολογηθούν ή να καταχωρηθούν με διαφορετικούς
            τρόπους, ανάλογα με το μέγεθος και τη χρήση τους:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">⚓ Νηολόγιο Σκαφών Αναψυχής</h3>
              <p className="text-gray-700 text-sm">
                Αφορά σκάφη αναψυχής άνω των 7 μέτρων ή με κινητήρα άνω των 15 kW. Η νηολόγηση
                γίνεται στο Λιμεναρχείο και παρέχει ελληνική σημαία. Απαιτεί Δελτίο Ταυτότητας
                Σκάφους (ΔΤΣ).
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Βιβλιάριο Εθνικότητας</h3>
              <p className="text-gray-700 text-sm">
                Για μικρά σκάφη εσωτερικής πλεύσης. Εκδίδεται από τη Λιμενική Αρχή και αποτελεί
                το κύριο έγγραφο ταυτοποίησης του σκάφους και του ιδιοκτήτη.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Tips for buyers */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Συμβουλές για Αγοραστές</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🔍 Έλεγχος Κατάστασης</h3>
            <p className="text-gray-700 text-sm">
              Ζητήστε πλήρη ιστορικό συντήρησης, ελέγξτε τον κινητήρα και τον κύτο από ανεξάρτητο
              ναυπηγό ή μηχανολόγο πριν κλείσετε τη συμφωνία. Ο υποβρύχιος έλεγχος του γάστρου
              είναι ιδιαίτερα σημαντικός.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📑 Έλεγχος Εμπράγματων Βαρών</h3>
            <p className="text-gray-700 text-sm">
              Ζητήστε πιστοποιητικό μη εμπράγματων βαρών από τη Λιμενική Αρχή. Αν υπάρχουν
              υποθήκες ή κατασχέσεις, η μεταβίβαση δεν μπορεί να ολοκληρωθεί.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🛡️ Ασφάλεια Σκάφους</h3>
            <p className="text-gray-700 text-sm">
              Η ασφάλεια αστικής ευθύνης είναι υποχρεωτική για σκάφη με κινητήρα. Φροντίστε να
              ανανεώσετε ή να εκδώσετε νέο ασφαλιστήριο πριν αναλάβετε το σκάφος.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💰 Τρόπος Πληρωμής</h3>
            <p className="text-gray-700 text-sm">
              Προτιμήστε τραπεζική μεταφορά αντί μετρητών, ώστε να υπάρχει αποδεικτικό συναλλαγής.
              Κρατήστε αντίγραφο όλων των εγγράφων — ιδιωτικού συμφωνητικού, αποδείξεων και
              πιστοποιητικών.
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
              <p className="text-sm text-gray-600">Ψηφιακές υπηρεσίες Δημοσίου — άδειες σκαφών, βεβαιώσεις</p>
            </div>
          </a>
          <a
            href="https://www.hcg.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">⚓</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Ελληνική Ακτοφυλακή (hcg.gr)</p>
              <p className="text-sm text-gray-600">Λιμενικό Σώμα — νηολόγηση, έγγραφα σκαφών, κανονισμοί</p>
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
              <p className="text-sm text-gray-600">Φόροι, τελωνεία, εκτελωνισμός εισαγόμενων σκαφών</p>
            </div>
          </a>
          <a
            href="https://www.gsis.gr/e-paravolo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">💻</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">e-Παράβολο (gsis.gr)</p>
              <p className="text-sm text-gray-600">Πληρωμή τελών μεταβίβασης και λοιπών διοικητικών τελών</p>
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
          πληροφορίες, απευθυνθείτε στο αρμόδιο Λιμεναρχείο της περιοχής σας ή στις επίσημες
          ιστοσελίδες που αναφέρονται παραπάνω.
        </p>
      </section>
    </StaticPageLayout>
  );
}
