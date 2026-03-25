import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Αγορά & Μεταβίβαση Σκάφους - Απόφαση',
  description: 'Πλήρης οδηγός για την αγορά, πώληση, μεταβίβαση και κατοχή σκάφους στην Ελλάδα. Έγγραφα, κόστη, φόροι, άδειες και χρήσιμοι σύνδεσμοι.',
  openGraph: {
    title: 'Αγορά & Μεταβίβαση Σκάφους - Απόφαση',
    description: 'Πλήρης οδηγός για την αγορά, πώληση, μεταβίβαση και κατοχή σκάφους στην Ελλάδα. Έγγραφα, κόστη, φόροι, άδειες και χρήσιμοι σύνδεσμοι.',
    url: `${SITE_URL}/boat-transfer`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Αγορά & Μεταβίβαση Σκάφους - Απόφαση',
    description: 'Πλήρης οδηγός για την αγορά, πώληση, μεταβίβαση και κατοχή σκάφους στην Ελλάδα. Έγγραφα, κόστη, φόροι, άδειες και χρήσιμοι σύνδεσμοι.',
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
          Η αγορά, μεταβίβαση και κατοχή σκάφους στην Ελλάδα περιλαμβάνει συγκεκριμένες διαδικασίες,
          έγγραφα και κόστη. Σε αυτόν τον οδηγό θα βρείτε αναλυτικά τη διαδικασία αγοράς και μεταβίβασης,
          τα απαιτούμενα δικαιολογητικά, τους φόρους και τέλη, τις άδειες, καθώς και χρήσιμους συνδέσμους
          σε επίσημους φορείς.
        </p>
      </section>

      {/* Section: Overview of the process */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Επισκόπηση Διαδικασίας</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Η αγοραπωλησία και μεταβίβαση σκάφους στην Ελλάδα γίνεται μέσω του αρμόδιου Λιμεναρχείου
            (ή Λιμενικής Αρχής) στο οποίο είναι νηολογημένο ή εγγεγραμμένο το σκάφος. Τα σκάφη
            χωρίζονται σε δύο βασικές κατηγορίες:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">⛵ Επαγγελματικά Σκάφη</h3>
              <p className="text-gray-700 text-sm">
                Νηολογούνται στο Νηολόγιο (Λιμεναρχείο) και υπόκεινται σε αυστηρότερους κανονισμούς
                ασφαλείας, επιθεωρήσεις και πιστοποιήσεις.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">🚤 Ιδιωτικά / Ερασιτεχνικά</h3>
              <p className="text-gray-700 text-sm">
                Εγγράφονται στα Βιβλία Εγγραφής Μικρών Σκαφών (ΒΕΜΣ) ή στο Νηολόγιο, ανάλογα με
                το μήκος. Η διαδικασία είναι πιο απλή για μικρά σκάφη (κάτω των 7 μέτρων).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Step-by-step transfer guide */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Βήματα Μεταβίβασης Σκάφους</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">1. Συμφωνία Αγοραπωλησίας</h3>
            <p className="text-gray-700 text-sm">
              Αγοραστής και πωλητής συμφωνούν στην τιμή και συντάσσουν ιδιωτικό συμφωνητικό ή
              συμβολαιογραφική πράξη (για νηολογημένα σκάφη απαιτείται συμβολαιογραφικό έγγραφο
              μεταβίβασης).
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">2. Έλεγχος Βαρών & Οφειλών</h3>
            <p className="text-gray-700 text-sm">
              Ελέγξτε αν υπάρχουν βάρη (υποθήκες, κατασχέσεις) στο σκάφος μέσω του Νηολογίου.
              Βεβαιωθείτε ότι δεν υπάρχουν ανεξόφλητα τέλη ελλιμενισμού ή άλλες οφειλές.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">3. Πληρωμή Φόρου Μεταβίβασης</h3>
            <p className="text-gray-700 text-sm">
              Για σκάφη αναψυχής άνω των 5 μέτρων απαιτείται πληρωμή φόρου πολυτελούς διαβίωσης ή
              φόρου μεταβίβασης (ανάλογα με την κατηγορία). Η πληρωμή γίνεται μέσω{' '}
              <a href="https://www.aade.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                ΑΑΔΕ
              </a>.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">4. Κατάθεση στο Λιμεναρχείο</h3>
            <p className="text-gray-700 text-sm">
              Κατάθεση των δικαιολογητικών στο αρμόδιο Λιμεναρχείο (ή Υπουργείο Ναυτιλίας για
              νηολογημένα σκάφη). Γίνεται η μεταγραφή ιδιοκτησίας στα σχετικά βιβλία.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">5. Έκδοση Νέας Άδειας</h3>
            <p className="text-gray-700 text-sm">
              Εκδίδεται νέο Έγγραφο Εθνικότητας ή νέα Άδεια Εκτέλεσης Πλόων στο όνομα του νέου
              ιδιοκτήτη.
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
              <li>Έγγραφο Εθνικότητας ή Άδεια Εκτέλεσης Πλόων</li>
              <li>Πιστοποιητικό καταμέτρησης (για νηολογημένα σκάφη)</li>
              <li>Βεβαίωση μη οφειλής τελών ελλιμενισμού</li>
              <li>ΑΦΜ (Αριθμός Φορολογικού Μητρώου)</li>
              <li>Πιστοποιητικό βαρών (από Νηολόγιο)</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Από τον Αγοραστή</h3>
            <ul className="text-gray-700 text-sm space-y-2 list-disc list-inside">
              <li>Αστυνομική ταυτότητα ή διαβατήριο</li>
              <li>ΑΦΜ (Αριθμός Φορολογικού Μητρώου)</li>
              <li>Αίτηση μεταβίβασης (στο Λιμεναρχείο)</li>
              <li>Δίπλωμα χειριστή (αν απαιτείται για την κατηγορία σκάφους)</li>
              <li>Ασφαλιστήριο συμβόλαιο σκάφους</li>
              <li>Συμβολαιογραφική πράξη μεταβίβασης (για νηολογημένα)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section: Licenses */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Άδειες Χειριστή Σκάφους</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Για τον χειρισμό σκάφους αναψυχής στην Ελλάδα απαιτείται άδεια (δίπλωμα), ανάλογα
            με την κατηγορία του σκάφους:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">🎓 Κατηγορίες Διπλωμάτων</h3>
              <ul className="text-gray-700 text-sm space-y-2 list-disc list-inside">
                <li>Μικρά σκάφη (έως 7μ.) — δεν απαιτείται δίπλωμα για μηχανές έως 10 HP</li>
                <li>Ερασιτεχνικό δίπλωμα — για σκάφη με μηχανή άνω των 10 HP</li>
                <li>Επαγγελματικό δίπλωμα — για επαγγελματική χρήση (Κυβερνήτης Α΄, Β΄)</li>
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">📝 Διαδικασία Απόκτησης</h3>
              <ul className="text-gray-700 text-sm space-y-2 list-disc list-inside">
                <li>Αίτηση στο Λιμεναρχείο</li>
                <li>Εξετάσεις (θεωρητικό & πρακτικό μέρος)</li>
                <li>Ιατρικό πιστοποιητικό</li>
                <li>Παράβολο εξέτασης (~30–50 €)</li>
              </ul>
            </div>
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
                <td className="px-4 py-3 text-gray-700">Φόρος μεταβίβασης</td>
                <td className="px-4 py-3 text-gray-700">Μεταβλητό</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Εξαρτάται από αξία & κατηγορία σκάφους</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Τέλη Νηολόγησης / Εγγραφής</td>
                <td className="px-4 py-3 text-gray-700">50–300 €</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Ανάλογα με τον τύπο και μήκος σκάφους</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Ασφάλεια σκάφους</td>
                <td className="px-4 py-3 text-gray-700">200–2.000+ €/έτος</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Υποχρεωτική αστική ευθύνη + προαιρετική κάλυψη</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Τέλη ελλιμενισμού (ετήσια)</td>
                <td className="px-4 py-3 text-gray-700">500–5.000+ €/έτος</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Ανάλογα με μήκος σκάφους και μαρίνα</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Φόρος πολυτελούς διαβίωσης (ΤΕΠΔ)</td>
                <td className="px-4 py-3 text-gray-700">Μεταβλητό</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Για σκάφη αναψυχής άνω των 5μ. — βάσει μήκους</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Εισαγωγή (τελωνείο + φόροι)</td>
                <td className="px-4 py-3 text-gray-700">Μεταβλητό</td>
                <td className="px-4 py-3 text-gray-600 text-xs">ΦΠΑ 24%, δασμοί (εκτός ΕΕ), τέλος ταξινόμησης</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Συμβολαιογραφικά έξοδα</td>
                <td className="px-4 py-3 text-gray-700">200–1.000+ €</td>
                <td className="px-4 py-3 text-gray-600 text-xs">Για νηολογημένα σκάφη (ανάλογα με αξία)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          * Τα ποσά είναι ενδεικτικά και μπορεί να αλλάξουν. Ελέγχετε πάντα στις επίσημες πηγές.
        </p>
      </section>

      {/* Section: Luxury living tax */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Τέλος Πλοίων Αναψυχής & Φόρος Πολυτελούς Διαβίωσης</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Ο ιδιοκτήτης σκάφους αναψυχής μήκους άνω των 5 μέτρων υποχρεούται να καταβάλλει ετήσιο
            Τέλος Πλοίων Αναψυχής και Ημερόπλοιων (ΤΕΠΑΗ), καθώς και τον Φόρο Πολυτελούς Διαβίωσης
            (μέσω της ετήσιας φορολογικής δήλωσης).
          </p>
          <p className="text-gray-700">
            Το ΤΕΠΑΗ υπολογίζεται βάσει του ολικού μήκους του σκάφους και καταβάλλεται ηλεκτρονικά
            μέσω{' '}
            <a href="https://www.aade.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              ΑΑΔΕ
            </a>. Η μη πληρωμή μπορεί να οδηγήσει σε απαγόρευση απόπλου.
          </p>
        </div>
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
              Δεν πληρώνονται δασμοί, αλλά καταβάλλεται <strong>ΦΠΑ 24%</strong> (αν δεν έχει ήδη
              καταβληθεί). Απαιτείται πιστοποιητικό CE (για σκάφη κατασκευασμένα μετά το 1998)
              και εγγραφή στο ελληνικό Νηολόγιο ή ΒΕΜΣ.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Από χώρα εκτός ΕΕ</h3>
            <p className="text-gray-700 text-sm">
              Πληρώνονται <strong>δασμοί</strong> (συνήθως 1,7% για σκάφη αναψυχής), <strong>ΦΠΑ 24%</strong>{' '}
              και ενδεχομένως τέλη εκτελωνισμού. Ο εκτελωνισμός γίνεται στο τελωνείο εισόδου. Συνιστάται
              η χρήση εκτελωνιστή.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Σημαία & Νηολόγηση</h3>
            <p className="text-gray-700 text-sm">
              Μετά τον εκτελωνισμό, το σκάφος πρέπει να νηολογηθεί ή να εγγραφεί στα ΒΕΜΣ και να λάβει
              ελληνική σημαία. Απαιτείται επιθεώρηση από το Λιμεναρχείο.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Safety equipment & inspections */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Εξοπλισμός Ασφαλείας & Επιθεωρήσεις</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Κάθε σκάφος πρέπει να φέρει τον υποχρεωτικό εξοπλισμό ασφαλείας σύμφωνα με τον
            Γενικό Κανονισμό Λιμένα (ΓΚΛ). Ο εξοπλισμός εξαρτάται από την κατηγορία πλόων:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">🦺 Βασικός Εξοπλισμός</h3>
              <ul className="text-gray-700 text-sm space-y-2 list-disc list-inside">
                <li>Σωσίβια (ένα ανά επιβάτη)</li>
                <li>Σωσίβιο κυκλικό (ring buoy)</li>
                <li>Πυροσβεστήρας/ες</li>
                <li>Φωτοβολίδες κινδύνου</li>
                <li>Κόρνα ή σφυρίχτρα</li>
                <li>Φαρμακείο πρώτων βοηθειών</li>
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-indigo-700">🔍 Επιθεωρήσεις</h3>
              <ul className="text-gray-700 text-sm space-y-2 list-disc list-inside">
                <li>Αρχική επιθεώρηση κατά τη νηολόγηση / εγγραφή</li>
                <li>Περιοδική επιθεώρηση (κάθε 2–5 χρόνια, ανάλογα με κατηγορία)</li>
                <li>Έκτακτη επιθεώρηση μετά από ατύχημα ή μετασκευή</li>
                <li>Έλεγχος εξοπλισμού πριν τον απόπλου (από Λιμενικό)</li>
              </ul>
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
              Πριν αγοράσετε μεταχειρισμένο σκάφος, ζητήστε θαλάσσια επιθεώρηση (marine survey)
              από πιστοποιημένο επιθεωρητή. Ελέγξτε γάστρα, κινητήρα, ηλεκτρολογική εγκατάσταση
              και εξοπλισμό ασφαλείας.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📑 Έλεγχος Εγγράφων</h3>
            <p className="text-gray-700 text-sm">
              Ζητήστε πιστοποιητικό βαρών (ελεύθερο υποθηκών), βεβαίωση μη οφειλής τελών
              ελλιμενισμού και ελέγξτε αν τα στοιχεία του σκάφους ταιριάζουν με τα έγγραφα.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🛡️ Ασφάλεια</h3>
            <p className="text-gray-700 text-sm">
              Η ασφάλιση αστικής ευθύνης είναι υποχρεωτική. Εξετάστε επιπλέον κάλυψη για ζημιές
              σκάφους, κλοπή, ρυμούλκηση και φυσικές καταστροφές.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💰 Κρυφά Κόστη</h3>
            <p className="text-gray-700 text-sm">
              Υπολογίστε εκτός από την αγορά: ελλιμενισμό, συντήρηση, καύσιμα, ασφάλεια, φόρους
              και ετήσια τέλη. Το κόστος κατοχής μπορεί να αντιστοιχεί στο 10–15% της αξίας
              του σκάφους ετησίως.
            </p>
          </div>
        </div>
      </section>

      {/* Section: Useful links */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοι Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.ynanp.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">⚓</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Υπουργείο Ναυτιλίας (ynanp.gr)</p>
              <p className="text-sm text-gray-600">Νηολόγηση, άδειες, κανονισμοί σκαφών αναψυχής</p>
            </div>
          </a>
          <a
            href="https://www.hcg.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🚢</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Λιμενικό Σώμα (hcg.gr)</p>
              <p className="text-sm text-gray-600">Ασφάλεια ναυσιπλοΐας, επιθεωρήσεις, Λιμεναρχεία</p>
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
              <p className="text-sm text-gray-600">Φόροι, τέλη πλοίων αναψυχής, εκτελωνισμός</p>
            </div>
          </a>
          <a
            href="https://www.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏛️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">gov.gr</p>
              <p className="text-sm text-gray-600">Ψηφιακές υπηρεσίες — άδειες σκαφών, πιστοποιητικά</p>
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
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">TAXISnet (gsis.gr)</p>
              <p className="text-sm text-gray-600">Πληρωμή φόρων, e-Παράβολο, δήλωση φόρου πολυτελούς διαβίωσης</p>
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
          πληροφορίες, απευθυνθείτε στο αρμόδιο Λιμεναρχείο ή στις επίσημες ιστοσελίδες που
          αναφέρονται παραπάνω.
        </p>
      </section>
    </StaticPageLayout>
  );
}
