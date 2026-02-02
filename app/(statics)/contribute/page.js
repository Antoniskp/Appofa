import Link from 'next/link';

export const metadata = {
  title: 'Συνεργασία με νόημα - Εφαρμογή Ειδήσεων',
  description: 'Πώς μπορείτε να συνεισφέρετε στο Apofasi',
};

export default function ContributePage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <h1 className="text-4xl font-bold mb-8">Συνεργασία με νόημα</h1>

        <div className="card p-8">
          <div className="max-w-4xl space-y-12">
            <section>
              <h2 className="text-2xl font-semibold mb-3">Το Apofasi χτίζεται από την κοινότητα</h2>
              <p className="text-gray-700 mb-4">
                Το Apofasi υπάρχει για να προσφέρει καθαρή, διαφανή ενημέρωση και μια ειλικρινή εικόνα της διάθεσης της
                κοινωνίας. Συγκεντρώνουμε ειδήσεις από πολλές πηγές, τις οργανώνουμε σε ιστορίες και δείχνουμε πώς
                ανταποκρίνεται το κοινό σε πραγματικό χρόνο.
              </p>
              <p className="text-gray-700">
                Θέλουμε μια πλατφόρμα που υπηρετεί τους πολίτες, όχι τα κόμματα. Γι&apos; αυτό αναζητούμε ανθρώπους που
                μοιράζονται το ίδιο όραμα και θέλουν να βοηθήσουν με ουσιαστικό τρόπο.
              </p>
            </section>

            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-3">Ας γνωριστούμε</h2>
              <p className="text-gray-700 mb-6">
                Αν θέλετε να συνεισφέρετε, μπείτε στο Discord και στείλτε μας ένα μήνυμα με το πώς θα θέλατε να βοηθήσετε.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contact" className="btn-primary">
                  Επικοινωνία
                </Link>
                <Link href="/mission" className="btn-secondary">
                  Δείτε το όραμα
                </Link>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Πού μπορείτε να βοηθήσετε</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="text-xl font-semibold mb-2">Editorial</h3>
                  <p className="text-gray-700">
                    Συμβολή σε περιλήψεις, έλεγχο πηγών, θεματολογία και επιμέλεια της γλώσσας ώστε οι ιστορίες να είναι
                    κατανοητές και χρήσιμες.
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="text-xl font-semibold mb-2">Engineering</h3>
                  <p className="text-gray-700">
                    Βελτίωση των API, των data workflows και του UI ώστε η πλατφόρμα να είναι γρήγορη, ασφαλής και εύκολη
                    στη χρήση.
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="text-xl font-semibold mb-2">Community</h3>
                  <p className="text-gray-700">
                    Συντονισμός συζητήσεων, συγκέντρωση feedback, υποστήριξη νέων μελών και ενίσχυση της κουλτούρας
                    διαλόγου.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Οικονομική συμβολή</h2>
              <p className="text-gray-700 mb-6">
                Οι οικονομικές συνεισφορές μάς επιτρέπουν να διατηρούμε την υποδομή και να προσθέτουμε δυνατότητες που
                ενισχύουν την αξιοπιστία της ενημέρωσης.
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Χρηματική ή crypto ενίσχυση</h3>
                  <p className="text-gray-700">
                    Ακόμη και μικρές συνεισφορές βοηθούν να καλύπτουμε καθημερινά κόστη φιλοξενίας και να σχεδιάζουμε τις
                    επόμενες βελτιώσεις.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Τι χρηματοδοτείται</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Υποδομές hosting, monitoring και ασφάλειας δεδομένων</li>
                    <li>Εξέλιξη των pipelines συλλογής και καθαρισμού ειδήσεων</li>
                    <li>Νέα εργαλεία αξιοπιστίας, moderation και αναφορών</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Τι χρειάζεται η πλατφόρμα</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Data pipelines που αντέχουν στον χρόνο</h3>
                  <p className="text-gray-700">
                    Θέλουμε πιο έξυπνη συλλογή, καθαρισμό και ομαδοποίηση ειδήσεων, με αυτοματοποιημένους ελέγχους ποιότητας
                    και σαφή καταγραφή αλλαγών.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">UX που κάνει την ενημέρωση απλή</h3>
                  <p className="text-gray-700">
                    Αναζητούμε βελτιώσεις σε πλοήγηση, προσβασιμότητα και μικροαντιγραφές, ώστε κάθε ιστορία να είναι άμεσα
                    κατανοητή σε κινητό και desktop.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Βήματα συμμετοχής</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-3">
                <li>
                  Αναφέρετε bugs ή ιδέες στο{' '}
                  <a
                    href="https://github.com/Antoniskp/appofasiv8/issues"
                    className="text-blue-600 hover:text-blue-800"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    GitHub issues
                  </a>
                  .
                </li>
                <li>Στηρίξτε οικονομικά την υποδομή και ζητήστε οδηγίες για τις διαθέσιμες επιλογές.</li>
                <li>
                  Κάντε contribution κώδικα μέσω του{' '}
                  <a
                    href="https://github.com/Antoniskp/appofasiv8"
                    className="text-blue-600 hover:text-blue-800"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    αποθετηρίου στο GitHub
                  </a>
                  .
                </li>
                <li>
                  Μοιραστείτε γνώση ή feedback στέλνοντας μήνυμα στην κοινότητα με το αντικείμενο που σας ενδιαφέρει.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
