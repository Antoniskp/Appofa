import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata = {
  title: 'Διαφάνεια & Μεθοδολογία - Απόφαση',
  description: 'Πώς λειτουργεί η πλατφόρμα, πώς συλλέγουμε δεδομένα και πώς διασφαλίζουμε τη διαφάνεια',
};

export default function TransparencyPage() {
  return (
    <StaticPageLayout title="Διαφάνεια & Μεθοδολογία" maxWidth="max-w-4xl">
      <section>
        <p className="text-xl text-gray-700 mb-6 leading-relaxed">
          Η διαφάνεια είναι στον πυρήνα του Apofasi. Εδώ εξηγούμε λεπτομερώς πώς λειτουργεί η πλατφόρμα, 
          πώς συλλέγουμε και επεξεργαζόμαστε δεδομένα, και πώς διασφαλίζουμε την ακεραιότητα των ψηφοφοριών.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Συλλογή ειδήσεων</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Πηγές</h3>
            <p className="text-gray-700 mb-3">
              Οι ειδήσεις στην πλατφόρμα προέρχονται από:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Επίσημα μέσα ενημέρωσης:</strong> Αναγνωρισμένες εφημερίδες, ειδησεογραφικά sites 
                και τηλεοπτικά δίκτυα
              </li>
              <li>
                <strong>Ανεξάρτητα μέσα:</strong> Blogs, podcasts και εναλλακτικές πηγές ενημέρωσης
              </li>
              <li>
                <strong>Διεθνή μέσα:</strong> Αξιόπιστες διεθνείς πηγές για παγκόσμια νέα
              </li>
              <li>
                <strong>User-generated content:</strong> Άρθρα που δημιουργούν οι χρήστες της πλατφόρμας
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">Κριτήρια επιλογής πηγών</h3>
            <p className="text-gray-700 mb-2">
              Επιλέγουμε πηγές με βάση:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Αξιοπιστία και ιστορικό ακρίβειας</li>
              <li>Διαφάνεια στη χρηματοδότηση και ιδιοκτησία</li>
              <li>Δημοσιογραφική ηθική και standards</li>
              <li>Ποικιλία απόψεων και πολιτικών φάσματος</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Διαδικασία συλλογής</h3>
            <p className="text-gray-700 mb-2">
              Η συλλογή ειδήσεων γίνεται με:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Αυτόματη συλλογή:</strong> RSS feeds και web scraping από επιλεγμένες πηγές
              </li>
              <li>
                <strong>Επεξεργασία:</strong> Οι editors ελέγχουν και οργανώνουν τις ειδήσεις
              </li>
              <li>
                <strong>Κατηγοριοποίηση:</strong> Οι ειδήσεις ταξινομούνται σε κατηγορίες (Πολιτική, 
                Οικονομία, κτλ.)
              </li>
              <li>
                <strong>Δημοσίευση:</strong> Με πλήρη αναφορά στην αρχική πηγή
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">⚠️ Σημαντική σημείωση</h3>
            <p className="text-gray-700">
              Η συλλογή ειδήσεων <strong>δεν συνιστά endorsement</strong>. Παρουσιάζουμε πολλαπλές οπτικές 
              γωνίες για να βοηθήσουμε τους χρήστες να σχηματίσουν τη δική τους άποψη. Πάντα ελέγχετε τις 
              πηγές και σκεφτείτε κριτικά.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Ψηφοφορίες & Δημοσκοπήσεις</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Πώς λειτουργούν οι ψηφοφορίες</h3>
            <p className="text-gray-700 mb-3">
              Οι ψηφοφορίες στο Apofasi σχεδιάστηκαν για να καταγράφουν τη διάθεση της κοινότητας με διαφάνεια:
            </p>
            
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
              <div>
                <h4 className="font-semibold mb-1">1. Δημιουργία</h4>
                <p className="text-gray-700">
                  Οποιοσδήποτε εγγεγραμμένος χρήστης μπορεί να δημιουργήσει ψηφοφορία. Οι ψηφοφορίες 
                  ελέγχονται από moderators για να διασφαλιστεί ότι δεν παραβιάζουν τους κανόνες.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">2. Συμμετοχή</h4>
                <p className="text-gray-700">
                  Κάθε εγγεγραμμένος χρήστης μπορεί να ψηφίσει μία φορά. Η ψήφος καταγράφεται στη 
                  βάση δεδομένων με σύνδεση στο user ID για να αποτραπεί η πολλαπλή ψηφοφορία.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">3. Αποτελέσματα</h4>
                <p className="text-gray-700">
                  Τα αποτελέσματα εμφανίζονται σε πραγματικό χρόνο. Όλοι μπορούν να δουν τα ποσοστά 
                  και τον αριθμό ψήφων για κάθε επιλογή.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">🚨 Σημαντικό: Όρια των ψηφοφοριών</h3>
            <p className="text-gray-700 mb-3">
              <strong>Τα αποτελέσματα των ψηφοφοριών ΔΕΝ είναι επιστημονικά αντιπροσωπευτικά</strong> του 
              γενικού πληθυσμού. Υπάρχουν σημαντικοί περιορισμοί:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Self-selection bias:</strong> Μόνο όσοι επιλέγουν να συμμετάσχουν ψηφίζουν
              </li>
              <li>
                <strong>Demographic bias:</strong> Οι χρήστες του Apofasi μπορεί να μην αντιπροσωπεύουν 
                το σύνολο του πληθυσμού
              </li>
              <li>
                <strong>Μικρό δείγμα:</strong> Ο αριθμός ψηφοφοριών μπορεί να είναι περιορισμένος
              </li>
              <li>
                <strong>Χωρίς στάθμιση:</strong> Δεν εφαρμόζουμε στατιστική στάθμιση όπως στις 
                επαγγελματικές δημοσκοπήσεις
              </li>
            </ul>
            <p className="text-gray-700 mt-3">
              Τα αποτελέσματα δείχνουν <strong>μόνο τη διάθεση της κοινότητας του Apofasi</strong>, όχι 
              της γενικής κοινής γνώμης.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Μέτρα κατά της χειραγώγησης</h3>
            <p className="text-gray-700 mb-2">
              Για να διασφαλίσουμε την ακεραιότητα των ψηφοφοριών:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Ένας χρήστης, μία ψήφος:</strong> Η βάση δεδομένων αποτρέπει την πολλαπλή ψηφοφορία
              </li>
              <li>
                <strong>Έλεγχος λογαριασμών:</strong> Παρακολουθούμε για ύποπτη δραστηριότητα και 
                πολλαπλούς λογαριασμούς
              </li>
              <li>
                <strong>Rate limiting:</strong> Όρια στον αριθμό ψηφοφοριών που μπορεί να δημιουργήσει 
                ένας χρήστης
              </li>
              <li>
                <strong>Moderation:</strong> Οι ύποπτες ψηφοφορίες ελέγχονται από την ομάδα
              </li>
              <li>
                <strong>Διαφάνεια δεδομένων:</strong> Ο συνολικός αριθμός ψήφων είναι πάντα ορατός
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Moderation & Διαχείριση περιεχομένου</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Διαδικασία moderation</h3>
            <p className="text-gray-700 mb-3">
              Η moderation στο Apofasi γίνεται με διαφανείς κανόνες:
            </p>
            
            <ol className="list-decimal pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Αυτόματος έλεγχος:</strong> Αλγόριθμοι εντοπίζουν spam και προφανώς παραβατικό 
                περιεχόμενο
              </li>
              <li>
                <strong>Αναφορές χρηστών:</strong> Οι χρήστες μπορούν να αναφέρουν προβληματικό περιεχόμενο
              </li>
              <li>
                <strong>Ανθρώπινη αξιολόγηση:</strong> Moderators (editors & admins) ελέγχουν τις αναφορές
              </li>
              <li>
                <strong>Δράση:</strong> Προειδοποίηση, επεξεργασία, απόκρυψη ή διαγραφή περιεχομένου
              </li>
              <li>
                <strong>Ειδοποίηση:</strong> Οι χρήστες ενημερώνονται για τις ενέργειες στο περιεχόμενό τους
              </li>
            </ol>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">Κριτήρια moderation</h3>
            <p className="text-gray-700 mb-2">
              Το περιεχόμενο αφαιρέθηκε όταν:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Παραβιάζει τους <a href="/rules" className="text-blue-600 underline">Κανόνες Κοινότητας</a></li>
              <li>Περιέχει παράνομο υλικό</li>
              <li>Είναι spam ή bot-generated</li>
              <li>Παραπλανεί σκόπιμα (fake news)</li>
              <li>Παραβιάζει πνευματικά δικαιώματα</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Διαφάνεια στη moderation</h3>
            <p className="text-gray-700 mb-2">
              Για να διατηρήσουμε τη διαφάνεια:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Όλες οι αφαιρέσεις καταγράφονται στο moderation log</li>
              <li>Οι λόγοι αφαίρεσης είναι σαφείς και τεκμηριωμένοι</li>
              <li>Οι χρήστες μπορούν να ζητήσουν επανεξέταση</li>
              <li>Δημοσιεύουμε στατιστικά moderation (σύντομα)</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Ασφάλεια & Προστασία δεδομένων</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Μέτρα ασφαλείας</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🔒 Κρυπτογράφηση</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• HTTPS/TLS για όλη τη μετάδοση</li>
                  <li>• Bcrypt για κωδικούς</li>
                  <li>• Encrypted database connections</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🛡️ Authentication</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Session-based authentication</li>
                  <li>• Secure cookie handling</li>
                  <li>• CSRF protection</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🔍 Monitoring</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Real-time threat detection</li>
                  <li>• Suspicious activity alerts</li>
                  <li>• Regular security audits</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">💾 Backups</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Καθημερινά αυτόματα backups</li>
                  <li>• Encrypted backup storage</li>
                  <li>• Disaster recovery plan</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Διαχείριση δεδομένων</h3>
            <p className="text-gray-700 mb-2">
              Διαχειριζόμαστε τα δεδομένα σας με υπευθυνότητα:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Ελάχιστη συλλογή:</strong> Συλλέγουμε μόνο όσα δεδομένα χρειάζονται για τη 
                λειτουργία της πλατφόρμας
              </li>
              <li>
                <strong>Διαφάνεια:</strong> Γνωρίζετε ποια δεδομένα έχουμε (δείτε{' '}
                <a href="/privacy" className="text-blue-600 underline">Πολιτική Απορρήτου</a>)
              </li>
              <li>
                <strong>Έλεγχος:</strong> Μπορείτε να ζητήσετε εξαγωγή ή διαγραφή των δεδομένων σας
              </li>
              <li>
                <strong>Ασφάλεια:</strong> Τα δεδομένα προστατεύονται με σύγχρονες τεχνολογίες
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρηματοδότηση & Οικονομικά</h2>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">Πώς χρηματοδοτείται το Apofasi</h3>
            <p className="text-gray-700 mb-3">
              Η πλατφόρμα λειτουργεί με πλήρη διαφάνεια στη χρηματοδότηση:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Προσωπική επένδυση:</strong> Προς το παρόν, η πλατφόρμα χρηματοδοτείται από τους 
                ιδρυτές της
              </li>
              <li>
                <strong>Εθελοντική εργασία:</strong> Η ομάδα συμβάλλει εθελοντικά
              </li>
              <li>
                <strong>Δωρεές κοινότητας:</strong> Αποδεχόμαστε δωρεές από χρήστες που θέλουν να 
                υποστηρίξουν το όραμα
              </li>
              <li>
                <strong>Χωρίς διαφημίσεις:</strong> Δεν πουλάμε διαφημιστικό χώρο ούτε δεδομένα χρηστών
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Μελλοντικά μοντέλα βιωσιμότητας</h3>
            <p className="text-gray-700 mb-2">
              Εξετάζουμε διάφορες επιλογές για μακροπρόθεσμη βιωσιμότητα:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Crowdfunding:</strong> Καμπάνιες από την κοινότητα για συγκεκριμένα features
              </li>
              <li>
                <strong>Premium features:</strong> Προαιρετικές πληρωμένες λειτουργίες (π.χ. analytics)
              </li>
              <li>
                <strong>Grants:</strong> Επιδοτήσεις από οργανισμούς που υποστηρίζουν civic tech
              </li>
              <li>
                <strong>Partnerships:</strong> Συνεργασίες με ακαδημαϊκά ιδρύματα και NGOs
              </li>
            </ul>
            <p className="text-gray-700 mt-3">
              <strong>Δέσμευση:</strong> Ανεξάρτητα από το μοντέλο χρηματοδότησης, θα παραμείνουμε 
              ανεξάρτητοι και χωρίς κομματικές γραμμές.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Ανοιχτός κώδικας & Τεχνική διαφάνεια</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Open Source</h3>
            <p className="text-gray-700 mb-3">
              Ο κώδικας της πλατφόρμας είναι διαθέσιμος στο{' '}
              <a 
                href="https://github.com/Antoniskp/appofasiv8" 
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>. Αυτό σημαίνει:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Οποιοσδήποτε μπορεί να δει πώς λειτουργεί η πλατφόρμα</li>
              <li>Developers μπορούν να συνεισφέρουν βελτιώσεις</li>
              <li>Security researchers μπορούν να εντοπίσουν ευπάθειες</li>
              <li>Η κοινότητα μπορεί να επαληθεύσει ότι δεν υπάρχουν κρυφοί μηχανισμοί</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">Τεχνική αρχιτεκτονική</h3>
            <p className="text-gray-700 mb-3">
              Η πλατφόρμα είναι χτισμένη με:
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <p className="font-semibold mb-1">Frontend:</p>
                <ul className="text-sm space-y-1">
                  <li>• Next.js 14 (React)</li>
                  <li>• Tailwind CSS</li>
                  <li>• Server-side rendering</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Backend:</p>
                <ul className="text-sm space-y-1">
                  <li>• Node.js / Express</li>
                  <li>• PostgreSQL database</li>
                  <li>• RESTful API</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Συμμετοχή στην ανάπτυξη</h3>
            <p className="text-gray-700 mb-2">
              Μπορείτε να συμβάλετε τεχνικά με:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Pull requests για νέα features ή bug fixes</li>
              <li>Αναφορά bugs στο GitHub Issues</li>
              <li>Code reviews και προτάσεις βελτίωσης</li>
              <li>Τεκμηρίωση και documentation</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Δείτε περισσότερα στη σελίδα{' '}
              <a href="/contribute" className="text-blue-600 underline">Συνεργασία</a>.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Μετρήσεις & Στατιστικά</h2>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Δημοσιεύουμε τακτικά στατιστικά για τη δραστηριότητα της πλατφόρμας:
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600 mb-1">--</p>
              <p className="text-gray-700">Ενεργοί χρήστες</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600 mb-1">--</p>
              <p className="text-gray-700">Δημοσιευμένα άρθρα</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600 mb-1">--</p>
              <p className="text-gray-700">Ψηφοφορίες</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 italic">
            Τα στατιστικά ενημερώνονται μηνιαία. Σύντομα θα διατίθεται δημόσιο dashboard με live data.
          </p>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-3">Ερωτήσεις & Ανατροφοδότηση</h2>
        
        <p className="text-gray-700 mb-4">
          Έχετε ερωτήσεις σχετικά με τη μεθοδολογία μας ή προτάσεις για περισσότερη διαφάνεια;
        </p>
        
        <div className="space-y-2">
          <p className="text-gray-700">
            💬 Επικοινωνήστε μαζί μας μέσω{' '}
            <a 
              href="https://discord.gg/pvJftR4T98" 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </a>
          </p>
          <p className="text-gray-700">
            📧 Στείλτε μήνυμα στη{' '}
            <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">
              σελίδα επικοινωνίας
            </a>
          </p>
          <p className="text-gray-700">
            🐛 Ανοίξτε issue στο{' '}
            <a 
              href="https://github.com/Antoniskp/appofasiv8/issues" 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
        </div>

        <p className="text-gray-700 mt-4 font-semibold">
          Η διαφάνεια είναι ταξίδι, όχι προορισμός. Συνεχίζουμε να βελτιώνουμε και να προσθέτουμε περισσότερες 
          πληροφορίες καθώς η πλατφόρμα εξελίσσεται.
        </p>
      </section>
    </StaticPageLayout>
  );
}