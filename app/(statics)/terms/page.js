import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata = {
  title: 'Όροι Χρήσης - Απόφαση',
  description: 'Όροι και προϋποθέσεις χρήσης της πλατφόρμας Απόφαση',
};

export default function TermsPage() {
  return (
    <StaticPageLayout title="Όροι Χρήσης" maxWidth="max-w-4xl">
      <section>
        <p className="text-gray-700 mb-4">
          <strong>Τελευταία ενημέρωση:</strong> Φεβρουάριος 2026
        </p>
        <p className="text-gray-700 mb-4">
          Καλώς ήρθατε στο Apofasi (Απόφαση). Χρησιμοποιώντας την πλατφόρμα μας, συμφωνείτε με τους παρακάτω όρους 
          και προϋποθέσεις. Παρακαλούμε διαβάστε τους προσεκτικά.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">1. Αποδοχή των όρων</h2>
        
        <p className="text-gray-700 mb-4">
          Με την πρόσβαση ή τη χρήση της πλατφόρμας Apofasi, συμφωνείτε να δεσμευτείτε από τους παρόντες όρους 
          χρήσης, την πολιτική απορρήτου μας και όλους τους ισχύοντες νόμους και κανονισμούς.
        </p>
        
        <p className="text-gray-700">
          Εάν δεν συμφωνείτε με οποιονδήποτε από αυτούς τους όρους, δεν επιτρέπεται να χρησιμοποιήσετε ή να 
          αποκτήσετε πρόσβαση σε αυτόν τον ιστότοπο.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">2. Περιγραφή υπηρεσίας</h2>
        
        <p className="text-gray-700 mb-4">
          Το Apofasi είναι μια πλατφόρμα ειδήσεων και πολιτικής συμμετοχής που:
        </p>
        
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Συγκεντρώνει και οργανώνει ειδήσεις από διάφορες πηγές</li>
          <li>Επιτρέπει στους χρήστες να δημιουργούν και να μοιράζονται περιεχόμενο</li>
          <li>Διευκολύνει ψηφοφορίες και δημόσια συζήτηση</li>
          <li>Παρέχει εργαλεία για πολιτική ενημέρωση και συμμετοχή</li>
        </ul>
        
        <p className="text-gray-700 mt-4">
          Διατηρούμε το δικαίωμα να τροποποιήσουμε ή να διακόψουμε την υπηρεσία ανά πάσα στιγμή χωρίς προειδοποίηση.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">3. Λογαριασμοί χρηστών</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Εγγραφή</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Πρέπει να είστε τουλάχιστον 16 ετών για να δημιουργήσετε λογαριασμό</li>
              <li>Πρέπει να παράσχετε ακριβείς και πλήρεις πληροφορίες</li>
              <li>Είστε υπεύθυνοι για τη διατήρηση της ασφάλειας του λογαριασμού σας</li>
              <li>Ένα άτομο μπορεί να έχει μόνο έναν λογαριασμό</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Υπευθυνότητα λογαριασμού</h3>
            <p className="text-gray-700 mb-2">
              Είστε αποκλειστικά υπεύθυνοι για:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Όλες τις δραστηριότητες που πραγματοποιούνται στον λογαριασμό σας</li>
              <li>Τη διατήρηση της εμπιστευτικότητας του κωδικού σας</li>
              <li>Την άμεση ειδοποίηση για οποιαδήποτε μη εξουσιοδοτημένη χρήση</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Τύποι λογαριασμών</h3>
            <p className="text-gray-700 mb-2">
              Η πλατφόρμα διαθέτει διαφορετικούς ρόλους χρηστών:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li><strong>User:</strong> Βασικά δικαιώματα δημιουργίας περιεχομένου</li>
              <li><strong>Editor:</strong> Επιπλέον δικαιώματα επεξεργασίας</li>
              <li><strong>Admin:</strong> Πλήρη διαχειριστικά δικαιώματα</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">4. Κανόνες περιεχομένου</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Τι επιτρέπεται</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Δημιουργία άρθρων (Personal, Articles, News)</li>
              <li>Εποικοδομητικά σχόλια και συζητήσεις</li>
              <li>Ψηφοφορίες με σαφείς και νόμιμες επιλογές</li>
              <li>Κοινοποίηση πηγών και πληροφοριών με αναφορές</li>
              <li>Εκφράζετε τις απόψεις σας με σεβασμό</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Τι απαγορεύεται αυστηρά</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Απειλές, εκφοβισμός ή ρητορική μίσους</li>
              <li>Παράνομο, επιβλαβές ή προσβλητικό περιεχόμενο</li>
              <li>Spam, bot activity ή χειραγώγηση ψηφοφοριών</li>
              <li>Παραπλανητικές πληροφορίες ή σκόπιμη παραπληροφόρηση</li>
              <li>Παραβίαση πνευματικών δικαιωμάτων ή πλαστογραφία</li>
              <li>Κοινοποίηση προσωπικών δεδομένων τρίτων χωρίς συγκατάθεση</li>
              <li>Περιεχόμενο σεξουαλικής ή βίαιης φύσης</li>
              <li>Προώθηση παράνομων δραστηριοτήτων</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Ιδιοκτησία περιεχομένου</h3>
            <p className="text-gray-700 mb-2">
              Διατηρείτε όλα τα δικαιώματα στο περιεχόμενο που δημιουργείτε. Ωστόσο, παρέχοντας περιεχόμενο στο 
              Apofasi, μας παραχωρείτε μια παγκόσμια, μη αποκλειστική, χωρίς δικαιώματα άδεια να:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Εμφανίζουμε και διανέμουμε το περιεχόμενό σας στην πλατφόρμα</li>
              <li>Αποθηκεύουμε και δημιουργούμε αντίγραφα ασφαλείας</li>
              <li>Τροποποιούμε για τεχνικούς λόγους (π.χ. μορφοποίηση, μέγεθος)</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">5. Ψηφοφορίες και δημοσκοπήσεις</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Κανόνες συμμετοχής</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Μία ψήφος ανά χρήστη ανά ψηφοφορία</li>
              <li>Δεν επιτρέπεται η χειραγώγηση αποτελεσμάτων</li>
              <li>Δεν επιτρέπονται πολλαπλοί λογαριασμοί για ψηφοφορία</li>
              <li>Οι ψήφοι μπορεί να καταγράφονται για λόγους ακεραιότητας</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Ερμηνεία αποτελεσμάτων</h3>
            <p className="text-gray-700">
              Τα αποτελέσματα ψηφοφοριών στην πλατφόρμα <strong>δεν είναι επιστημονικά αντιπροσωπευτικά</strong> της 
              γενικής κοινής γνώμης. Αντικατοπτρίζουν μόνο τις απόψεις των χρηστών που συμμετείχαν. Δεν πρέπει να 
              χρησιμοποιούνται ως υποκατάστατο επαγγελματικών δημοσκοπήσεων.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">6. Moderation και επιβολή</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Δικαιώματά μας</h3>
            <p className="text-gray-700 mb-2">
              Διατηρούμε το δικαίωμα, αλλά όχι την υποχρέωση, να:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Αφαιρούμε ή επεξεργαζόμαστε περιεχόμενο που παραβιάζει τους όρους</li>
              <li>Αναστέλλουμε ή τερματίζουμε λογαριασμούς</li>
              <li>Αλλάζουμε ή διαγράφουμε περιεχόμενο για τεχνικούς λόγους</li>
              <li>Ερευνούμε παραβιάσεις και συνεργαζόμαστε με τις αρχές</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Κυρώσεις</h3>
            <p className="text-gray-700 mb-2">
              Παραβιάσεις των όρων μπορεί να οδηγήσουν σε:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Προειδοποίηση</li>
              <li>Προσωρινή αναστολή</li>
              <li>Μόνιμη απαγόρευση</li>
              <li>Νομικά μέτρα σε σοβαρές περιπτώσεις</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Αναφορές</h3>
            <p className="text-gray-700">
              Ενθαρρύνουμε τους χρήστες να αναφέρουν παραβατικό περιεχόμενο. Όλες οι αναφορές θα εξεταστούν, 
              αλλά δεν εγγυόμαστε συγκεκριμένες δράσεις.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">7. Πνευματικά δικαιώματα</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Σεβασμός πνευματικών δικαιωμάτων</h3>
            <p className="text-gray-700">
              Σεβόμαστε τα δικαιώματα πνευματικής ιδιοκτησίας. Εάν πιστεύετε ότι το περιεχόμενό σας έχει αντιγραφεί 
              με τρόπο που συνιστά παραβίαση δικαιωμάτων, επικοινωνήστε μαζί μας.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">DMCA και καταγγελίες</h3>
            <p className="text-gray-700 mb-2">
              Για να υποβάλετε καταγγελία για παραβίαση πνευματικών δικαιωμάτων, παρέχετε:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Υπογραφή του κατόχου των δικαιωμάτων</li>
              <li>Περιγραφή του προστατευόμενου έργου</li>
              <li>Τοποθεσία του παραβατικού υλικού</li>
              <li>Στοιχεία επικοινωνίας σας</li>
              <li>Δήλωση καλής πίστης</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">8. Αποποίηση ευθυνών</h2>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Παροχή υπηρεσίας "ως έχει"</h3>
            <p className="text-gray-700">
              Η υπηρεσία παρέχεται "ως έχει" και "όπως είναι διαθέσιμη" χωρίς εγγυήσεις οποιουδήποτε είδους, 
              ρητές ή σιωπηρές.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Καμία εγγύηση</h3>
            <p className="text-gray-700 mb-2">
              Δεν εγγυόμαστε ότι:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Η υπηρεσία θα είναι αδιάκοπη ή χωρίς σφάλματα</li>
              <li>Τα αποτελέσματα θα είναι ακριβή ή αξιόπιστα</li>
              <li>Η ποιότητα των υπηρεσιών θα ανταποκρίνεται στις προσδοκίες σας</li>
              <li>Τυχόν σφάλματα θα διορθωθούν</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Περιεχόμενο τρίτων</h3>
            <p className="text-gray-700">
              Δεν είμαστε υπεύθυνοι για την ακρίβεια, νομιμότητα ή καταλληλότητα του περιεχομένου που δημιουργείται 
              από χρήστες ή συγκεντρώνεται από εξωτερικές πηγές.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">9. Περιορισμός ευθύνης</h2>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            Σε καμία περίπτωση το Apofasi, οι ιδιοκτήτες, οι υπάλληλοι ή οι συνεργάτες του δεν θα είναι υπεύθυνοι για:
          </p>
          
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Έμμεσες, τυχαίες, ειδικές ή αποθετικές ζημίες</li>
            <li>Απώλεια κερδών, δεδομένων ή καλής φήμης</li>
            <li>Διακοπή εργασίας ή αντικατάσταση υπηρεσιών</li>
            <li>Ζημίες που προκύπτουν από τη χρήση ή την αδυναμία χρήσης της υπηρεσίας</li>
            <li>Μη εξουσιοδοτημένη πρόσβαση ή αλλοίωση των δεδομένων σας</li>
          </ul>

          <p className="text-gray-700 mt-4">
            Η μέγιστη ευθύνη μας, για οποιονδήποτε λόγο, περιορίζεται στο ποσό που καταβάλατε (εάν υπάρχει) για 
            τη χρήση της υπηρεσίας τους τελευταίους 12 μήνες.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">10. Αποζημίωση</h2>
        
        <p className="text-gray-700">
          Συμφωνείτε να αποζημιώσετε και να υπερασπιστείτε το Apofasi, τους ιδιοκτήτες, υπαλλήλους και συνεργάτες 
          του από οποιεσδήποτε αξιώσεις, ζημίες, υποχρεώσεις και έξοδα (συμπεριλαμβανομένων των δικηγορικών αμοιβών) 
          που προκύπτουν από:
        </p>
        
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
          <li>Τη χρήση ή κατάχρηση της υπηρεσίας</li>
          <li>Την παραβίαση αυτών των όρων</li>
          <li>Την παραβίαση δικαιωμάτων τρίτων</li>
          <li>Το περιεχόμενο που υποβάλλετε</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">11. Τερματισμός</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Από εσάς</h3>
            <p className="text-gray-700">
              Μπορείτε να διακόψετε τη χρήση της υπηρεσίας ανά πάσα στιγμή διαγράφοντας τον λογαριασμό σας.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Από εμάς</h3>
            <p className="text-gray-700 mb-2">
              Μπορούμε να τερματίσουμε ή να αναστείλουμε την πρόσβασή σας αμέσως, χωρίς προειδοποίηση, για:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Παραβίαση των όρων χρήσης</li>
              <li>Αίτησή σας</li>
              <li>Νομικούς ή ρυθμιστικούς λόγους</li>
              <li>Διακοπή της υπηρεσίας</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Συνέπειες τερματισμού</h3>
            <p className="text-gray-700">
              Μετά τον τερματισμό, το δικαίωμά σας να χρησιμοποιείτε την υπηρεσία θα παύσει αμέσως. Μπορούμε να 
              διατηρήσουμε ή να διαγράψουμε το περιεχόμενό σας σύμφωνα με την πολιτική απορρήτου μας.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">12. Εφαρμοστέο δίκαιο</h2>
        
        <p className="text-gray-700">
          Οι παρόντες όροι διέπονται και ερμηνεύονται σύμφωνα με τους νόμους της Ελληνικής Δημοκρατίας, χωρίς να 
          λαμβάνονται υπόψη οι διατάξεις σύγκρουσης νόμων.
        </p>
        
        <p className="text-gray-700 mt-4">
          Οποιαδήποτε νομική ενέργεια ή διαδικασία που σχετίζεται με την πρόσβασή σας στην υπηρεσία θα υπάγεται 
          στην αποκλειστική δικαιοδοσία των δικαστηρίων της Ελλάδας.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">13. Αλλαγές στους όρους</h2>
        
        <p className="text-gray-700 mb-4">
          Διατηρούμε το δικαίωμα να τροποποιούμε αυτούς τους όρους ανά πάσα στιγμή. Θα ειδοποιήσουμε τους χρήστες 
          για ουσιώδεις αλλαγές μέσω:
        </p>
        
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Ειδοποίησης στην πλατφόρμα</li>
          <li>Email (εάν έχετε παράσχει)</li>
          <li>Ενημέρωσης της ημερομηνίας "Τελευταία ενημέρωση"</li>
        </ul>
        
        <p className="text-gray-700 mt-4">
          Η συνέχιση της χρήσης της υπηρεσίας μετά από αλλαγές συνιστά αποδοχή των νέων όρων.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">14. Διάφορες διατάξεις</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Ολόκληρη συμφωνία</h3>
            <p className="text-gray-700">
              Οι όροι αυτοί, μαζί με την πολιτική απορρήτου, αποτελούν την πλήρη συμφωνία μεταξύ σας και του Apofasi.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Διαχωρισιμότητα</h3>
            <p className="text-gray-700">
              Εάν οποιαδήποτε διάταξη κριθεί άκυρη, οι υπόλοιπες διατάξεις θα παραμείνουν σε πλήρη ισχύ.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Μη παραίτηση</h3>
            <p className="text-gray-700">
              Η μη επιβολή οποιουδήποτε δικαιώματος ή διάταξης δεν συνιστά παραίτηση από αυτό το δικαίωμα.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">Εκχώρηση</h3>
            <p className="text-gray-700">
              Δεν μπορείτε να εκχωρήσετε αυτούς τους όρους χωρίς τη συγκατάθεσή μας. Μπορούμε να εκχωρήσουμε τα 
              δικαιώματά μας ανά πάσα στιγμή.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-3">15. Επικοινωνία</h2>
        
        <p className="text-gray-700 mb-4">
          Για ερωτήσεις σχετικά με αυτούς τους όρους, επικοινωνήστε μαζί μας:
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
      </section>

      <section className="text-sm text-gray-600 border-t pt-6">
        <p className="mb-3">
          Χρησιμοποιώντας το Apofasi, αναγνωρίζετε ότι έχετε διαβάσει και κατανοήσει αυτούς τους όρους και 
          συμφωνείτε να δεσμευτείτε από αυτούς.
        </p>
        <p>
          Για περισσότερες πληροφορίες σχετικά με τη διαχείριση των δεδομένων σας, δείτε την{' '}
          <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
            Πολιτική Απορρήτου
          </a>.
        </p>
      </section>
    </StaticPageLayout>
  );
}