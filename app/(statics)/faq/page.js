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
              να συμμετέχετε σε ψηφοφορίες χωρίς καμία χρέωση.
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
              Συνδεθείτε στον λογαριασμό σας και πατήστε "Δημιουργία Άρθρου". Συμπληρώστε τον τίτλο, 
              το περιεχόμενο και επιλέξτε την κατηγορία.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Πώς λειτουργούν οι ψηφοφορίες;</h3>
            <p className="text-gray-700">
              Οι ψηφοφορίες επιτρέπουν στους χρήστες να εκφράσουν την άποψή τους σε διάφορα θέματα. 
              Κάθε χρήστης μπορεί να ψηφίσει μία φορά ανά ψηφοφορία.
            </p>
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-3">Χρειάζεστε περισσότερη βοήθεια;</h2>
        <p className="text-gray-700 mb-4">
          Επικοινωνήστε μαζί μας μέσω της <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">σελίδας επικοινωνίας</a> ή 
          δείτε τις <a href="/instructions" className="text-blue-600 hover:text-blue-800 underline">οδηγίες χρήσης</a>.
        </p>
      </section>
    </StaticPageLayout>
  );
}