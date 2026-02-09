import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata = {
  title: 'Οδηγίες Χρήσης - Απόφαση',
  description: 'Ολοκληρωμένος οδηγός χρήσης της πλατφόρμας Απόφαση: Δημιουργία άρθρων, ψηφοφορίες, ρόλοι χρηστών και περισσότερα',
};

export default function InstructionsPage() {
  return (
    <StaticPageLayout title="Οδηγίες Χρήσης">
      {/* Section 1: Introduction */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Καλώς ήρθατε στην Απόφαση</h2>
        <p className="text-gray-700 mb-4">
          Η πλατφόρμα Απόφαση είναι μια ολοκληρωμένη πλατφόρμα ειδήσεων και περιεχομένου που σας επιτρέπει να δημιουργείτε 
          και να μοιράζεστε άρθρα, ειδήσεις, και ψηφοφορίες με την κοινότητα. Αυτός ο οδηγός θα σας βοηθήσει να κατανοήσετε 
          πώς να χρησιμοποιείτε όλες τις λειτουργίες της πλατφόρμας.
        </p>
      </section>

      {/* Section 2: Application Features Overview */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Λειτουργίες της Εφαρμογής</h2>
          <p className="text-gray-700 mb-4">
            Η πλατφόρμα Απόφαση προσφέρει μια πλούσια συλλογή λειτουργιών για τη δημιουργία και διαχείριση περιεχομένου:
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 p-5 rounded-r-lg">
            <h3 className="text-xl font-semibold text-blue-900 mb-3">📰 Σύστημα Άρθρων</h3>
            <p className="text-gray-700 mb-3">
              Δημιουργήστε τρεις διαφορετικούς τύπους περιεχομένου:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><span className="font-semibold">Personal (Προσωπικά):</span> Προσωπικά άρθρα και αναρτήσεις</li>
              <li><span className="font-semibold">Articles (Άρθρα):</span> Αναλυτικά άρθρα και περιεχόμενο</li>
              <li><span className="font-semibold">News (Ειδήσεις):</span> Ειδησεογραφικό περιεχόμενο που απαιτεί έγκριση</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Κάθε άρθρο υποστηρίζει πλούσιο περιεχόμενο με εικόνες, βίντεο, κατηγορίες, ετικέτες, και γεωγραφική τοποθεσία.
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-600 p-5 rounded-r-lg">
            <h3 className="text-xl font-semibold text-green-900 mb-3">📊 Σύστημα Ψηφοφοριών</h3>
            <p className="text-gray-700 mb-3">
              Δημιουργήστε και συμμετέχετε σε ψηφοφορίες με προηγμένες δυνατότητες:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><span className="font-semibold">Απλές ψηφοφορίες:</span> Κείμενο με επιλογές</li>
              <li><span className="font-semibold">Σύνθετες ψηφοφορίες:</span> Επιλογές με φωτογραφίες και συνδέσμους</li>
              <li><span className="font-semibold">Οπτικοποίηση αποτελεσμάτων:</span> Γραφήματα (Bar, Pie, Doughnut)</li>
              <li><span className="font-semibold">Ευέλικτες ρυθμίσεις:</span> Δημόσιες/ιδιωτικές, με συνεισφορές χρηστών</li>
              <li><span className="font-semibold">Αλλαγή ψήφου:</span> Δυνατότητα αλλαγής της ψήφου σας</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-600 p-5 rounded-r-lg">
            <h3 className="text-xl font-semibold text-purple-900 mb-3">📍 Σύστημα Τοποθεσιών</h3>
            <p className="text-gray-700 mb-3">
              Οργανώστε το περιεχόμενο βάσει γεωγραφικής θέσης:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><span className="font-semibold">Ιεραρχική δομή:</span> Χώρες → Περιφέρειες → Πόλεις</li>
              <li><span className="font-semibold">Ετικετοποίηση άρθρων:</span> Συνδέστε άρθρα με συγκεκριμένες τοποθεσίες</li>
              <li><span className="font-semibold">Περιήγηση ανά τοποθεσία:</span> Βρείτε περιεχόμενο από συγκεκριμένες περιοχές</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-600 p-5 rounded-r-lg">
            <h3 className="text-xl font-semibold text-orange-900 mb-3">🔐 Σύστημα Ταυτοποίησης</h3>
            <p className="text-gray-700 mb-3">
              Πολλαπλοί τρόποι σύνδεσης για την ευκολία σας:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><span className="font-semibold">Παραδοσιακή σύνδεση:</span> Με όνομα χρήστη και κωδικό πρόσβασης</li>
              <li><span className="font-semibold">GitHub OAuth:</span> Γρήγορη εγγραφή/σύνδεση με το λογαριασμό GitHub σας</li>
              <li><span className="font-semibold">Σύνδεση λογαριασμών:</span> Συνδέστε το GitHub με υπάρχοντα λογαριασμό</li>
              <li><span className="font-semibold">Αυτόματη συμπλήρωση προφίλ:</span> Πληροφορίες από το GitHub</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3: User Roles */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Ρόλοι Χρηστών</h2>
          <p className="text-gray-700 mb-4">
            Η πλατφόρμα Απόφαση χρησιμοποιεί ένα σύστημα ρόλων για τη διαχείριση δικαιωμάτων και πρόσβασης. 
            Κάθε χρήστης έχει συγκεκριμένες δυνατότητες ανάλογα με το ρόλο του:
          </p>
        </div>

        <div className="space-y-5">
          {/* Admin Role */}
          <div className="border-2 border-red-300 rounded-lg p-5 bg-red-50">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">👑</span>
              <h3 className="text-xl font-bold text-red-900">Admin (Διαχειριστής)</h3>
            </div>
            <p className="text-gray-700 mb-3 font-semibold">Πλήρης πρόσβαση σε όλες τις λειτουργίες της πλατφόρμας.</p>
            <div className="bg-white rounded p-4">
              <p className="font-semibold text-gray-800 mb-2">Δικαιώματα:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                <li>Δημιουργία, επεξεργασία και διαγραφή όλων των άρθρων (συμπεριλαμβανομένων άλλων χρηστών)</li>
                <li>Έγκριση ή απόρριψη ειδησεογραφικού περιεχομένου</li>
                <li>Διαχείριση χρηστών και αλλαγή ρόλων</li>
                <li>Δημιουργία και διαχείριση ψηφοφοριών</li>
                <li>Πλήρης πρόσβαση στη διαχείριση κατηγοριών, ετικετών και τοποθεσιών</li>
                <li>Προβολή στατιστικών και αναφορών</li>
              </ul>
            </div>
          </div>

          {/* Moderator Role */}
          <div className="border-2 border-yellow-300 rounded-lg p-5 bg-yellow-50">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">🛡️</span>
              <h3 className="text-xl font-bold text-yellow-900">Moderator (Συντονιστής)</h3>
            </div>
            <p className="text-gray-700 mb-3 font-semibold">Διαχείριση και έγκριση περιεχομένου.</p>
            <div className="bg-white rounded p-4">
              <p className="font-semibold text-gray-800 mb-2">Δικαιώματα:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                <li>Έγκριση ή απόρριψη ειδησεογραφικού περιεχομένου</li>
                <li>Επεξεργασία όλων των άρθρων</li>
                <li>Δημιουργία και επεξεργασία δικών τους άρθρων</li>
                <li>Συμμετοχή σε ψηφοφορίες</li>
                <li>Διαχείριση σχολίων και αλληλεπιδράσεων (moderation)</li>
              </ul>
              <p className="text-sm text-gray-600 italic mt-2">
                Σημείωση: Οι Moderators δεν μπορούν να διαγράψουν άρθρα άλλων χρηστών.
              </p>
            </div>
          </div>

          {/* Editor Role */}
          <div className="border-2 border-blue-300 rounded-lg p-5 bg-blue-50">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">✏️</span>
              <h3 className="text-xl font-bold text-blue-900">Editor (Συντάκτης)</h3>
            </div>
            <p className="text-gray-700 mb-3 font-semibold">Δημιουργία και επεξεργασία άρθρων.</p>
            <div className="bg-white rounded p-4">
              <p className="font-semibold text-gray-800 mb-2">Δικαιώματα:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                <li>Δημιουργία νέων άρθρων όλων των τύπων</li>
                <li>Επεξεργασία όλων των άρθρων</li>
                <li>Διαγραφή μόνο των δικών τους άρθρων</li>
                <li>Δημιουργία και συμμετοχή σε ψηφοφορίες</li>
                <li>Χρήση όλων των δυνατοτήτων μορφοποίησης και πολυμέσων</li>
              </ul>
              <p className="text-sm text-gray-600 italic mt-2">
                Σημείωση: Τα άρθρα που σημειώνονται ως "Ειδήσεις" απαιτούν έγκριση από Moderator ή Admin.
              </p>
            </div>
          </div>

          {/* Viewer Role */}
          <div className="border-2 border-green-300 rounded-lg p-5 bg-green-50">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">👤</span>
              <h3 className="text-xl font-bold text-green-900">Viewer (Αναγνώστης)</h3>
            </div>
            <p className="text-gray-700 mb-3 font-semibold">Βασικός χρήστης της πλατφόρμας.</p>
            <div className="bg-white rounded p-4">
              <p className="font-semibold text-gray-800 mb-2">Δικαιώματα:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                <li>Δημιουργία νέων άρθρων</li>
                <li>Επεξεργασία και διαγραφή μόνο των δικών τους άρθρων</li>
                <li>Συμμετοχή σε ψηφοφορίες</li>
                <li>Ανάγνωση και περιήγηση σε όλο το δημοσιευμένο περιεχόμενο</li>
                <li>Διαχείριση προσωπικού προφίλ</li>
              </ul>
              <p className="text-sm text-gray-600 italic mt-2">
                Σημείωση: Αυτός είναι ο προεπιλεγμένος ρόλος για νέους χρήστες. Τα άρθρα που σημειώνονται ως "Ειδήσεις" απαιτούν έγκριση.
              </p>
            </div>
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-5 mt-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Πίνακας Δικαιωμάτων</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Λειτουργία</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Viewer</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Editor</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Moderator</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Admin</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Δημιουργία άρθρου</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">Επεξεργασία δικού μου άρθρου</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Επεξεργασία άρθρου άλλου χρήστη</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">Διαγραφή δικού μου άρθρου</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Διαγραφή άρθρου άλλου χρήστη</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">Έγκριση ειδήσεων</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Συμμετοχή σε ψηφοφορίες</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">Διαχείριση χρηστών</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">❌</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* News Approval Workflow */}
        <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded">
          <h3 className="text-xl font-semibold text-orange-900 mb-3">📰 Ροή Εργασιών Έγκρισης Ειδήσεων</h3>
          <p className="text-gray-700 mb-3">
            Όταν ένα άρθρο σημειώνεται ως "Είδηση", ακολουθεί μια διαδικασία έγκρισης:
          </p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-2">
            <li>Ο χρήστης δημιουργεί άρθρο και επιλέγει "Σήμανση ως είδηση"</li>
            <li>Το άρθρο αποθηκεύεται με κατάσταση "Εκκρεμής είδηση" (Pending News)</li>
            <li>Ένας Moderator ή Admin εξετάζει το περιεχόμενο</li>
            <li>Ο Moderator/Admin εγκρίνει ή απορρίπτει την είδηση</li>
            <li>Μόνο εγκεκριμένες ειδήσεις εμφανίζονται στην ενότητα "Ειδήσεις" της πλατφόρμας</li>
          </ol>
          <p className="text-sm text-gray-600 italic mt-3">
            Σημείωση: Η διαδικασία έγκρισης διασφαλίζει την ποιότητα και την ακρίβεια του ειδησεογραφικού περιεχομένου.
          </p>
        </div>
      </section>

      {/* Section 4: Authentication System */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Σύστημα Ταυτοποίησης</h2>
          <p className="text-gray-700 mb-4">
            Η πλατφόρμα Απόφαση προσφέρει ευέλικτες επιλογές σύνδεσης για να ξεκινήσετε γρήγορα:
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-blue-300 rounded-lg p-5 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">🔑 Παραδοσιακή Σύνδεση</h3>
            <p className="text-gray-700 mb-3">
              Δημιουργήστε λογαριασμό με όνομα χρήστη και κωδικό πρόσβασης:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 space-y-2">
              <li>Κάντε κλικ στο κουμπί "Εγγραφή" στην κορυφή της σελίδας</li>
              <li>Συμπληρώστε τη φόρμα εγγραφής με τα στοιχεία σας</li>
              <li>Επιλέξτε ένα ασφαλές όνομα χρήστη και κωδικό πρόσβασης</li>
              <li>Συνδεθείτε χρησιμοποιώντας τα διαπιστευτήριά σας</li>
            </ol>
          </div>

          <div className="border-2 border-gray-800 rounded-lg p-5 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              <span className="inline-block mr-2">🐙</span>GitHub OAuth
            </h3>
            <p className="text-gray-700 mb-3">
              Συνδεθείτε γρήγορα και εύκολα χρησιμοποιώντας τον λογαριασμό GitHub σας:
            </p>
            
            <div className="bg-white rounded p-4 mb-3">
              <p className="font-semibold text-gray-800 mb-2">Νέοι Χρήστες:</p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2 text-sm">
                <li>Κάντε κλικ στο κουμπί "Σύνδεση με GitHub"</li>
                <li>Εξουσιοδοτήστε την εφαρμογή Απόφαση στο GitHub</li>
                <li>Το προφίλ σας θα δημιουργηθεί αυτόματα με πληροφορίες από το GitHub</li>
                <li>Είστε έτοιμοι να ξεκινήσετε!</li>
              </ol>
            </div>

            <div className="bg-white rounded p-4 mb-3">
              <p className="font-semibold text-gray-800 mb-2">Σύνδεση Υπάρχοντος Λογαριασμού:</p>
              <p className="text-gray-700 text-sm mb-2">
                Αν έχετε ήδη λογαριασμό με παραδοσιακή σύνδεση, μπορείτε να συνδέσετε το GitHub:
              </p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2 text-sm">
                <li>Συνδεθείτε με τα υπάρχοντα διαπιστευτήριά σας</li>
                <li>Μεταβείτε στις ρυθμίσεις προφίλ</li>
                <li>Επιλέξτε "Σύνδεση με GitHub"</li>
                <li>Πλέον μπορείτε να συνδέεστε με οποιονδήποτε τρόπο</li>
              </ol>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-3">
              <p className="text-sm font-semibold text-green-900 mb-2">Πλεονεκτήματα GitHub OAuth:</p>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li>Γρήγορη εγγραφή χωρίς φόρμες</li>
                <li>Αυτόματη συμπλήρωση προφίλ (όνομα, email, avatar)</li>
                <li>Ασφαλής σύνδεση μέσω GitHub</li>
                <li>Δεν χρειάζεται να θυμάστε επιπλέον κωδικούς</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Poll System */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Σύστημα Ψηφοφοριών</h2>
          <p className="text-gray-700 mb-4">
            Το σύστημα ψηφοφοριών της πλατφόρμας σας επιτρέπει να δημιουργείτε διαδραστικές ψηφοφορίες και να 
            συλλέγετε γνώμες από την κοινότητα με προηγμένες δυνατότητες οπτικοποίησης.
          </p>
        </div>

        {/* Creating Polls */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3 text-blue-900">Δημιουργία Ψηφοφορίας</h3>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">📝 Βασικά Βήματα</h4>
            <ol className="list-decimal pl-6 text-gray-700 space-y-2">
              <li>Συνδεθείτε στον λογαριασμό σας</li>
              <li>Μεταβείτε στη σελίδα δημιουργίας ψηφοφορίας</li>
              <li>Εισάγετε τον τίτλο και την περιγραφή της ψηφοφορίας</li>
              <li>Επιλέξτε τον τύπο ψηφοφορίας (Απλή ή Σύνθετη)</li>
              <li>Προσθέστε τις επιλογές</li>
              <li>Ρυθμίστε τις προτιμήσεις της ψηφοφορίας</li>
              <li>Δημοσιεύστε την ψηφοφορία</li>
            </ol>
          </div>

          <div className="space-y-4 mt-4">
            <h4 className="text-lg font-semibold text-gray-800">Τύποι Ψηφοφοριών</h4>
            
            {/* Simple Polls */}
            <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
              <h5 className="font-semibold text-green-900 mb-2">✅ Απλές Ψηφοφορίες</h5>
              <p className="text-gray-700 mb-2">
                Οι απλές ψηφοφορίες περιλαμβάνουν μόνο κείμενο για κάθε επιλογή.
              </p>
              <div className="bg-white rounded p-3 mt-2">
                <p className="text-sm font-semibold text-gray-800 mb-1">Παράδειγμα:</p>
                <p className="text-sm text-gray-700 mb-2">Ερώτηση: "Ποια είναι η αγαπημένη σας εποχή;"</p>
                <ul className="list-disc pl-6 text-sm text-gray-700">
                  <li>Άνοιξη</li>
                  <li>Καλοκαίρι</li>
                  <li>Φθινόπωρο</li>
                  <li>Χειμώνας</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Χρήση:</span> Ιδανικές για γρήγορες ερωτήσεις και απλές επιλογές.
                </p>
              </div>
            </div>

            {/* Complex Polls */}
            <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
              <h5 className="font-semibold text-purple-900 mb-2">🎨 Σύνθετες Ψηφοφορίες</h5>
              <p className="text-gray-700 mb-2">
                Οι σύνθετες ψηφοφορίες επιτρέπουν την προσθήκη φωτογραφιών και συνδέσμων σε κάθε επιλογή.
              </p>
              <div className="bg-white rounded p-3 mt-2">
                <p className="text-sm font-semibold text-gray-800 mb-2">Κάθε επιλογή μπορεί να περιλαμβάνει:</p>
                <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                  <li><span className="font-semibold">Κείμενο:</span> Η περιγραφή της επιλογής</li>
                  <li><span className="font-semibold">Φωτογραφία:</span> URL εικόνας για οπτική απεικόνιση</li>
                  <li><span className="font-semibold">Σύνδεσμος:</span> URL για περισσότερες πληροφορίες</li>
                </ul>
              </div>
              <div className="bg-white rounded p-3 mt-2">
                <p className="text-sm font-semibold text-gray-800 mb-1">Παράδειγμα:</p>
                <p className="text-sm text-gray-700 mb-2">Ερώτηση: "Ποιο είναι το καλύτερο τουριστικό αξιοθέατο;"</p>
                <ul className="list-none pl-0 text-sm text-gray-700 space-y-2">
                  <li>
                    <span className="font-semibold">Ακρόπολη</span><br/>
                    <span className="text-xs text-gray-600">📷 Φωτογραφία Ακρόπολης</span><br/>
                    <span className="text-xs text-gray-600">🔗 https://example.com/acropolis</span>
                  </li>
                  <li>
                    <span className="font-semibold">Σαντορίνη</span><br/>
                    <span className="text-xs text-gray-600">📷 Φωτογραφία Σαντορίνης</span><br/>
                    <span className="text-xs text-gray-600">🔗 https://example.com/santorini</span>
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Χρήση:</span> Ιδανικές για συγκρίσεις προϊόντων, τόπων, ή οτιδήποτε 
                  επωφελείται από οπτικό υλικό.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Poll Settings */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3 text-blue-900">Ρυθμίσεις Ψηφοφορίας</h3>
          <p className="text-gray-700 mb-3">
            Προσαρμόστε τη συμπεριφορά της ψηφοφορίας με τις ακόλουθες επιλογές:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <h4 className="font-semibold text-gray-800 mb-2">🔓 Δημόσια/Ιδιωτική Ψηφοφορία</h4>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li><span className="font-semibold">Δημόσια:</span> Οποιοσδήποτε μπορεί να δει και να ψηφίσει</li>
                <li><span className="font-semibold">Ιδιωτική:</span> Μόνο συνδεδεμένοι χρήστες μπορούν να ψηφίσουν</li>
              </ul>
            </div>

            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <h4 className="font-semibold text-gray-800 mb-2">👥 Συνεισφορές Χρηστών</h4>
              <p className="text-sm text-gray-700 mb-2">
                Επιτρέψτε στους χρήστες να προσθέτουν δικές τους επιλογές στην ψηφοφορία.
              </p>
              <p className="text-xs text-gray-600 italic">
                Χρήσιμο για crowdsourcing ιδεών και προτάσεων.
              </p>
            </div>

            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <h4 className="font-semibold text-gray-800 mb-2">📊 Εμφάνιση Αποτελεσμάτων</h4>
              <p className="text-sm text-gray-700 mb-2">Ελέγξτε πότε εμφανίζονται τα αποτελέσματα:</p>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li><span className="font-semibold">Μετά την ψήφο:</span> Τα αποτελέσματα εμφανίζονται αμέσως μετά την ψηφοφορία</li>
                <li><span className="font-semibold">Πάντα:</span> Τα αποτελέσματα είναι ορατά ακόμα και πριν ψηφίσετε</li>
                <li><span className="font-semibold">Μετά την προθεσμία:</span> Τα αποτελέσματα εμφανίζονται μόνο μετά τη λήξη της ψηφοφορίας</li>
              </ul>
            </div>

            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <h4 className="font-semibold text-gray-800 mb-2">📅 Προθεσμία</h4>
              <p className="text-sm text-gray-700 mb-2">
                Ορίστε μια ημερομηνία λήξης για την ψηφοφορία.
              </p>
              <p className="text-xs text-gray-600 italic">
                Προαιρετικό - αν δεν οριστεί, η ψηφοφορία παραμένει ανοιχτή επ' αόριστον.
              </p>
            </div>

            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <h4 className="font-semibold text-gray-800 mb-2">🔄 Αλλαγή Ψήφου</h4>
              <p className="text-sm text-gray-700 mb-2">
                Οι χρήστες μπορούν να αλλάξουν την ψήφο τους ανά πάσα στιγμή.
              </p>
              <p className="text-xs text-gray-600 italic">
                Ενεργοποιημένο από προεπιλογή για μεγαλύτερη ευελιξία.
              </p>
            </div>
          </div>
        </div>

        {/* Voting in Polls */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3 text-blue-900">Συμμετοχή σε Ψηφοφορίες</h3>
          
          <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded">
            <h4 className="text-lg font-semibold text-green-900 mb-3">Πώς να Ψηφίσετε</h4>
            <ol className="list-decimal pl-6 text-gray-700 space-y-2">
              <li>Περιηγηθείτε στη σελίδα της ψηφοφορίας</li>
              <li>Διαβάστε την ερώτηση και τις επιλογές προσεκτικά</li>
              <li>Επιλέξτε την επιλογή που προτιμάτε</li>
              <li>Κάντε κλικ στο κουμπί "Ψήφος" ή "Vote"</li>
              <li>Τα αποτελέσματα θα εμφανιστούν σύμφωνα με τις ρυθμίσεις της ψηφοφορίας</li>
            </ol>
            <div className="bg-white rounded p-3 mt-3">
              <p className="text-sm font-semibold text-gray-800 mb-1">Σημαντικό:</p>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li>Μπορείτε να αλλάξετε την ψήφο σας οποτεδήποτε</li>
                <li>Κάποιες ψηφοφορίες απαιτούν σύνδεση για να ψηφίσετε</li>
                <li>Μη συνδεδεμένοι χρήστες μπορούν να ψηφίσουν σε δημόσιες ψηφοφορίες</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Viewing Results */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3 text-blue-900">Προβολή Αποτελεσμάτων</h3>
          
          <div className="bg-purple-50 border-l-4 border-purple-500 p-5 rounded">
            <h4 className="text-lg font-semibold text-purple-900 mb-3">📈 Οπτικοποίηση Αποτελεσμάτων</h4>
            <p className="text-gray-700 mb-3">
              Τα αποτελέσματα των ψηφοφοριών εμφανίζονται με γραφήματα Chart.js για εύκολη κατανόηση:
            </p>
            
            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-white rounded p-3 border border-purple-200">
                <p className="font-semibold text-gray-800 text-sm mb-1">📊 Bar Chart</p>
                <p className="text-xs text-gray-600">Στηλογράμματα που δείχνουν τις ψήφους κάθε επιλογής σε παράλληλες μπάρες.</p>
              </div>
              <div className="bg-white rounded p-3 border border-purple-200">
                <p className="font-semibold text-gray-800 text-sm mb-1">🥧 Pie Chart</p>
                <p className="text-xs text-gray-600">Κυκλικό διάγραμμα που δείχνει τα ποσοστά κάθε επιλογής.</p>
              </div>
              <div className="bg-white rounded p-3 border border-purple-200">
                <p className="font-semibold text-gray-800 text-sm mb-1">🍩 Doughnut Chart</p>
                <p className="text-xs text-gray-600">Παρόμοιο με το Pie Chart αλλά με κενό στο κέντρο για σύγχρονη εμφάνιση.</p>
              </div>
            </div>

            <div className="bg-white rounded p-3 mt-3">
              <p className="text-sm font-semibold text-gray-800 mb-2">Πληροφορίες που εμφανίζονται:</p>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li>Συνολικός αριθμός ψήφων</li>
                <li>Αριθμός ψήφων ανά επιλογή</li>
                <li>Ποσοστό κάθε επιλογής</li>
                <li>Οπτική αναπαράσταση με χρώματα</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Poll Tips */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded">
          <h4 className="text-lg font-semibold text-yellow-900 mb-3">💡 Συμβουλές για Αποτελεσματικές Ψηφοφορίες</h4>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Διατυπώστε την ερώτηση με σαφήνεια και συντομία</li>
            <li>Προσφέρετε ισορροπημένες και αμερόληπτες επιλογές</li>
            <li>Χρησιμοποιήστε σύνθετες ψηφοφορίες όταν οι εικόνες βοηθούν στην κατανόηση</li>
            <li>Ορίστε κατάλληλη προθεσμία για επείγουσες ψηφοφορίες</li>
            <li>Επιτρέψτε συνεισφορές χρηστών για να συλλέξετε περισσότερες ιδέες</li>
            <li>Μοιραστείτε την ψηφοφορία για να λάβετε περισσότερες απαντήσεις</li>
          </ul>
        </div>
      </section>

      {/* Section 6: Getting Started */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Πώς να ξεκινήσετε</h2>
          <p className="text-gray-700 mb-4">
            Για να δημιουργήσετε ένα άρθρο, πρέπει πρώτα να συνδεθείτε στον λογαριασμό σας. Εάν δεν έχετε λογαριασμό,
            μπορείτε να δημιουργήσετε έναν κάνοντας κλικ στο κουμπί "Εγγραφή" ή "Σύνδεση με GitHub" στην κορυφή της σελίδας.
          </p>
          <ol className="list-decimal pl-6 text-gray-700 space-y-3">
            <li>Συνδεθείτε στον λογαριασμό σας (με username/password ή GitHub)</li>
            <li>Κάντε κλικ στο μενού χρήστη (Hello [όνομα χρήστη]) στην πάνω δεξιά γωνία</li>
            <li>Επιλέξτε "New Article" για να μεταβείτε στον επεξεργαστή</li>
            <li>Κάντε κλικ στο κουμπί "Προβολή φόρμας" για να εμφανίσετε τη φόρμα δημιουργίας άρθρου</li>
          </ol>
        </div>
      </section>

      {/* Section 7: Article Types */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Τύποι Άρθρων</h2>
          <p className="text-gray-700 mb-4">
            Η πλατφόρμα Απόφαση υποστηρίζει τρεις διαφορετικούς τύπους περιεχομένου, ο καθένας με συγκεκριμένο σκοπό:
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-indigo-300 rounded-lg p-5 bg-indigo-50">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">📝 Personal (Προσωπικά)</h3>
            <p className="text-gray-700 mb-2">
              Προσωπικά άρθρα, αναρτήσεις, και σκέψεις για τη δημιουργία προσωπικού περιεχομένου.
            </p>
            <div className="bg-white rounded p-3 mt-2">
              <p className="text-sm font-semibold text-gray-800 mb-1">Χαρακτηριστικά:</p>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li>Άμεση δημοσίευση χωρίς έγκριση</li>
                <li>Ιδανικά για προσωπικές απόψεις και εμπειρίες</li>
                <li>Πλήρης έλεγχος από τον δημιουργό</li>
              </ul>
            </div>
          </div>

          <div className="border-2 border-blue-300 rounded-lg p-5 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📰 Articles (Άρθρα)</h3>
            <p className="text-gray-700 mb-2">
              Αναλυτικά άρθρα, οδηγοί, και εμπεριστατωμένο περιεχόμενο για την κοινότητα.
            </p>
            <div className="bg-white rounded p-3 mt-2">
              <p className="text-sm font-semibold text-gray-800 mb-1">Χαρακτηριστικά:</p>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li>Άμεση δημοσίευση χωρίς έγκριση</li>
                <li>Κατάλληλα για εκπαιδευτικό και ενημερωτικό περιεχόμενο</li>
                <li>Υποστήριξη πλούσιας μορφοποίησης και πολυμέσων</li>
              </ul>
            </div>
          </div>

          <div className="border-2 border-red-300 rounded-lg p-5 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900 mb-2">🗞️ News (Ειδήσεις)</h3>
            <p className="text-gray-700 mb-2">
              Ειδησεογραφικό περιεχόμενο που απαιτεί επαλήθευση και έγκριση πριν τη δημοσίευση.
            </p>
            <div className="bg-white rounded p-3 mt-2">
              <p className="text-sm font-semibold text-gray-800 mb-1">Χαρακτηριστικά:</p>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                <li><span className="font-semibold text-red-700">Απαιτεί έγκριση</span> από Moderator ή Admin</li>
                <li>Υψηλότερα πρότυπα ακρίβειας και ποιότητας</li>
                <li>Εμφανίζεται στην ειδική ενότητα "Ειδήσεις" μετά την έγκριση</li>
                <li>Ενεργοποιείται με την επιλογή "Σήμανση ως είδηση"</li>
              </ul>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mt-2">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Σημαντικό:</span> Όταν επιλέγετε "Σήμανση ως είδηση", το άρθρο μπαίνει σε 
                κατάσταση "Εκκρεμής έγκριση" και θα πρέπει να εγκριθεί από Moderator ή Admin για να εμφανιστεί 
                στην ενότητα ειδήσεων. Δείτε την ενότητα "Ρόλοι Χρηστών" για περισσότερες πληροφορίες.
              </p>
            </div>
          </div>
        </div>
      </section>

            {/* Section 8: Article Fields */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Δημιουργία Άρθρων - Κατανόηση των Πεδίων</h2>
          <p className="text-gray-700 mb-6">
            Η φόρμα δημιουργίας άρθρου χωρίζεται σε τέσσερις ενότητες. Ας δούμε κάθε πεδίο αναλυτικά:
          </p>
        </div>

        {/* Mandatory Fields */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3 text-blue-900">1. Υποχρεωτικά Πεδία</h3>
          <p className="text-gray-700 mb-4">
            Αυτά τα πεδία είναι απαραίτητα για τη δημιουργία ενός άρθρου:
          </p>

          <div className="space-y-4 pl-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Τίτλος *</h4>
              <p className="text-gray-700 mb-2">
                Ο κύριος τίτλος του άρθρου σας. Πρέπει να είναι σαφής, περιεκτικός και ελκυστικός.
              </p>
              <p className="text-sm text-gray-600 italic">
                Παράδειγμα: "Νέες εξελίξεις στην τεχνολογία τεχνητής νοημοσύνης"
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Περιεχόμενο *</h4>
              <p className="text-gray-700 mb-2">
                Το κύριο σώμα του άρθρου σας. Εδώ γράφετε το πλήρες περιεχόμενο του άρθρου σας.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
                <p className="text-sm font-semibold text-blue-900 mb-2">Συμβουλές για το Περιεχόμενο:</p>
                <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                  <li>Χρησιμοποιήστε σαφή και απλή γλώσσα</li>
                  <li>Οργανώστε το κείμενό σας σε παραγράφους</li>
                  <li>Ξεκινήστε με μια ελκυστική εισαγωγή</li>
                  <li>Χρησιμοποιήστε παραδείγματα και στοιχεία όταν είναι δυνατόν</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Κατάσταση *</h4>
              <p className="text-gray-700 mb-2">
                Επιλέξτε την κατάσταση του άρθρου σας:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><span className="font-semibold">Πρόχειρο:</span> Το άρθρο δεν είναι ακόμα έτοιμο για δημοσίευση. Μόνο εσείς μπορείτε να το δείτε.</li>
                <li><span className="font-semibold">Δημοσιευμένο:</span> Το άρθρο είναι ορατό σε όλους τους χρήστες της πλατφόρμας.</li>
                <li><span className="font-semibold">Αρχειοθετημένο:</span> Το άρθρο δεν εμφανίζεται πια στις κύριες λίστες αλλά παραμένει προσβάσιμο.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Categories and Tags */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3 text-blue-900">2. Κατηγορίες & Ετικέτες</h3>
          
          <div className="space-y-4 pl-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Κατηγορία</h4>
              <p className="text-gray-700 mb-2">
                Η κύρια θεματική κατηγορία του άρθρου σας. Βοηθά τους αναγνώστες να βρουν σχετικό περιεχόμενο.
              </p>
              <p className="text-sm text-gray-600 italic">
                Παραδείγματα: Τεχνολογία, Πολιτική, Αθλητισμός, Πολιτισμός, Οικονομία
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Ετικέτες (Tags)</h4>
              <p className="text-gray-700 mb-2">
                Λέξεις-κλειδιά που σχετίζονται με το άρθρο σας. Διαχωρίστε πολλαπλές ετικέτες με κόμματα.
              </p>
              <p className="text-sm text-gray-600 italic">
                Παράδειγμα: τεχνητή νοημοσύνη, μηχανική μάθηση, καινοτομία
              </p>
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3 text-blue-900">3. Επιπλέον Επιλογές</h3>
          <p className="text-gray-700 mb-4">
            Αυτά τα πεδία είναι προαιρετικά αλλά μπορούν να βελτιώσουν την εμφάνιση και τη χρηστικότητα του άρθρου σας:
          </p>

          <div className="space-y-4 pl-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Υπότιτλος</h4>
              <p className="text-gray-700 mb-2">
                Ένας δευτερεύων τίτλος που παρέχει επιπλέον πληροφορίες ή πλαίσιο για το άρθρο.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Περίληψη</h4>
              <p className="text-gray-700 mb-2">
                Μια σύντομη περιγραφή του άρθρου (1-2 προτάσεις). Εμφανίζεται στις λίστες άρθρων και βοηθά τους αναγνώστες
                να αποφασίσουν αν θέλουν να διαβάσουν περισσότερα.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Χρόνος ανάγνωσης (λεπτά)</h4>
              <p className="text-gray-700 mb-2">
                Εκτιμώμενος χρόνος που χρειάζεται για να διαβαστεί το άρθρο. Βοηθά τους αναγνώστες να αποφασίσουν αν έχουν χρόνο να το διαβάσουν τώρα.
              </p>
              <p className="text-sm text-gray-600 italic">
                Συμβουλή: Υπολογίστε περίπου 200-250 λέξεις ανά λεπτό ανάγνωσης.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Εικόνα Εξωφύλλου</h4>
              <p className="text-gray-700 mb-2">
                Μπορείτε να προσθέσετε μια εικόνα που θα εμφανίζεται ως εξώφυλλο του άρθρου:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li><span className="font-semibold">URL Εικόνας Εξωφύλλου:</span> Εισάγετε τη διεύθυνση URL μιας εικόνας (π.χ. https://example.com/image.jpg)</li>
                <li><span className="font-semibold">Λεζάντα Εικόνας:</span> Προαιρετική περιγραφή της εικόνας που εμφανίζεται κάτω από αυτήν</li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-3">
                <p className="text-sm font-semibold text-yellow-900 mb-2">Σημείωση για Εικόνες:</p>
                <p className="text-sm text-gray-700">
                  Η πλατφόρμα θα εμφανίσει μια προεπισκόπηση της εικόνας μόλις εισάγετε το URL. Αν η εικόνα δεν
                  φορτώσει, ελέγξτε ότι το URL είναι σωστό και προσβάσιμο.
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Πηγή</h4>
              <p className="text-gray-700 mb-2">
                Αν το άρθρο σας βασίζεται σε κάποια εξωτερική πηγή, μπορείτε να την αναφέρετε:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li><span className="font-semibold">Πηγή:</span> Το όνομα του μέσου ή του οργανισμού (π.χ. Reuters, BBC)</li>
                <li><span className="font-semibold">URL Πηγής:</span> Ο σύνδεσμος προς το αρχικό άρθρο ή την πηγή</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Επιλογές Χαρακτηριστικών</h4>
              <p className="text-gray-700 mb-2">
                Δύο σημαντικά checkboxes που επηρεάζουν τον τρόπο εμφάνισης του άρθρου:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                <li>
                  <span className="font-semibold">Σήμανση ως είδηση:</span> Επιλέξτε αυτό αν το άρθρο σας είναι είδηση.
                  <span className="text-orange-700"> Σημείωση: Οι ειδήσεις απαιτούν έγκριση από moderator ή admin πριν δημοσιευτούν στην ενότητα ειδήσεων.</span>
                </li>
                <li>
                  <span className="font-semibold">Προτεινόμενο άρθρο:</span> Επισημαίνει το άρθρο ως ιδιαίτερα σημαντικό ή ενδιαφέρον.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3 text-blue-900">4. Τοποθεσία (Προαιρετικό)</h3>
          <p className="text-gray-700 mb-3">
            Μπορείτε να συσχετίσετε το άρθρο σας με μια συγκεκριμένη γεωγραφική τοποθεσία. Το σύστημα τοποθεσιών 
            της πλατφόρμας είναι ιεραρχικό και οργανωμένο σε τρία επίπεδα:
          </p>
          
          <div className="bg-white border-2 border-purple-300 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">📍 Ιεραρχία Τοποθεσιών</h4>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><span className="font-semibold">Επίπεδο 1 - Χώρες:</span> Το ανώτατο επίπεδο (π.χ. Ελλάδα, Κύπρος)</li>
              <li><span className="font-semibold">Επίπεδο 2 - Περιφέρειες:</span> Γεωγραφικές περιοχές εντός χωρών (π.χ. Αττική, Κρήτη)</li>
              <li><span className="font-semibold">Επίπεδο 3 - Πόλεις:</span> Συγκεκριμένες πόλεις εντός περιφερειών (π.χ. Αθήνα, Ηράκλειο)</li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-3">
            <h4 className="font-semibold text-green-900 mb-2">Πώς να επιλέξετε τοποθεσία:</h4>
            <ol className="list-decimal pl-6 text-gray-700 space-y-2">
              <li>Χρησιμοποιήστε το dropdown μενού για να επιλέξετε μια τοποθεσία</li>
              <li>Οι τοποθεσίες εμφανίζονται ιεραρχικά (Χώρα → Περιφέρεια → Πόλη)</li>
              <li>Ή επιλέξτε "Χρήση τοποθεσίας χρήστη" για να χρησιμοποιήσετε την προεπιλεγμένη τοποθεσία του προφίλ σας</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 mt-3 rounded">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">💡 Συμβουλή:</span> Η ετικετοποίηση με τοποθεσία βοηθά τους αναγνώστες να 
              βρουν περιεχόμενο που σχετίζεται με την περιοχή τους ή με περιοχές που τους ενδιαφέρουν. Χρησιμοποιήστε 
              την πιο συγκεκριμένη τοποθεσία που ταιριάζει στο άρθρο σας.
            </p>
          </div>
        </div>
      </section>

            {/* Section 9: Adding Media */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Πώς να προσθέσετε φωτογραφίες και βίντεο</h2>
          <p className="text-gray-700 mb-4">
            Η πλατφόρμα υποστηρίζει διάφορους τρόπους για να εμπλουτίσετε το περιεχόμενό σας με πολυμέσα:
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3">Προσθήκη εικόνων στο Περιεχόμενο</h3>
          <p className="text-gray-700 mb-3">
            Μπορείτε να ενσωματώσετε εικόνες στο κείμενο του άρθρου σας χρησιμοποιώντας σύνταξη HTML:
          </p>
          
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
            <code className="text-gray-800">
              {'<img src="https://example.com/photo.jpg" alt="Περιγραφή εικόνας" />'}
            </code>
          </div>

          <p className="text-gray-700 mt-3">
            Μπορείτε επίσης να προσθέσετε στυλ για καλύτερη εμφάνιση:
          </p>

          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
            <code className="text-gray-800">
              {'<img src="https://example.com/photo.jpg" alt="Περιγραφή" style="max-width: 100%; height: auto; border-radius: 8px;" />'}
            </code>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3">Ενσωμάτωση βίντεο</h3>
          <p className="text-gray-700 mb-3">
            Για να προσθέσετε βίντεο από πλατφόρμες όπως το YouTube, χρησιμοποιήστε τον κώδικα ενσωμάτωσης (embed code):
          </p>

          <div className="space-y-3">
            <div>
              <p className="font-semibold text-gray-800 mb-2">Παράδειγμα YouTube:</p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
                <code className="text-gray-800">
                  {'<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'}
                </code>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Πώς να βρείτε τον κώδικα ενσωμάτωσης:</p>
              <ol className="list-decimal pl-6 text-sm text-gray-700 space-y-1">
                <li>Μεταβείτε στο βίντεο που θέλετε να ενσωματώσετε</li>
                <li>Κάντε κλικ στο κουμπί "Κοινή χρήση" ή "Share"</li>
                <li>Επιλέξτε "Ενσωμάτωση" ή "Embed"</li>
                <li>Αντιγράψτε τον κώδικα και επικολλήστε τον στο πεδίο Περιεχόμενο</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

            {/* Section 10: Formatting Text */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Πώς να μορφοποιήσετε το κείμενο</h2>
          <p className="text-gray-700 mb-4">
            Μπορείτε να χρησιμοποιήσετε HTML tags για να μορφοποιήσετε το περιεχόμενό σας:
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold mb-3">Κοινές μορφοποιήσεις</h3>
          
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-gray-800 mb-2">Επικεφαλίδες (Headers):</p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm space-y-1">
                <div><code className="text-gray-800">{'<h2>Μεγάλη Επικεφαλίδα</h2>'}</code></div>
                <div><code className="text-gray-800">{'<h3>Μεσαία Επικεφαλίδα</h3>'}</code></div>
                <div><code className="text-gray-800">{'<h4>Μικρή Επικεφαλίδα</h4>'}</code></div>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-2">Έμφαση κειμένου:</p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm space-y-1">
                <div><code className="text-gray-800">{'<strong>Έντονο κείμενο</strong>'}</code></div>
                <div><code className="text-gray-800">{'<em>Πλάγιο κείμενο</em>'}</code></div>
                <div><code className="text-gray-800">{'<u>Υπογραμμισμένο κείμενο</u>'}</code></div>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-2">Λίστες:</p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                <code className="text-gray-800">
                  {'<ul>\n  <li>Πρώτο στοιχείο</li>\n  <li>Δεύτερο στοιχείο</li>\n  <li>Τρίτο στοιχείο</li>\n</ul>'}
                </code>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-2">Αριθμημένες λίστες:</p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                <code className="text-gray-800">
                  {'<ol>\n  <li>Πρώτο βήμα</li>\n  <li>Δεύτερο βήμα</li>\n  <li>Τρίτο βήμα</li>\n</ol>'}
                </code>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-2">Σύνδεσμοι (Links):</p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                <code className="text-gray-800">
                  {'<a href="https://example.com">Κείμενο συνδέσμου</a>'}
                </code>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-2">Παραγράφοι:</p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                <code className="text-gray-800">
                  {'<p>Αυτή είναι μια παράγραφος κειμένου.</p>'}
                </code>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-2">Αλλαγή γραμμής:</p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                <code className="text-gray-800">
                  {'Πρώτη γραμμή<br />Δεύτερη γραμμή'}
                </code>
              </div>
            </div>

            <div>
              <p className="font-semibold text-gray-800 mb-2">Παράθεση (Quote):</p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                <code className="text-gray-800">
                  {'<blockquote>Αυτό είναι ένα σημαντικό απόσπασμα ή παράθεση.</blockquote>'}
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* Section 11: Tips and Best Practices */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Συμβουλές και βέλτιστες πρακτικές</h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Γράφοντας καλό περιεχόμενο</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Χρησιμοποιήστε σαφείς και περιεκτικούς τίτλους που περιγράφουν ακριβώς το περιεχόμενο</li>
              <li>Χωρίστε το μεγάλο κείμενο σε παραγράφους για καλύτερη αναγνωσιμότητα</li>
              <li>Χρησιμοποιήστε επικεφαλίδες για να οργανώσετε το περιεχόμενό σας σε ενότητες</li>
              <li>Προσθέστε εικόνες ή βίντεο για να κάνετε το άρθρο πιο ενδιαφέρον</li>
              <li>Ελέγξτε την ορθογραφία και τη γραμματική πριν δημοσιεύσετε</li>
              <li>Αναφέρετε πάντα τις πηγές σας όταν χρησιμοποιείτε πληροφορίες από αλλού</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Τεχνικές συμβουλές</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Χρησιμοποιήστε εικόνες υψηλής ποιότητας που φορτώνουν γρήγορα</li>
              <li>Βεβαιωθείτε ότι τα URLs των εικόνων είναι έγκυρα και προσβάσιμα</li>
              <li>Δοκιμάστε τους συνδέσμους σας πριν δημοσιεύσετε</li>
              <li>Αποθηκεύστε το άρθρο ως "Πρόχειρο" ενώ το δουλεύετε</li>
              <li>Προεπισκοπήστε το άρθρο σας πριν το κάνετε "Δημοσιευμένο"</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Κανόνες κοινότητας</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Σεβαστείτε τους κανόνες της πλατφόρμας (δείτε τη σελίδα <a href="/rules" className="text-blue-600 hover:underline">Κανόνες</a>)</li>
              <li>Μην δημοσιεύετε παραπλανητικό ή ψευδές περιεχόμενο</li>
              <li>Σεβαστείτε τα πνευματικά δικαιώματα άλλων</li>
              <li>Αποφύγετε το spam και το διπλότυπο περιεχόμενο</li>
              <li>Αλληλεπιδράστε με σεβασμό με άλλους χρήστες</li>
            </ul>
          </div>
        </div>
      </section>

            {/* Section 12: After Publishing */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Μετά τη δημοσίευση</h2>
          <p className="text-gray-700 mb-4">
            Αφού δημοσιεύσετε το άρθρο σας, μπορείτε να:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Δείτε το στη λίστα "Πρόσφατα Άρθρα" στον επεξεργαστή</li>
            <li>Κάντε κλικ στο "Προβολή" για να δείτε πώς φαίνεται το άρθρο σας</li>
            <li>Επεξεργαστείτε το ανά πάσα στιγμή αν χρειάζεται (προσεχώς)</li>
            <li>Διαγράψτε το αν δεν το θέλετε πια (μόνο εσείς ή οι διαχειριστές)</li>
            <li>Παρακολουθήστε πώς αλληλεπιδρούν οι αναγνώστες με το περιεχόμενό σας</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Έγκριση ειδήσεων</h3>
          <p className="text-gray-700 mb-3">
            Αν επιλέξατε "Σήμανση ως είδηση":
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Το άρθρο θα έχει την κατάσταση "Εκκρεμής είδηση"</li>
            <li>Ένας moderator ή admin θα πρέπει να το εγκρίνει</li>
            <li>Μόλις εγκριθεί, θα εμφανιστεί ως "Εγκεκριμένη είδηση"</li>
            <li>Μόνο εγκεκριμένες ειδήσεις εμφανίζονται στην ενότητα Ειδήσεις</li>
          </ul>
        </div>
      </section>

            {/* Section 13: Need Help */}
      <section className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
        <h2 className="text-2xl font-semibold mb-3">Χρειάζεστε βοήθεια;</h2>
        <p className="text-gray-700 mb-3">
          Αν έχετε ερωτήσεις ή αντιμετωπίζετε προβλήματα, μπορείτε να:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Επισκεφθείτε τη σελίδα <a href="/contact" className="text-blue-600 hover:underline font-semibold">Επικοινωνία</a> για να επικοινωνήσετε μαζί μας</li>
          <li>Διαβάστε την <a href="/mission" className="text-blue-600 hover:underline font-semibold">Αποστολή</a> μας για να καταλάβετε καλύτερα την πλατφόρμα</li>
          <li>Ελέγξτε τους <a href="/rules" className="text-blue-600 hover:underline font-semibold">Κανόνες</a> για οδηγίες χρήσης</li>
          <li>Μάθετε πώς μπορείτε να <a href="/contribute" className="text-blue-600 hover:underline font-semibold">Συνεισφέρετε</a> στην κοινότητα</li>
        </ul>
      </section>
    </StaticPageLayout>
  );
}
