import StaticPageLayout from '@/components/StaticPageLayout';

export const metadata = {
  title: 'Σχετικά με εμάς - Απόφαση',
  description: 'Η ιστορία, το όραμα και η ομάδα πίσω από την πλατφόρμα Απόφαση',
};

export default function AboutPage() {
  return (
    <StaticPageLayout title="Σχετικά με το Apofasi" maxWidth="max-w-4xl">
      <section>
        <p className="text-xl text-gray-700 mb-6 leading-relaxed">
          Το Apofasi (Απόφαση) είναι μια πλατφόρμα που συνδυάζει ενημέρωση με πολιτική συμμετοχή, δίνοντας φωνή 
          στους πολίτες να εκφράσουν τις απόψεις τους και να συμμετέχουν ενεργά στο δημόσιο διάλογο.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Η ιστορία μας</h2>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Το Apofasi ξεκίνησε από μια απλή ιδέα: να δημιουργήσουμε έναν χώρο όπου οι πολίτες μπορούν να 
            ενημερώνονται από πολλαπλές πηγές και να εκφράζουν την άποψή τους με διαφάνεια και σεβασμό.
          </p>
          
          <p className="text-gray-700">
            Σε μια εποχή όπου η πληροφορία είναι κατακερματισμένη και η κοινή γνώμη συχνά παραποιημένη, 
            θέλαμε να προσφέρουμε μια εναλλακτική: μια πλατφόρμα που συγκεντρώνει ειδήσεις από διάφορες πηγές, 
            επιτρέπει στους πολίτες να δημιουργούν περιεχόμενο και να συμμετέχουν σε ψηφοφορίες που δείχνουν 
            την πραγματική διάθεση της κοινότητας.
          </p>

          <p className="text-gray-700">
            Δημιουργήθηκε το <strong>2026</strong> με την πεποίθηση ότι η δημοκρατία ενδυναμώνεται όταν οι 
            πολίτες έχουν πρόσβαση σε διαφανή ενημέρωση και τη δυνατότητα να εκφράζονται ελεύθερα.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Το όραμά μας</h2>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 space-y-4">
          <p className="text-gray-700 text-lg">
            Οραματιζόμαστε μια κοινωνία όπου:
          </p>
          
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-indigo-600 font-bold mr-3 text-xl">✓</span>
              <span>
                Κάθε πολίτης έχει πρόσβαση σε πλήρη και διαφανή ενημέρωση από πολλαπλές πηγές
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 font-bold mr-3 text-xl">✓</span>
              <span>
                Η κοινή γνώμη καταγράφεται με ειλικρίνεια, χωρίς χειραγώγηση και κομματικές γραμμές
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 font-bold mr-3 text-xl">✓</span>
              <span>
                Οι πολίτες μπορούν να ασκούν πραγματική επιρροή στους εκπροσώπους τους
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-600 font-bold mr-3 text-xl">✓</span>
              <span>
                Η πολιτική συζήτηση βασίζεται σε σεβασμό, δεδομένα και εποικοδομητικό διάλογο
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Τι κάνουμε διαφορετικά</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2 text-indigo-700">🗞️ Συγκέντρωση ειδήσεων</h3>
            <p className="text-gray-700">
              Συλλέγουμε και οργανώνουμε ειδήσεις από πολλαπλές πηγές, ώστε να βλέπετε διαφορετικές οπτικές 
              γωνίες του ίδιου θέματος σε μία οθόνη.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2 text-indigo-700">📊 Διαφανείς ψηφοφορίες</h3>
            <p className="text-gray-700">
              Οι ψηφοφορίες μας δείχνουν την πραγματική διάθεση της κοινότητας, με σαφή διευκρίνιση ότι δεν 
              είναι επιστημονικά αντιπροσωπευτικές δημοσκοπήσεις.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2 text-indigo-700">✍️ Φωνή στους πολίτες</h3>
            <p className="text-gray-700">
              Δίνουμε τη δυνατότητα σε κάθε πολίτη να δημιουργήσει και να μοιραστεί το δικό του περιεχόμενο, 
              να εκφράσει απόψεις και να συμμετάσχει στο διάλογο.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2 text-indigo-700">🚫 Χωρίς κομματικές γραμμές</h3>
            <p className="text-gray-700">
              Αποφεύγουμε τα κόμματα και τις ιδεολογικές γραμμές. Πιστεύουμε ότι οι πολίτες πρέπει να 
              καθοδηγούν τους εκπροσώπους τους, όχι το αντίστροφο.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Οι αξίες μας</h2>
        
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-xl font-semibold mb-2">Διαφάνεια</h3>
            <p className="text-gray-700">
              Πιστεύουμε στην πλήρη διαφάνεια. Δείχνουμε τις πηγές μας, εξηγούμε τη μεθοδολογία μας και 
              λειτουργούμε ανοιχτά.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-xl font-semibold mb-2">Σεβασμός</h3>
            <p className="text-gray-700">
              Ενθαρρύνουμε τον εποικοδομητικό διάλογο και τον σεβασμό στη διαφορετική άποψη. Η πολιτική 
              συζήτηση μπορεί να είναι και πολιτισμένη.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-xl font-semibold mb-2">Ανεξαρτησία</h3>
            <p className="text-gray-700">
              Δεν συνδεόμαστε με κανένα κόμμα, οργάνωση ή συμφέροντα. Η πλατφόρμα υπηρετεί μόνο τους πολίτες.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-xl font-semibold mb-2">Συμμετοχή</h3>
            <p className="text-gray-700">
              Πιστεύουμε στην ενεργή συμμετοχή των πολιτών. Δεν είμαστε παθητικοί καταναλωτές ειδήσεων αλλά 
              ενεργοί συμμετέχοντες στη διαμόρφωση της κοινής γνώμης.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Η ομάδα μας</h2>
        
        <p className="text-gray-700 mb-6">
          Το Apofasi δημιουργήθηκε και συντηρείται από μια μικρή ομάδα αφοσιωμένων ατόμων που πιστεύουν στη 
          δύναμη της διαφάνειας και της συμμετοχής.
        </p>

        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">Θέλεις να γίνεις μέλος της ομάδας;</h3>
          <p className="text-gray-700 mb-4">
            Αναζητούμε ανθρώπους που μοιράζονται το όραμά μας και θέλουν να συμβάλουν στην ανάπτυξη της 
            πλατφόρμας. Είτε είστε developer, editor, designer ή απλά ενθουσιασμένοι πολίτες, υπάρχει χώρος 
            για εσάς.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/contribute" className="btn-primary">
              Δείτε πώς μπορείτε να βοηθήσετε
            </a>
            <a href="/contact" className="btn-secondary">
              Επικοινωνήστε μαζί μας
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Τεχνολογία & Ανοιχτός κώδικας</h2>
        
        <p className="text-gray-700 mb-4">
          Η πλατφόρμα είναι χτισμένη με σύγχρονες τεχνολογίες και είναι ανοιχτού κώδικα (open source). 
          Πιστεύουμε στη διαφάνεια όχι μόνο στο περιεχόμενο αλλά και στον κώδικα.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-3">Tech Stack</h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-700">
            <div>
              <p className="font-semibold">Frontend:</p>
              <ul className="list-disc pl-6">
                <li>Next.js (React)</li>
                <li>Tailwind CSS</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Backend:</p>
              <ul className="list-disc pl-6">
                <li>Node.js / Express</li>
                <li>PostgreSQL</li>
              </ul>
            </div>
          </div>
          <p className="text-gray-700 mt-4">
            Ο κώδικας είναι διαθέσιμος στο{' '}
            <a 
              href="https://github.com/Antoniskp/appofasiv8" 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρονολόγιο</h2>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-24 font-semibold text-indigo-700">
              Φεβ 2026
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold mb-1">Επίσημη έναρξη</h3>
              <p className="text-gray-700">
                Το Apofasi ανοίγει τις πόρτες του στο κοινό με τη δυνατότητα δημιουργίας περιεχομένου και 
                συμμετοχής σε ψηφοφορίες.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-24 font-semibold text-indigo-700">
              Ιαν 2026
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold mb-1">Ανάπτυξη πλατφόρμας</h3>
              <p className="text-gray-700">
                Ξεκίνησε η ανάπτυξη της πλατφόρμας με στόχο τη δημιουργία ενός ολοκληρωμένου εργαλείου 
                ενημέρωσης και πολιτικής συμμετοχής.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-24 font-semibold text-indigo-700">
              2025
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold mb-1">Η ιδέα</h3>
              <p className="text-gray-700">
                Γεννήθηκε η ιδέα για μια πλατφόρμα που θα συνδύαζε ενημέρωση με άμεση πολιτική συμμετοχή.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Το μέλλον</h2>
        
        <p className="text-gray-700 mb-4">
          Έχουμε μεγάλα σχέδια για το μέλλον του Apofasi:
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-semibold">Βελτιωμένη συλλογή ειδήσεων</h3>
              <p className="text-gray-700">
                Πιο έξυπνοι αλγόριθμοι για να συγκεντρώνουμε και να οργανώνουμε ειδήσεις από περισσότερες πηγές
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">🔐</span>
            <div>
              <h3 className="font-semibold">Ενισχυμένη ασφάλεια ψηφοφοριών</h3>
              <p className="text-gray-700">
                Blockchain-based επαλήθευση για να διασφαλίζουμε την ακεραιότητα των ψηφοφοριών
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">🪙</span>
            <div>
              <h3 className="font-semibold">Κρυπτονόμισμα κοινότητας</h3>
              <p className="text-gray-700">
                Ένα token που επιβραβεύει τη θετική συμμετοχή και ενισχύει την κοινότητα
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">🎮</span>
            <div>
              <h3 className="font-semibold">Gamification</h3>
              <p className="text-gray-700">
                Εμβλήματα, προκλήσεις και ανταμοιβές για να κάνουμε τη συμμετοχή πιο ελκυστική
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="font-semibold">Mobile εφαρμογές</h3>
              <p className="text-gray-700">
                Native εφαρμογές για iOS και Android για καλύτερη εμπειρία χρήσης
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-indigo-600 text-white rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Γίνε μέρος της αλλαγής</h2>
        <p className="text-xl mb-6 opacity-90">
          Το Apofasi είναι περισσότερο από μια πλατφόρμα. Είναι μια κοινότητα πολιτών που πιστεύουν στη 
          διαφάνεια, τη συμμετοχή και τη δημοκρατία.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a 
            href="/contribute" 
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Συνεργαστείτε μαζί μας
          </a>
          <a 
            href="/contact" 
            className="bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition border-2 border-white"
          >
            Επικοινωνήστε
          </a>
        </div>
      </section>
    </StaticPageLayout>
  );
}