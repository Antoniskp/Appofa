import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Δημοσιογράφοι & Συντάκτες - Απόφαση',
  description: 'Πώς να υποβάλετε αίτηση, οδηγίες δημοσίευσης και κατευθυντήριες γραμμές για δημοσιογράφους στο Apofasi.',
  openGraph: {
    title: 'Δημοσιογράφοι & Συντάκτες - Απόφαση',
    description: 'Πώς να υποβάλετε αίτηση, οδηγίες δημοσίευσης και κατευθυντήριες γραμμές για δημοσιογράφους στο Apofasi.',
    url: `${SITE_URL}/reporters`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Δημοσιογράφοι & Συντάκτες - Απόφαση',
    description: 'Πώς να υποβάλετε αίτηση, οδηγίες δημοσίευσης και κατευθυντήριες γραμμές για δημοσιογράφους στο Apofasi.',
  },
  alternates: {
    canonical: `${SITE_URL}/reporters`,
  },
};

export default function ReportersPage() {
  return (
    <StaticPageLayout
      title="Δημοσιογράφοι & Συντάκτες"
      breadcrumb={
        <Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Σελίδες
        </Link>
      }
    >
      {/* Hero banner */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-3">Γίνε Συντάκτης στο Apofasi</h2>
        <p>
          Οι συντάκτες αποτελούν τη ραχοκοκαλιά της ενημέρωσης στο Apofasi. Συνεισφέρουν άρθρα,
          παρακολουθούν τις εξελίξεις και κρατούν την κοινότητα ενήμερη με αξιόπιστο και
          πρωτότυπο περιεχόμενο.
        </p>
      </section>

      {/* How to apply */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Πώς να κάνεις αίτηση</h2>
        <ol className="list-decimal pl-6 text-gray-700 space-y-3">
          <li>Δημιούργησε λογαριασμό στην πλατφόρμα.</li>
          <li>
            Επισκέψου τη σελίδα{' '}
            <a
              href="https://appofasi.gr/platform"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              platform
            </a>{' '}
            και συμπλήρωσε τη φόρμα αίτησης.
          </li>
          <li>Η ομάδα θα επικοινωνήσει μαζί σου εντός 5 εργάσιμων ημερών.</li>
          <li>Μετά την έγκριση αποκτάς πρόσβαση στο editor.</li>
        </ol>
      </section>

      {/* Posting guidelines */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Οδηγίες Δημοσίευσης</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">✓ Αξιοπιστία Πηγών</h3>
            <p className="text-gray-700">
              Κάθε άρθρο πρέπει να βασίζεται σε επαληθευμένες και αξιόπιστες πηγές.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">✓ Ουδετερότητα</h3>
            <p className="text-gray-700">
              Ισορροπημένη παρουσίαση των γεγονότων — δεν επιτρέπεται η προώθηση κόμματος ή
              πολιτικής θέσης.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">✓ Πρωτότυπο Περιεχόμενο</h3>
            <p className="text-gray-700">
              Δημοσιεύεται μόνο πρωτότυπο περιεχόμενο. Αντιγραφή από άλλες πηγές χωρίς αναφορά
              δεν γίνεται αποδεκτή.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">✓ Σωστή Κατηγοριοποίηση</h3>
            <p className="text-gray-700">
              Επιλογή της σωστής κατηγορίας και των κατάλληλων ετικετών τοποθεσίας για κάθε
              άρθρο.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">✓ Σεβασμός Πνευματικών Δικαιωμάτων</h3>
            <p className="text-gray-700">
              Εικόνες και υλικό τρίτων χρησιμοποιούνται μόνο με τις κατάλληλες άδειες και
              αναφορές.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-2">✓ Ξεκάθαρος Τίτλος</h3>
            <p className="text-gray-700">
              Ο τίτλος πρέπει να αποτυπώνει με ακρίβεια το περιεχόμενο — δεν επιτρέπονται
              clickbait διατυπώσεις.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial guidelines */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Κατευθυντήριες Γραμμές</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Ακρίβεια & Έλεγχος Γεγονότων</h3>
            <p className="text-gray-700">
              Πριν τη δημοσίευση επαληθεύεται κάθε ισχυρισμός από τουλάχιστον δύο ανεξάρτητες
              πηγές. Αβέβαιες πληροφορίες επισημαίνονται ρητά ως τέτοιες.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Ύφος & Γλώσσα</h3>
            <p className="text-gray-700">
              Τα άρθρα γράφονται σε επίσημη νέα ελληνική. Αποφεύγεται η αργκό, ο κατακερματισμός
              λέξεων και οι ανορθόγραφες συντομογραφίες.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Αποφυγή Διαφήμισης</h3>
            <p className="text-gray-700">
              Δεν επιτρέπεται διαφημιστικό ή προωθητικό περιεχόμενο υπέρ επιχειρήσεων, προϊόντων
              ή υπηρεσιών. Το Apofasi παραμένει αμερόληπτη πλατφόρμα ενημέρωσης.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Διόρθωση Λαθών</h3>
            <p className="text-gray-700">
              Σε περίπτωση σφάλματος ο συντάκτης υποχρεούται να υποβάλει διόρθωση το συντομότερο
              δυνατό, με σαφή επισήμανση της αλλαγής στο τέλος του άρθρου.
            </p>
          </div>
        </div>
      </section>

      {/* How to post */}
      <section>
        <h2 className="text-2xl font-semibold mb-3">Πώς να δημοσιεύσεις</h2>
        <ol className="list-decimal pl-6 text-gray-700 space-y-3">
          <li>Συνδέεσαι στον λογαριασμό σου και μεταβαίνεις στο <code className="bg-gray-100 px-1 rounded">/editor</code>.</li>
          <li>Επιλέγεις κατηγορία και τοποθεσία για το άρθρο σου.</li>
          <li>Συγγράφεις το άρθρο: τίτλος, περίληψη και κύριο κείμενο.</li>
          <li>Προσθέτεις τις πηγές σου στο πεδίο «Πηγές».</li>
          <li>Υποβάλεις το άρθρο για έλεγχο από moderator.</li>
          <li>Μετά την έγκριση το άρθρο δημοσιεύεται αυτόματα στην πλατφόρμα.</li>
        </ol>
      </section>

      {/* CTA */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-3">Έτοιμος να ξεκινήσεις;</h2>
        <p className="text-gray-700 mb-6">
          Κάνε αίτηση σήμερα και γίνε μέλος της ομάδας συντακτών του Apofasi.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://appofasi.gr/platform"
            className="btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Κάνε Αίτηση
          </a>
          <Link href="/contact" className="btn-secondary">
            Επικοινωνία
          </Link>
        </div>
      </section>
    </StaticPageLayout>
  );
}
