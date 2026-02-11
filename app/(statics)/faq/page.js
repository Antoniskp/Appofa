import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata = {
  title: 'Συχνές Ερωτήσεις - Απόφαση',
  description: 'Απαντήσεις σε συχνές ερωτήσεις για την πλατφόρμα Απόφαση',
};

export default function FAQPage() {
  return (
    <StaticPageLayout title="Συχνές Ερωτήσεις (FAQ)" maxWidth="max-w-4xl">
      <section>
        <p className="text-gray-700 mb-6">
          Βρείτε απαντήσεις στις πιο συχνές ερωτήσεις σχετικά με τη χρήση της πλατφόρμας Apofasi.
        </p>
      </section>

      {/* Getting Started */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Ξεκινώντας</h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Τι είναι το Apofasi;</h3>
            <p className="text-gray-700">
              Το Apofasi (Απόφαση) είναι μια πλατφόρμα ειδήσεων και πολιτικής συμμετοχής που συγκεντρώνει ειδήσεις 
              από διάφορες πηγές, επιτρέπει στους χρήστες να δημιουργούν περιεχόμενο και να συμμετέχουν σε ψηφοφορίες 
              για να εκφράσουν τις απόψεις τους σε επίκαιρα θέματα.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς δημιουργώ λογαριασμό;</h3>
            <p className="text-gray-700 mb-2">
              Για να δημιουργήσετε λογαριασμό:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 space-y-1">
              <li>Κάντε κλικ στο κουμπί "Εγγραφή" στην κεντρική σελίδα</li>
              <li>Συμπληρώστε το όνομα χρήστη, email και κωδικό</li>
              <li>Αποδεχτείτε τους όρους χρήσης</li>
              <li>Πατήστε "Δημιουργία λογαριασμού"</li>
            </ol>
            <p className="text-gray-700 mt-2">
              Πρέπει να είστε τουλάχιστον 16 ετών για να δημιουργήσετε λογαριασμό.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Είναι δωρεάν η χρήση της πλατφόρμας;</h3>
            <p className="text-gray-700">
              Ναι, το Apofasi είναι εντελώς δωρεάν. Μπορείτε να διαβάζετε ειδήσεις, να δημιουργείτε περιεχόμενο και 
              να συμμετέχετε σε ψηφοφορίες χωρίς καμία χρέωση. Αν θέλετε να υποστηρίξετε την πλατφόρμα, μπορείτε να 
              δείτε τις επιλογές στη σελίδα{' '}
              <a href="/contribute" className="text-blue-600 hover:text-blue-800 underline">Συνεργασία</a>.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Τι είδη περιεχομένου μπορώ να δημιουργήσω;</h3>
            <p className="text-gray-700 mb-2">
              Η πλατφόρμα υποστηρίζει τρεις τύπους περιεχομένου:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Personal:</strong> Προσωπικά άρθρα και απόψεις που μόνο εσείς μπορείτε να επεξεργαστείτε</li>
              <li><strong>Articles:</strong> Συνεργατικά άρθρα που οι editors μπορούν να βελτιώσουν</li>
              <li><strong>News:</strong> Επίσημες ειδήσεις που μπορούν να επεξεργαστούν μόνο admins και editors</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Articles & Content */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Άρθρα & Περιεχόμενο</h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς δημιουργώ ένα άρθρο;</h3>
            <p className="text-gray-700 mb-2">
              Για να δημιουργήσετε άρθρο:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 space-y-1">
              <li>Συνδεθείτε στον λογαριασμό σας</li>
              <li>Πατήστε "Δημιουργία Άρθρου"</li>
              <li>Επιλέξτε τον τύπο άρθρου (Personal, Articles, News)</li>
              <li>Συμπληρώστε τον τίτλο, κατηγορία και περιεχόμενο</li>
              <li>Προαιρετικά προσθέστε υπότιτλο, εικόνα και πηγή</li>
              <li>Επιλέξτε "Δημοσίευση" ή "Πρόχειρο"</li>
            </ol>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Μπορώ να επεξεργαστώ ένα άρθρο αφού το δημοσιεύσω;</h3>
            <p className="text-gray-700">
              Ναι! Μπορείτε πάντα να επεξεργαστείτε τα δικά σας άρθρα. Για άρθρα τύπου "Articles", οι editors μπορούν 
              επίσης να κάνουν επεξεργασία για να βελτιώσουν την ποιότητα. Τα άρθρα τύπου "News" μπορούν να 
              επεξεργαστούν μόνο από admins και editors.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Μπορώ να διαγράψω ένα άρθρο μου;</h3>
            <p className="text-gray-700">
              Ναι, μπορείτε να διαγράψετε τα δικά σας άρθρα ανά πάσα στιγμή. Σημειώστε ότι η διαγραφή είναι μόνιμη 
              και δεν μπορεί να αναιρεθεί. Οι admins έχουν επίσης δικαίωμα να διαγράψουν άρθρα που παραβιάζουν τους 
              κανόνες της κοινότητας.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς προσθέτω εικόνες στο άρθρο μου;</h3>
            <p className="text-gray-700 mb-2">
              Μπορείτε να προσθέσετε εικόνες με δύο τρόπους:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Κύρια εικόνα:</strong> Χρησιμοποιήστε το πεδίο "Image URL" για να ορίσετε μια εικόνα που θα εμφανίζεται στην κορυφή</li>
              <li><strong>Εικόνες στο κείμενο:</strong> Χρησιμοποιήστε HTML tags μέσα στο περιεχόμενο:
                <code className="block bg-gray-100 p-2 rounded mt-2 text-sm">
                  {'<img src="https://example.com/image.jpg" alt="Περιγραφή" />'}
                </code>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Τι είναι το "Πρόχειρο" (Draft);</h3>
            <p className="text-gray-700">
              Τα πρόχειρα άρθρα είναι άρθρα που έχετε αποθηκεύσει αλλά δεν έχουν δημοσιευτεί ακόμα. Μόνο εσείς μπορείτε 
              να τα δείτε και να τα επεξεργαστείτε. Όταν είστε έτοιμοι, μπορείτε να τα δημοσιεύσετε και να γίνουν ορατά 
              σε όλους.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Ποιες κατηγορίες άρθρων υπάρχουν;</h3>
            <p className="text-gray-700 mb-2">
              Όταν δημιουργείτε άρθρο, μπορείτε να επιλέξετε από τις ακόλουθες κατηγορίες:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Πολιτική</li>
              <li>Οικονομία</li>
              <li>Κοινωνία</li>
              <li>Διεθνή</li>
              <li>Περιβάλλον</li>
              <li>Τεχνολογία</li>
              <li>Πολιτισμός</li>
              <li>Αθλητικά</li>
              <li>Υγεία</li>
              <li>Εκπαίδευση</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Polls & Voting */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Ψηφοφορίες</h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς λειτουργούν οι ψηφοφορίες;</h3>
            <p className="text-gray-700">
              Οι ψηφοφορίες επιτρέπουν στους χρήστες να εκφράσουν την άποψή τους σε διάφορα θέματα. Κάθε χρήστης 
              μπορεί να ψηφίσει μία φορά ανά ψηφοφορία. Τα αποτελέσματα εμφανίζονται σε πραγματικό χρόνο και 
              δείχνουν τη διάθεση της κοινότητας που συμμετέχει.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Μπορώ να δημιουργήσω τη δική μου ψηφοφορία;</h3>
            <p className="text-gray-700">
              Ναι, όλοι οι εγγεγραμμένοι χρήστες μπορούν να δημιουργήσουν ψηφοφορίες. Απλά δημιουργήστε μια νέα 
              ψηφοφορία, ορίστε την ερώτηση και τις επιλογές απάντησης, και δημοσιεύστε την.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Μπορώ να αλλάξω την ψήφο μου;</h3>
            <p className="text-gray-700">
              Αυτό εξαρτάται από τις ρυθμίσεις της ψηφοφορίας. Ορισμένες ψηφοφορίες επιτρέπουν την αλλαγή ψήφου, 
              ενώ άλλες όχι. Ελέγξτε τις λεπτομέρειες της κάθε ψηφοφορίας για να δείτε εάν μπορείτε να αλλάξετε 
              την ψήφο σας.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Είναι ανώνυμες οι ψήφοι μου;</h3>
            <p className="text-gray-700">
              Οι ψήφοι σας είναι ιδιωτικές και δεν εμφανίζονται δημόσια. Ωστόσο, η πλατφόρμα καταγράφει τη ψήφο 
              σας για να αποτρέψει την πολλαπλή ψηφοφορία και να διασφαλίσει την ακεραιότητα των αποτελεσμάτων.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Είναι τα αποτελέσματα των ψηφοφοριών επιστημονικά αντιπροσωπευτικά;</h3>
            <p className="text-gray-700">
              <strong>Όχι.</strong> Τα αποτελέσματα των ψηφοφοριών αντικατοπτρίζουν μόνο τις απόψεις των χρηστών 
              που συμμετείχαν στην πλατφόρμα. Δεν είναι επιστημονικές δημοσκοπήσεις και δεν πρέπει να ερμηνεύονται 
              ως αντιπροσωπευτικές του γενικού πληθυσμού. Χρησιμεύουν ως ένδειξη της διάθεσης της κοινότητας μας.
            </p>
          </div>
        </div>
      </section>

      {/* User Roles */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Ρόλοι Χρηστών</h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Ποιοι είναι οι διαφορετικοί ρόλοι χρηστών;</h3>
            <p className="text-gray-700 mb-3">
              Υπάρχουν τρεις ρόλοι χρηστών:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>User:</strong> Βασικός ρόλος με δικαιώματα δημιουργίας Personal και Articles άρθρων</li>
              <li><strong>Editor:</strong> Μπορεί να επεξεργάζεται όλα τα άρθρα και να δημιουργεί News</li>
              <li><strong>Admin:</strong> Πλήρη διαχειριστικά δικαιώματα, συμπεριλαμβανομένης της διαγραφής άρθρων και της διαχείρισης χρηστών</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς μπορώ να γίνω Editor;</h3>
            <p className="text-gray-700">
              Οι editors επιλέγονται με βάση τη συμβολή τους στην κοινότητα, την ποιότητα του περιεχόμενου που 
              δημιουργούν και τη συνέπειά τους. Αν ενδιαφέρεστε να γίνετε editor, επικοινωνήστε μαζί μας μέσω της 
              σελίδας{' '}
              <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">Επικοινωνία</a> ή του Discord.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Τι μπορεί να κάνει ένας Editor;</h3>
            <p className="text-gray-700 mb-2">
              Οι editors έχουν τα ακόλουθα δικαιώματα:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Επεξεργασία όλων των άρθρων (εκτός Personal άρθρων άλλων χρηστών)</li>
              <li>Δημιουργία News άρθρων</li>
              <li>Βελτίωση της ποιότητας του περιεχομένου</li>
              <li>Moderation σχολίων και συζητήσεων</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Account & Privacy */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Λογαριασμός & Ιδιωτικότητα</h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς μπορώ να αλλάξω τον κωδικό μου;</h3>
            <p className="text-gray-700">
              Μεταβείτε στις ρυθμίσεις του λογαριασμού σας και επιλέξτε "Αλλαγή Κωδικού". Θα χρειαστεί να εισάγετε 
              τον τρέχοντα κωδικό σας και στη συνέχεια τον νέο κωδικό δύο φορές για επιβεβαίωση.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Μπορώ να διαγράψω τον λογαριασμό μου;</h3>
            <p className="text-gray-700">
              Ναι, μπορείτε να διαγράψετε τον λογαριασμό σας ανά πάσα στιγμή. Επικοινωνήστε μαζί μας μέσω της 
              σελίδας{' '}
              <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">Επικοινωνία</a> για να ζητήσετε 
              διαγραφή. Σημειώστε ότι αυτή η ενέργεια είναι μόνιμη και ορισμένο δημόσιο περιεχόμενο μπορεί να 
              διατηρηθεί για ιστορικούς λόγους.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Ποιες πληροφορίες συλλέγετε;</h3>
            <p className="text-gray-700">
              Συλλέγουμε μόνο τις απαραίτητες πληροφορίες: όνομα χρήστη, email, κωδικό (κρυπτογραφημένο) και το 
              περιεχόμενο που δημιουργείτε. Για περισσότερες λεπτομέρειες, διαβάστε την{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">Πολιτική Απορρήτου</a>.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Είναι ασφαλή τα δεδομένα μου;</h3>
            <p className="text-gray-700">
              Ναι. Χρησιμοποιούμε σύγχρονες τεχνολογίες ασφαλείας, συμπεριλαμβανομένης της κρυπτογράφησης HTTPS/TLS 
              και του bcrypt hashing για κωδικούς. Δεν αποθηκεύουμε ποτέ κωδικούς σε απλό κείμενο.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Μοιράζεστε τα δεδομένα μου με τρίτους;</h3>
            <p className="text-gray-700">
              Όχι. Δεν πουλάμε ούτε μοιραζόμαστε τα προσωπικά σας δεδομένα με τρίτους για εμπορικούς σκοπούς. 
              Χρησιμοποιούμε μόνο αξιόπιστους παροχείς υπηρεσιών (hosting, email) που τηρούν υψηλά πρότυπα ασφαλείας.
            </p>
          </div>
        </div>
      </section>

      {/* Technical & Troubleshooting */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Τεχνικά & Αντιμετώπιση Προβλημάτων</h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Δεν μπορώ να συνδεθώ. Τι να κάνω;</h3>
            <p className="text-gray-700 mb-2">
              Αν αντιμετωπίζετε πρόβλημα σύνδεσης:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 space-y-1">
              <li>Ελέγξτε ότι το όνομα χρήστη και ο κωδικός είναι σωστά</li>
              <li>Βεβαιωθείτε ότι το Caps Lock είναι απενεργοποιημένο</li>
              <li>Δοκιμάστε να επαναφέρετε τον κωδικό σας</li>
              <li>Καθαρίστε τα cookies και την cache του browser</li>
              <li>Δοκιμάστε με διαφορετικό browser</li>
            </ol>
            <p className="text-gray-700 mt-2">
              Αν το πρόβλημα συνεχίζεται, επικοινωνήστε μαζί μας.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Η πλατφόρμα είναι αργή. Γιατί;</h3>
            <p className="text-gray-700">
              Η απόδοση μπορεί να επηρεαστεί από διάφορους παράγοντες (φόρτος server, σύνδεση internet). Δοκιμάστε 
              να ανανεώσετε τη σελίδα ή να επιστρέψετε αργότερα. Αν το πρόβλημα παραμένει, ενημερώστε μας.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Μπορώ να χρησιμοποιήσω την πλατφόρμα από κινητό;</h3>
            <p className="text-gray-700">
              Ναι! Η πλατφόρμα είναι πλήρως responsive και λειτουργεί σε όλες τις συσκευές (smartphones, tablets, 
              desktops). Απλά ανοίξτε το Apofasi από τον browser του κινητού σας.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Υπάρχει εφαρμογή για κινητά;</h3>
            <p className="text-gray-700">
              Προς το παρόν δεν υπάρχει native εφαρμογή, αλλά η web εφαρμογή λειτουργεί άψογα σε κινητές συσκευές. 
              Μελλοντικά μπορεί να αναπτύξουμε εφαρμογές για iOS και Android.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς αναφέρω ένα bug ή πρόβλημα;</h3>
            <p className="text-gray-700">
              Μπορείτε να αναφέρετε bugs μέσω:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
              <li>
                <a 
                  href="https://github.com/Antoniskp/appofasiv8/issues" 
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Issues
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.gg/pvJftR4T98" 
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord
                </a>
              </li>
              <li>
                <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">
                  Σελίδα Επικοινωνίας
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Community & Moderation */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Κοινότητα & Moderation</h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς αναφέρω ακατάλληλο περιεχόμενο;</h3>
            <p className="text-gray-700">
              Κάθε άρθρο και σχόλιο έχει κουμπί "Αναφορά". Κάντε κλικ σε αυτό, επιλέξτε τον λόγο αναφοράς και 
              υποβάλετε. Η ομάδα moderation θα εξετάσει την αναφορά το συντομότερο δυνατόν.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Τι σ��μβαίνει αν παραβιάσω τους κανόνες;</h3>
            <p className="text-gray-700">
              Ανάλογα με τη σοβαρότητα της παράβασης, μπορεί να λάβετε προειδοποίηση, προσωρινή αναστολή ή μόνιμη 
              απαγόρευση. Διαβάστε τους{' '}
              <a href="/rules" className="text-blue-600 hover:text-blue-800 underline">Κανόνες Κοινότητας</a> για 
              περισσότερες λεπτομέρειες.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς μπορώ να συνεισφέρω στην πλατφόρμα;</h3>
            <p className="text-gray-700">
              Υπάρχουν πολλοί τρόποι να συνεισφέρετε: γράφοντας ποιοτικό περιεχόμενο, συμμετέχοντας σε συζητήσεις, 
              αναφέροντας bugs, προτείνοντας βελτιώσεις, ή υποστηρίζοντας οικονομικά. Δείτε τη σελίδα{' '}
              <a href="/contribute" className="text-blue-600 hover:text-blue-800 underline">Συνεργασία</a> για 
              περισσότερες πληροφορίες.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Μπορώ να δω ποιος ψήφισε σε μια ψηφοφορία;</h3>
            <p className="text-gray-700">
              Όχι. Οι ψήφοι είναι ιδιωτικές για να ενθαρρύνεται η ειλικρινής συμμετοχή. Μόνο τα συνολικά αποτελέσματα 
              είναι ορατά.
            </p>
          </div>
        </div>
      </section>

      {/* More Help */}
      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-3">Δεν βρήκατε την απάντηση που ψάχνατε;</h2>
        
        <p className="text-gray-700 mb-4">
          Αν η ερώτησή σας δεν απαντήθηκε εδώ, μπορείτε:
        </p>
        
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-gray-800">📖 Διαβάστε τις οδηγίες</p>
            <p className="text-gray-700">
              Δείτε τις λεπτομερείς{' '}
              <a href="/instructions" className="text-blue-600 hover:text-blue-800 underline">
                Οδηγίες Χρήσης
              </a>
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-800">💬 Επικοινωνήστε μαζί μας</p>
            <p className="text-gray-700">
              Μπείτε στο{' '}
              <a 
                href="https://discord.gg/pvJftR4T98" 
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>{' '}
              ή δείτε τη{' '}
              <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">
                σελίδα επικοινωνίας
              </a>
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-800">🐛 Αναφέρετε προβλήματα</p>
            <p className="text-gray-700">
              Ανοίξτε ένα issue στο{' '}
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
        </div>
      </section>
    </StaticPageLayout>
}