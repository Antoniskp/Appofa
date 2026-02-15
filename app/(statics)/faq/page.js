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
          Συγκεντρώσαμε τις πιο συχνές ερωτήσεις για να βρείτε γρήγορα ό,τι χρειάζεστε σχετικά με τη χρήση του Apofasi.
        </p>
      </section>

      {/* Getting Started */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Ξεκινώντας</h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Τι είναι το Apofasi;</h3>
            <p className="text-gray-700">
              Το Apofasi (Απόφαση) είναι μια πλατφόρμα ενημέρωσης και πολιτικής συμμετοχής. 
              Συγκεντρώνει ειδήσεις από πολλαπλές πηγές και δίνει στους χρήστες τη δυνατότητα να δημοσιεύουν 
              περιεχόμενο και να συμμετέχουν σε ψηφοφορίες για επίκαιρα ζητήματα.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς δημιουργώ λογαριασμό;</h3>
            <p className="text-gray-700 mb-2">
              Για να δημιουργήσετε λογαριασμό:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 space-y-1">
              <li>Πατήστε το κουμπί «Εγγραφή» από την κεντρική σελίδα.</li>
              <li>Συμπληρώστε όνομα χρήστη, email και κωδικό πρόσβασης.</li>
              <li>Αποδεχτείτε τους όρους χρήσης.</li>
              <li>Επιλέξτε «Δημιουργία λογαριασμού» για ολοκλήρωση.</li>
            </ol>
            <p className="text-gray-700 mt-2">
              Για τη δημιουργία λογαριασμού απαιτείται ηλικία τουλάχιστον 16 ετών.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Είναι δωρεάν η χρήση της πλατφόρμας;</h3>
            <p className="text-gray-700">
              Ναι. Η χρήση του Apofasi είναι δωρεάν: μπορείτε να διαβάζετε ειδήσεις, να δημιουργείτε περιεχόμενο 
              και να συμμετέχετε σε ψηφοφορίες χωρίς καμία χρέωση.
            </p>
          </div>
        </div>
      </section>

      {/* Content & Features */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Περιεχόμενο & Λειτουργίες</h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς δημιουργώ άρθρο;</h3>
            <p className="text-gray-700">
              Συνδεθείτε στον λογαριασμό σας και επιλέξτε «Δημιουργία Άρθρου». Στη συνέχεια, συμπληρώστε 
              τίτλο, περιεχόμενο και κατηγορία πριν δημοσιεύσετε.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς λειτουργούν οι ψηφοφορίες;</h3>
            <p className="text-gray-700">
              Οι ψηφοφορίες σάς επιτρέπουν να εκφράζετε τη θέση σας σε συγκεκριμένα θέματα. 
              Κάθε χρήστης μπορεί να καταχωρίσει μία ψήφο ανά ψηφοφορία.
            </p>
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-3">Χρειάζεστε περισσότερη βοήθεια;</h2>
        <p className="text-gray-700 mb-4">
          Αν δεν βρήκατε την απάντηση που ψάχνετε, επικοινωνήστε μαζί μας από τη{' '}
          <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">σελίδα επικοινωνίας</a>{' '}
          ή διαβάστε τις{' '}
          <a href="/instructions" className="text-blue-600 hover:text-blue-800 underline">οδηγίες χρήσης</a>.
        </p>
      </section>
    </StaticPageLayout>
  );
}
