'use client';

import StaticPageLayout from '@/components/StaticPageLayout';
import ContactForm from '@/components/ContactForm';
import { useRouter } from 'next/navigation';

export default function BecomeModeratorPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Optionally redirect after success
    setTimeout(() => {
      router.push('/');
    }, 3000);
  };

  return (
    <StaticPageLayout title="Γίνε Moderator" maxWidth="max-w-3xl">
      {/* Introduction */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-indigo-900 mb-3">Βοήθησε την κοινότητά σου</h2>
        <p className="text-gray-700">
          Οι moderators είναι οι φύλακες της ποιότητας και της τάξης στην πλατφόρμα. Αν θέλεις να συμβάλεις 
          στη διαμόρφωση της συζήτησης στην περιοχή σου, κάνε αίτηση παρακάτω.
        </p>
      </div>

      {/* Benefits */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Τι κάνει ένας Moderator;</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-700 mb-2">✓ Διαχείριση Περιεχομένου</h4>
            <p className="text-sm text-gray-700">
              Έγκριση και έλεγχος άρθρων και ψηφοφοριών για την περιοχή σου
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-700 mb-2">✓ Δημιουργία Locations</h4>
            <p className="text-sm text-gray-700">
              Προσθήκη νέων τοποθεσιών και οργάνωση της ιεραρχίας
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-700 mb-2">✓ Συντονισμός Κοινότητας</h4>
            <p className="text-sm text-gray-700">
              Διασφάλιση ότι οι κανόνες τηρούνται και η συζήτηση παραμένει εποικοδομητική
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-700 mb-2">✓ Ειδικά Δικαιώματα</h4>
            <p className="text-sm text-gray-700">
              Πρόσβαση σε εργαλεία διαχείρισης και moderator dashboard
            </p>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Απαιτήσεις</h3>
        <ul className="list-disc pl-6 text-gray-700 space-y-2">
          <li>Ενεργός λογαριασμός στην πλατφόρμα</li>
          <li>Κατανόηση των κανόνων και της αποστολής της πλατφόρμας</li>
          <li>Διάθεση να αφιερώσεις χρόνο για τη διαχείριση</li>
          <li>Δίκαιη και αμερόληπτη κρίση</li>
          <li>Σεβασμός στην κοινότητα και τις διαφορετικές απόψεις</li>
        </ul>
      </section>

      {/* Application Form */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Αίτηση</h3>
        <p className="text-gray-700 mb-6">
          Συμπλήρωσε την παρακάτω φόρμα για να κάνεις αίτηση. Εξήγησε γιατί θέλεις να γίνεις moderator 
          και ποια εμπειρία έχεις (αν υπάρχει).
        </p>
        <ContactForm 
          type="moderator_application"
          showLocationSelector={true}
          submitButtonText="Υποβολή Αίτησης"
          onSuccess={handleSuccess}
        />
      </section>
    </StaticPageLayout>
  );
}
