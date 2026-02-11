import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata = {
  title: 'Πολιτική Απορρήτου - Απόφαση',
  description: 'Πώς συλλέγουμε, χρησιμοποιούμε και προστατεύουμε τα προσωπικά σας δεδομένα',
};

export default function PrivacyPage() {
  return (
    <StaticPageLayout title="Πολιτική Απορρήτου" maxWidth="max-w-4xl">
      <section>
        <p className="text-gray-700 mb-4">
          <strong>Τελευταία ενημέρωση:</strong> Φεβρουάριος 2026
        </p>
        <p className="text-gray-700 mb-4">
          Στο Apofasi, σεβόμαστε την ιδιωτικότητά σας και δεσμευόμαστε να προστατεύουμε τα προσωπικά σας δεδομένα. 
          Αυτή η πολιτική απορρήτου εξηγεί ποιες πληροφορίες συλλέγουμε, πώς τις χρησιμοποιούμε και ποια δικαιώματα έχετε.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">1. Πληροφορίες που συλλέγουμε</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Πληροφορίες λογαριασμού</h3>
            <p className="text-gray-700 mb-2">Όταν δημιουργείτε λογαριασμό, συλλέγουμε:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Όνομα χρήστη</li>
              <li>Διεύθυνση email</li>
              <li>Κρυπτογραφημένο κωδικό πρόσβασης</li>
              <li>Ρόλο χρήστη (user, editor, admin)</li>
              <li>Ημερομηνία δημιουργίας λογαριασμού</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Περιεχόμενο που δημιουργείτε</h3>
            <p className="text-gray-700 mb-2">Αποθηκεύουμε το περιεχόμενο που δημοσιεύετε:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Άρθρα (personal, articles, news)</li>
              <li>Σχόλια και συζητήσεις</li>
              <li>Ψηφοφορίες που δημιουργείτε</li>
              <li>Συμμετοχή σε ψηφοφορίες</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Δεδομένα χρήσης</h3>
            <p className="text-gray-700 mb-2">Συλλέγουμε αυτόματα:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Διεύθυνση IP</li>
              <li>Τύπος browser και λειτουργικό σύστημα</li>
              <li>Σελίδες που επισκέπτεστε</li>
              <li>Ημερομηνία και ώρα πρόσβασης</li>
              <li>Cookies και παρόμοιες τεχνολογίες</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">2. Πώς χρησιμοποιούμε τις πληροφορίες σας</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Παροχή και βελτίωση υπηρεσιών</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Λειτουργία της πλατφόρμας και των λειτουργιών της</li>
              <li>Εξατομίκευση της εμπειρίας σας</li>
              <li>Ανάλυση τάσεων και βελτίωση του περιεχομένου</li>
              <li>Διαχείριση ψηφοφοριών και αποτελεσμάτων</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Επικοινωνία</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Αποστολή ειδοποιήσεων σχετικά με τον λογαριασμό σας</li>
              <li>Απάντηση σε αιτήματα υποστήριξης</li>
              <li>Ενημερώσεις για αλλαγές στην πλατφόρμα (με τη συγκατάθεσή σας)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Ασφάλεια και πρόληψη κατάχρησης</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Προστασία από spam και κακόβουλη δραστηριότητα</li>
              <li>Εντοπισμός και πρόληψη απάτης</li>
              <li>Επιβολή των κανόνων της κοινότητας</li>
              <li>Διασφάλιση της ακεραιότητας των ψηφοφοριών</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">3. Κοινοποίηση πληροφοριών</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Δημόσιο περιεχόμενο</h3>
            <p className="text-gray-700">
              Το περιεχόμενο που δημοσιεύετε (άρθρα, σχόλια, ψηφοφορίες) είναι δημόσιο και ορατό από όλους τους χρήστες. 
              Το όνομα χρήστη σας συνδέεται με το δημόσιο περιεχόμενο που δημιουργείτε.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Παροχείς υπηρεσιών</h3>
            <p className="text-gray-700 mb-2">
              Μπορεί να κοινοποιήσουμε δεδομένα σε αξιόπιστους παροχείς που μας βοηθούν να λειτουργούμε:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Υπηρεσίες hosting και cloud infrastructure</li>
              <li>Υπηρεσίες email</li>
              <li>Εργαλεία ανάλυσης και monitoring</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Όλοι οι πάροχοι δεσμεύονται συμβατικά να προστατεύουν τα δεδομένα σας.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Νομικές υποχρεώσεις</h3>
            <p className="text-gray-700">
              Μπορεί να αποκαλύψουμε πληροφορίες όταν απαιτείται από το νόμο ή για να προστατεύσουμε τα δικαιώματα, 
              την ασφάλεια ή την ιδιοκτησία του Apofasi και των χρηστών του.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">4. Cookies και τεχνολογίες παρακολούθησης</h2>
        
        <p className="text-gray-700 mb-4">
          Χρησιμοποιούμε cookies και παρόμοιες τεχνολογίες για:
        </p>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Απαραίτητα cookies</h3>
            <p className="text-gray-700">
              Απαιτούνται για τη λειτουργία της πλατφόρμας (π.χ. διατήρηση σύνδεσης, ρυθμίσεις ασφάλειας).
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Cookies λειτουργικότητας</h3>
            <p className="text-gray-700">
              Αποθηκεύουν τις προτιμήσεις σας (π.χ. γλώσσα, θέμα εμφάνισης).
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Cookies ανάλυσης</h3>
            <p className="text-gray-700">
              Μας βοηθούν να καταλάβουμε πώς χρησιμοποιείτε την πλατφόρμα για να τη βελτιώσουμε.
            </p>
          </div>
        </div>

        <p className="text-gray-700 mt-4">
          Μπορείτε να ελέγξετε τα cookies μέσω των ρυθμίσεων του browser σας, αλλά η απενεργοποίηση ορισμένων 
          cookies μπορεί να επηρεάσει τη λειτουργικότητα της πλατφόρμας.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">5. Ασφάλεια δεδομένων</h2>
        
        <p className="text-gray-700 mb-4">
          Λαμβάνουμε σοβαρά μέτρα για την προστασία των δεδομένων σας:
        </p>
        
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Κρυπτογράφηση δεδομένων κατά τη μετάδοση (HTTPS/TLS)</li>
          <li>Ασφαλής αποθήκευση κωδικών με bcrypt hashing</li>
          <li>Τακτικά security audits και ενημερώσεις</li>
          <li>Περιορισμένη πρόσβαση στα δεδομένα μόνο από εξουσιοδοτημένο προσωπικό</li>
          <li>Monitoring για ανίχνευση ύποπτης δραστηριότητας</li>
          <li>Τακτικά backups για αποφυγή απώλειας δεδομένων</li>
        </ul>

        <p className="text-gray-700 mt-4">
          Παρόλα αυτά, καμία μέθοδος μετάδοσης στο διαδίκτυο δεν είναι 100% ασφαλής. Δεσμευόμαστε να 
          χρησιμοποιούμε εμπορικά αποδεκτά μέσα προστασίας, αλλά δεν μπορούμε να εγγυηθούμε απόλυτη ασφάλεια.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">6. Τα δικαιώματά σας</h2>
        
        <p className="text-gray-700 mb-4">
          Έχετε τα ακόλουθα δικαιώματα σχετικά με τα προσωπικά σας δεδομένα:
        </p>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Πρόσβαση και φορητότητα</h3>
            <p className="text-gray-700">
              Μπορείτε να ζητήσετε αντίγραφο των προσωπικών δεδομένων που έχουμε για εσάς.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Διόρθωση</h3>
            <p className="text-gray-700">
              Μπορείτε να ενημερώσετε ή να διορθώσετε ανακριβείς πληροφορίες μέσω των ρυθμίσεων λογαριασμού.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Διαγραφή</h3>
            <p className="text-gray-700">
              Μπορείτε να ζητήσετε τη διαγραφή του λογαριασμού και των δεδομένων σας. Σημειώστε ότι ορισμένα 
              δημόσια περιεχόμενα μπορεί να διατηρηθούν για λόγους ιστορικού ή νομικούς λόγους.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Περιορισμός επεξεργασίας</h3>
            <p className="text-gray-700">
              Μπορείτε να ζητήσετε να περιορίσουμε την επεξεργασία των δεδομένων σας υπό ορισμένες συνθήκες.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Εναντίωση</h3>
            <p className="text-gray-700">
              Μπορείτε να αντιταχθείτε στην επεξεργασία των δεδομένων σας για συγκεκριμένους σκοπούς.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Ανάκληση συγκατάθεσης</h3>
            <p className="text-gray-700">
              Όπου η επεξεργασία βασίζεται στη συγκατάθεσή σας, μπορείτε να την ανακαλέσετε ανά πάσα στιγμή.
            </p>
          </div>
        </div>

        <p className="text-gray-700 mt-4">
          Για να ασκήσετε οποιοδήποτε από αυτά τα δικαιώματα, επικοινωνήστε μαζί μας μέσω της{' '}
          <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">
            σελίδας επικοινωνίας
          </a>.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">7. Διατήρηση δεδομένων</h2>
        
        <p className="text-gray-700 mb-4">
          Διατηρούμε τα προσωπικά σας δεδομένα όσο διάστημα είναι απαραίτητο για:
        </p>
        
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Την παροχή των υπηρεσιών μας</li>
          <li>Τη συμμόρφωση με νομικές υποχρεώσεις</li>
          <li>Την επίλυση διαφορών</li>
          <li>Την επιβολή των συμφωνιών μας</li>
        </ul>

        <p className="text-gray-700 mt-4">
          Όταν διαγράψετε τον λογαριασμό σας, θα διαγράψουμε ή θα ανωνυμοποιήσουμε τα προσωπικά σας δεδομένα, 
          εκτός εάν απαιτείται η διατήρησή τους για νόμιμους λόγους.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">8. Παιδιά</h2>
        
        <p className="text-gray-700">
          Οι υπηρεσίες μας δεν απευθύνονται σε άτομα κάτω των 16 ετών. Δεν συλλέγουμε εν γνώσει μας προσωπικά 
          δεδομένα από παιδιά. Εάν είστε γονέας ή κηδεμόνας και πιστεύετε ότι το παιδί σας μας έχει παράσχει 
          προσωπικά δεδομένα, επικοινωνήστε μαζί μας για να διαγράψουμε τις πληροφορίες.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">9. Διεθνείς μεταφορές δεδομένων</h2>
        
        <p className="text-gray-700">
          Τα δεδομένα σας μπορεί να αποθηκευτούν και να υποβληθούν σε επεξεργασία σε servers που βρίσκονται εκτός 
          της χώρας σας. Διασφαλίζουμε ότι οι μεταφορές αυτές πραγματοποιούνται με ασφάλεια και σύμφωνα με τους 
          ισχύοντες κανονισμούς προστασίας δεδομένων.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">10. Αλλαγές σε αυτή την πολιτική</h2>
        
        <p className="text-gray-700 mb-4">
          Μπορεί να ενημερώσουμε την πολιτική απορρήτου μας περιστασιακά. Θα σας ειδοποιήσουμε για τυχόν αλλαγές 
          δημοσιεύοντας τη νέα πολιτική σε αυτή τη σελίδα και ενημερώνοντας την ημερομηνία "Τελευταία ενημέρωση".
        </p>
        
        <p className="text-gray-700">
          Για σημαντικές αλλαγές, θα σας ειδοποιήσουμε πιο εμφανώς (π.χ. μέσω email ή ειδοποίησης στην πλατφόρμα).
          Σας ενθαρρύνουμε να ελέγχετε περιοδικά αυτή τη σελίδα για ενημερώσεις.
        </p>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-3">11. Επικοινωνία</h2>
        
        <p className="text-gray-700 mb-4">
          Για ερωτήσεις ή ανησυχίες σχετικά με αυτή την πολιτική απορρήτου ή την επεξεργασία των δεδομένων σας, 
          επικοινωνήστε μαζί μας:
        </p>
        
        <div className="space-y-2 text-gray-700">
          <p>
            <strong>Μέσω Discord:</strong>{' '}
            <a 
              href="https://discord.gg/pvJftR4T98" 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://discord.gg/pvJftR4T98
            </a>
          </p>
          <p>
            <strong>Σελίδα επικοινωνίας:</strong>{' '}
            <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">
              /contact
            </a>
          </p>
        </div>

        <p className="text-gray-700 mt-4">
          Θα απαντήσουμε στο αίτημά σας εντός 30 ημερών.
        </p>
      </section>

      <section className="text-sm text-gray-600 border-t pt-6">
        <p>
          Αυτή η πολιτική απορρήτου ισχύει για την πλατφόρμα Apofasi (Απόφαση) και όλες τις σχετικές υπηρεσίες. 
          Διαβάζοντας και χρησιμοποιώντας την πλατφόρμα μας, συμφωνείτε με τους όρους αυτής της πολιτικής.
        </p>
      </section>
    </StaticPageLayout>
  );
}