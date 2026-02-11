import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata = {
  title: 'Διαφάνεια & Μεθοδολογία - Απόφαση',
  description: 'Πώς λειτουργούμε, πώς συλλέγουμε δεδομένα και πώς διασφαλίζουμε τη διαφάνεια',
};

export default function TransparencyPage() {
  return (
    <StaticPageLayout title="Διαφάνεια & Μεθοδολογία" maxWidth="max-w-4xl">
      <section>
        <p className="text-xl text-gray-700 mb-6 leading-relaxed">
          Στο Apofasi, η διαφάνεια δεν είναι απλά μια αξία - είναι η θεμελιώδης αρχή που καθοδηγεί κάθε μας 
          απόφαση. Εδώ θα βρείτε λεπτομερείς πληροφορίες για το πώς λειτουργούμε και πώς διασφαλίζουμε την 
          ακεραιότητα των δεδομένων μας.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Η δέσμευσή μας για διαφάνεια</h2>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 space-y-3">
          <p className="text-gray-700">
            Πιστεύουμε ότι μια πλατφόρμα ενημέρωσης και πολιτικής συμμετοχής πρέπει να λειτουργεί με απόλυτη 
            διαφάνεια. Για αυτό:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Ο κώδικάς μας είναι <strong>ανοιχτού κώδικα (open source)</strong></li>
            <li>Δημοσιεύουμε τις πηγές όλων των ειδήσεων που συγκεντρώνουμε</li>
            <li>Εξηγούμε αναλυτικά τη μεθοδολογία των ψηφοφοριών μας</li>
            <li>Δεν κρύβουμε τα όρια και τους περιορισμούς των δεδομένων μας</li>
            <li>Λειτουργούμε χωρίς κομματικές γραμμές ή κρυφές ατζέντες</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Πώς συλλέγουμε ειδήσεις</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Πηγές ειδήσεων</h3>
            <p className="text-gray-700 mb-3">
              Συγκεντρώνουμε ειδήσεις από ποικίλες πηγές για να προσφέρουμε μια ολοκληρωμένη εικόνα:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Μεγάλα ελληνικά ειδησεογραφικά μέσα</li>
              <li>Διεθνή μέσα ενημέρωσης (για ελληνικά και διεθνή θέματα)</li>
              <li>Ανεξάρτητα ειδησεογραφικά sites</li>
              <li>Επίσημες ανακοινώσεις κυβερνητικών οργάνων</li>
              <li>Περιεχόμενο που δημιουργείται από τους χρήστες μας</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Διαδικασία επιλογής</h3>
            <p className="text-gray-700 mb-3">
              Κάθε πηγή που χρησιμοποιούμε πρέπει να πληροί τα ακόλουθα κριτήρια:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Αξιοπιστία:</strong> Ιστορικό ακριβών αναφορών</li>
              <li><strong>Διαφάνεια:</strong> Σαφής αναφορά πηγών και συντακτών</li>
              <li><strong>Ποικιλία:</strong> Διαφορετικές πολιτικές και ιδεολογικές απόψεις</li>
              <li><strong>Τακτική ενημέρωση:</strong> Συνεχής παραγωγή περιεχομένου</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Κατηγοριοποίηση</h3>
            <p className="text-gray-700">
              Οι ειδήσεις κατηγοριοποιούνται με βάση το θέμα τους (Πολιτική, Οικονομία, Διεθνή κ.λπ.) για να 
              διευκολύνεται η αναζήτηση. Η κατηγοριοποίηση γίνεται αυτόματα με βάση λέξεις-κλειδιά ή χειροκίνητα 
              από editors.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">⚠️ Σημαντική σημείωση</h3>
            <p className="text-gray-700">
              Η συγκέντρωση ειδήσεων από διάφορες πηγές <strong>δεν συνιστά επικύρωση</strong> του περιεχομένου 
              τους. Ενθαρρύνουμε τους χρήστες να διαβάζουν κριτικά και να ελέγχουν πολλαπλές πηγές.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Μεθοδολογία ψηφοφοριών</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Πώς λειτουργούν οι ψηφοφορίες</h3>
            <p className="text-gray-700 mb-3">
              Οι ψηφοφορίες στο Apofasi έχουν σχεδιαστεί να δείχνουν τη διάθεση της κοινότητας μας:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Κάθε εγγεγραμμένος χρήστης μπορεί να ψηφίσει μία φορά ανά ψηφοφορία</li>
              <li>Οι ψήφοι καταγράφονται αμέσως και τα αποτελέσματα ενημερώνονται σε πραγματικό χρόνο</li>
              <li>Η ταυτότητα του ψηφοφόρου προστατεύεται (δεν εμφανίζεται ποιος ψήφισε τι)</li>
              <li>Καταγράφεται μόνο ότι ο χρήστης ψήφισε, για να αποτραπεί η πολλαπλή ψηφοφορία</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Ασφάλεια και ακεραιότητα</h3>
            <p className="text-gray-700 mb-3">
              Για να διασφαλίσουμε την ακεραιότητα των ψηφοφοριών:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Κάθε ψήφος συνδέεται με ένα μοναδικό λογαριασμό χρήστη</li>
              <li>Εντοπίζουμε και αποκλείουμε bot activity</li>
              <li>Παρακολουθούμε ύποπτα μοτίβα ψηφοφορίας</li>
              <li>Οι χρήστες που παραβιάζουν τους κανόνες αποκλείονται</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">🚨 Κρίσιμος περιορισμός</h3>
            <p className="text-gray-700 mb-3">
              Τα αποτελέσματα των ψηφοφοριών στο Apofasi <strong>ΔΕΝ είναι επιστημονικά αντιπροσωπευτικά</strong> 
              της γενικής κοινής γνώμης. Δείχνουν μόνο τη διάθεση της κοινότητας που συμμετέχει στην πλατφόρμα.
            </p>
            <p className="text-gray-700 mb-3">
              <strong>Λόγοι για τον περιορισμό αυτό:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Το δείγμα δεν είναι τυχαίο</li>
              <li>Οι συμμετέχοντες επιλέγουν μόνοι τους να ψηφίσουν</li>
              <li>Η πλατφόρμα μπορεί να έλκει συγκεκριμένα δημογραφικά</li>
              <li>Δεν υπάρχει στάθμιση για να αντικατοπτρίζεται ο γενικός πληθυσμός</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Μελλοντικές βελτιώσεις</h3>
            <p className="text-gray-700 mb-3">
              Εργαζόμαστε για να βελτιώσουμε τη μεθοδολογία μας:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Blockchain-based επαλήθευση ψήφων</li>
              <li>Βελτιωμένη ανίχνευση bot και χειραγώγησης</li>
              <li>Δημογραφικά στοιχεία συμμετεχόντων (προαιρετικά και ανώνυμα)</li>
              <li>Σύγκριση με επίσημες δημοσκοπήσεις για διαφάνεια</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Διαχείριση περιεχομένου</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Ρόλοι και δικαιώματα</h3>
            <p className="text-gray-700 mb-3">
              Η πλατφόρμα διαθέτει τρεις ρόλους χρηστών με διαφορετικά δικαιώματα:
            </p>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded p-4">
                <h4 className="font-semibold mb-2">👤 User</h4>
                <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
                  <li>Δημιουργία Personal και Articles άρθρων</li>
                  <li>Επεξεργασία των δικών τους άρθρων</li>
                  <li>Συμμετοχή σε ψηφοφορίες</li>
                  <li>Σχολιασμός</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded p-4">
                <h4 className="font-semibold mb-2">✏️ Editor</h4>
                <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
                  <li>Όλα τα δικαιώματα του User</li>
                  <li>Επεξεργασία όλων των Articles</li>
                  <li>Δημιουργία News άρθρων</li>
                  <li>Moderation σχολίων</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded p-4">
                <h4 className="font-semibold mb-2">⚙️ Admin</h4>
                <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
                  <li>Όλα τα δικαιώματα του Editor</li>
                  <li>Διαγραφή οποιουδήποτε περιεχομένου</li>
                  <li>Διαχείριση χρηστών</li>
                  <li>Διαχείριση πλατφόρμας</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Πολιτική moderation</h3>
            <p className="text-gray-700 mb-3">
              Η moderation ακολουθεί συγκεκριμένες αρχές:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Ελάχιστη παρέμβαση:</strong> Επεμβαίνουμε μόνο όταν παραβιάζονται οι κανόνες</li>
              <li><strong>Διαφάνεια:</strong> Οι λόγοι διαγραφής εξηγούνται πάντα</li>
              <li><strong>Δίκαιη διαδικασία:</strong> Οι χρήστες μπορούν να αμφισβητήσουν αποφάσεις</li>
              <li><strong>Συνέπεια:</strong> Οι ίδιοι κανόνες εφαρμόζονται σε όλους</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Οικονομική διαφάνεια</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Πώς χρηματοδοτούμαστε</h3>
            <p className="text-gray-700 mb-3">
              Το Apofasi είναι ένα μη κερδοσκοπικό project που λειτουργεί με:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Εθελοντική εργασία:</strong> Η ομάδα μας εργάζεται pro bono</li>
              <li><strong>Δωρεές κοινότητας:</strong> Οικονομική στήριξη από χρήστες</li>
              <li><strong>Ανοιχτός κώδικας:</strong> Συνεισφορές από developers</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Κόστη λειτουργίας</h3>
            <p className="text-gray-700 mb-3">
              Τα βασικά κόστη της πλατφόρμας περιλαμβάνουν:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Server hosting και infrastructure</li>
              <li>Domain και SSL certificates</li>
              <li>Email υπηρεσίες</li>
              <li>Backup και ασφάλεια δεδομένων</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">💚 Υποστήριξη</h3>
            <p className="text-gray-700">
              Αν θέλετε να υποστηρίξετε οικονομικά την πλατφόρμα, δείτε τη σελίδα{' '}
              <a href="/contribute" className="text-blue-600 hover:text-blue-800 underline">
                Συνεργασία
              </a>{' '}
              για περισσότερες πληροφορίες.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Τι ΔΕΝ κάνουμε</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Δεν πουλάμε διαφημιστικό χώρο</li>
              <li>Δεν πουλάμε δεδομένα χρηστών</li>
              <li>Δεν δεχόμαστε χρηματοδότηση από κόμματα ή πολιτικές οργανώσεις</li>
              <li>Δεν προωθούμε συγκεκριμένες ιδεολογικές γραμμές</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Ανοιχτός κώδικας</h2>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Ο κώδικας της πλατφόρμας είναι πλήρως ανοιχτός και διαθέσιμος στο GitHub. Αυτό σημαίνει ότι:
          </p>

          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Οποιοσδήποτε μπορεί να δει πώς λειτουργεί η πλατφόρμα</li>
            <li>Οι προγραμματιστές μπορούν να συνεισφέρουν βελτιώσεις</li>
            <li>Τα security issues μπορούν να εντοπιστούν και να διορθωθούν γρήγορα</li>
            <li>Η κοινότητα μπορεί να επαληθεύσει ότι δεν υπάρχουν backdoors ή κρυφές λειτουργίες</li>
          </ul>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Αποθετήριο GitHub</h3>
            <p className="text-gray-700 mb-3">
              Ο πλήρης κώδικας βρίσκεται στο:
            </p>
            <a 
              href="https://github.com/Antoniskp/appofasiv8" 
              className="text-blue-600 hover:text-blue-800 underline text-lg font-mono"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/Antoniskp/appofasiv8
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Προστασία δεδομένων</h2>
        
        <div className="space-y-4">
          <p className="text-gray-700 mb-3">
            Η ασφάλεια και η προστασία των δεδομένων σας είναι προτεραιότητα:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="font-semibold mb-2">🔒 Κρυπτογράφηση</h3>
              <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
                <li>HTTPS/TLS για όλες τις συνδέσεις</li>
                <li>Bcrypt για κωδικούς</li>
                <li>Ασφαλής αποθήκευση στη βάση δεδομένων</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="font-semibold mb-2">🛡️ Ασφάλεια</h3>
              <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
                <li>Τακτικά security audits</li>
                <li>Monitoring για ύποπτη δραστηριότητα</li>
                <li>Άμεση απόκριση σε incidents</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="font-semibold mb-2">💾 Backups</h3>
              <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
                <li>Καθημερινά αυτόματα backups</li>
                <li>Ασφαλής αποθήκευση σε πολλαπλές τοποθεσίες</li>
                <li>Δυνατότητα γρήγορης ανάκτησης</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="font-semibold mb-2">👁️ Ιδιωτικότητα</h3>
              <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
                <li>Ελάχιστη συλλογή δεδομένων</li>
                <li>Δεν πουλάμε δεδομένα</li>
                <li>Σεβασμός GDPR</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-700 mt-4">
            Για περισσότερες λεπτομέρειες, διαβάστε την{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
              Πολιτική Απορρήτου
            </a>.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Αναφορά προβλημάτων</h2>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Αν εντοπίσετε προβλήματα διαφάνειας, ακεραιότητας δεδομένων ή security issues, παρακαλούμε 
            αναφέρετέ τα αμέσως:
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-3">
            <div>
              <h3 className="font-semibold mb-1">🐛 Bugs & Technical Issues</h3>
              <p className="text-gray-700 text-sm">
                <a 
                  href="https://github.com/Antoniskp/appofasiv8/issues" 
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Issues
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">🔐 Security Issues</h3>
              <p className="text-gray-700 text-sm">
                Επικοινωνήστε απευθείας μέσω{' '}
                <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">
                  επικοινωνίας
                </a>{' '}
                (μην αναφέρετε δημόσια)
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">💬 Γενικές ερωτήσεις</h3>
              <p className="text-gray-700 text-sm">
                <a 
                  href="https://discord.gg/pvJftR4T98" 
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-indigo-600 text-white rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-3">Η δέσμευσή μας</h2>
        <p className="text-lg mb-4 opacity-90">
          Δεσμευόμαστε να διατηρούμε την πλατφόρμα διαφανή, ασφαλή και ανοιχτή. Αν έχετε ερωτήσεις ή 
          προτάσεις για βελτίωση της διαφάνειάς μας, θα χαρούμε να τις ακούσουμε.
        </p>
        <div className="flex flex-wrap gap-3">
          <a 
            href="/contact" 
            className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Επικοινωνήστε μαζί μας
          </a>
          <a 
            href="https://github.com/Antoniskp/appofasiv8" 
            className="bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-800 transition border-2 border-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            Δείτε τον κώδικα
          </a>
        </div>
      </section>

      <section className="text-sm text-gray-600 border-t pt-6">
        <p>
          Αυτή η σελίδα ενημερώνεται τακτικά καθώς βελτιώνουμε τις διαδικασίες και τη μεθοδολογία μας. 
          Τελευταία ενημέρωση: <strong>Φεβρουάριος 2026</strong>
        </p>
      </section>
    </StaticPageLayout>
  );
}