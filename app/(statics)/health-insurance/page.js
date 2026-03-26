import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'ΕΟΠΥΥ & Ασφάλιση Υγείας — Δικαιώματα Ασφαλισμένου',
  description: 'Δικαιώματα ασφαλισμένου στον ΕΟΠΥΥ, προσωπικός γιατρός, παραπεμπτικά, φαρμακευτική κάλυψη, νοσοκομειακή περίθαλψη.',
  openGraph: {
    title: 'ΕΟΠΥΥ & Ασφάλιση Υγείας — Δικαιώματα Ασφαλισμένου',
    description: 'Δικαιώματα ασφαλισμένου στον ΕΟΠΥΥ, προσωπικός γιατρός, παραπεμπτικά, φαρμακευτική κάλυψη, νοσοκομειακή περίθαλψη.',
    url: `${SITE_URL}/health-insurance`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'ΕΟΠΥΥ & Ασφάλιση Υγείας — Δικαιώματα Ασφαλισμένου',
    description: 'Δικαιώματα ασφαλισμένου στον ΕΟΠΥΥ, προσωπικός γιατρός, παραπεμπτικά, φαρμακευτική κάλυψη, νοσοκομειακή περίθαλψη.',
  },
  alternates: {
    canonical: `${SITE_URL}/health-insurance`,
  },
};

export default function HealthInsurancePage() {
  return (
    <StaticPageLayout title="ΕΟΠΥΥ & Ασφάλιση Υγείας — Δικαιώματα Ασφαλισμένου" maxWidth="max-w-4xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← Σελίδες</Link>}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Ο ΕΟΠΥΥ (Εθνικός Οργανισμός Παροχής Υπηρεσιών Υγείας) είναι ο κύριος ασφαλιστικός φορέας
          υγείας στην Ελλάδα. Σε αυτόν τον οδηγό θα βρείτε ποιος δικαιούται κάλυψη, πώς λειτουργεί
          ο προσωπικός γιατρός και ποια είναι τα δικαιώματά σας ως ασφαλισμένου.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Ποιος Δικαιούται Κάλυψη</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">✅ Άμεσα Ασφαλισμένοι</h3>
            <p className="text-gray-700 text-sm">
              Όλοι οι εργαζόμενοι ή συνταξιούχοι του e-ΕΦΚΑ που καταβάλλουν ασφαλιστικές εισφορές
              δικαιούνται πλήρη κάλυψη ΕΟΠΥΥ (ιατρική, φαρμακευτική, νοσοκομειακή).
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">👨‍👩‍👧 Έμμεσα Μέλη</h3>
            <p className="text-gray-700 text-sm">
              Σύζυγοι χωρίς ίδια ασφάλιση και παιδιά έως 18 ετών (ή 24 αν σπουδάζουν) καλύπτονται
              ως έμμεσα μέλη. Απαιτείται εγγραφή στον e-ΕΦΚΑ.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🤝 Ανασφάλιστοι</h3>
            <p className="text-gray-700 text-sm">
              ΑΜΕΑ, ευπαθείς ομάδες και άτομα με χαμηλό εισόδημα που δεν έχουν ασφάλιση μπορούν
              να λάβουν κάλυψη μέσω ειδικών προγραμμάτων ΕΟΠΥΥ και κοινωνικής πρόνοιας.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📋 Βεβαίωση Ασφάλισης</h3>
            <p className="text-gray-700 text-sm">
              Για να χρησιμοποιήσετε τις υπηρεσίες του ΕΟΠΥΥ, απαιτείται ενεργός ασφάλιση.
              Εκδώστε βεβαίωση από τον e-ΕΦΚΑ ή ελέγξτε online την ασφαλιστική σας κατάσταση.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Προσωπικός Γιατρός</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Ο θεσμός του Προσωπικού Γιατρού εισήχθη το 2022 για να ενισχύσει την πρωτοβάθμια
            υγειονομική φροντίδα. Κάθε ασφαλισμένος πρέπει να εγγραφεί σε έναν Προσωπικό Γιατρό.
          </p>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Πώς Εγγράφεστε</h3>
            <p className="text-gray-700 text-sm">
              Εγγραφείτε μέσω{' '}
              <a href="https://www.gov.gr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                gov.gr
              </a>{' '}
              (ενότητα myGov → Προσωπικός Γιατρός). Επιλέγετε γιατρό από τον κατάλογο ΕΟΠΥΥ
              στην περιοχή σας. Η εγγραφή ισχύει για 2 χρόνια.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ρόλος Παραπομπής</h3>
            <p className="text-gray-700 text-sm">
              Ο Προσωπικός Γιατρός χορηγεί παραπεμπτικά για ειδικούς ιατρούς και εξετάσεις.
              Η παραπομπή είναι απαραίτητη για κάλυψη ΕΟΠΥΥ σε ειδικούς (με εξαίρεση έκτακτα
              περιστατικά).
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Παραπεμπτικά & Εξετάσεις</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ηλεκτρονικό Παραπεμπτικό</h3>
            <p className="text-gray-700 text-sm">
              Τα παραπεμπτικά εκδίδονται αποκλειστικά ηλεκτρονικά μέσω του συστήματος e-Συνταγολόγιο
              (prescriptions.moh.gov.gr). Έχετε πρόσβαση από το κινητό σας ή online.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Κατηγορίες Εξετάσεων</h3>
            <p className="text-gray-700 text-sm">
              Καλύπτονται εργαστηριακές εξετάσεις (αίμα, ούρα, καλλιέργειες), απεικονιστικές
              (ακτινογραφίες, υπέρηχοι, MRI), και επισκέψεις σε ειδικούς ιατρούς.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Συμμετοχή Ασθενή</h3>
            <p className="text-gray-700 text-sm">
              Σε ορισμένες εξετάσεις ο ασφαλισμένος καταβάλλει <strong>συμμετοχή 15%–20%</strong>.
              Για χρόνιες παθήσεις ή ΑΜΕΑ, μειωμένη ή μηδενική συμμετοχή.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Φαρμακευτική Κάλυψη</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💊 Ποσοστά Κάλυψης</h3>
            <ul className="text-gray-700 text-sm space-y-2">
              <li>• Γενικά φάρμακα: κάλυψη <strong>75%</strong> (ασθενής 25%)</li>
              <li>• Φάρμακα χρόνιων παθήσεων: κάλυψη <strong>90%</strong> (ασθενής 10%)</li>
              <li>• Ορισμένες κατηγορίες: κάλυψη <strong>100%</strong> (0% συμμετοχή)</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏥 Εξαργύρωση Συνταγής</h3>
            <p className="text-gray-700 text-sm">
              Η ηλεκτρονική συνταγή εξαργυρώνεται σε οποιοδήποτε συνεργαζόμενο φαρμακείο με την
              ταυτότητά σας και τον ΑΜΚΑ. Δεν απαιτείται έντυπη συνταγή.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Νοσοκομειακή Περίθαλψη</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">ΕΣΥ — Εθνικό Σύστημα Υγείας</h3>
            <p className="text-gray-700 text-sm">
              Τα δημόσια νοσοκομεία ΕΣΥ παρέχουν δωρεάν νοσηλεία σε ασφαλισμένους ΕΟΠΥΥ.
              Καλύπτονται επεμβάσεις, ΜΕΘ, τοκετοί και ογκολογικές θεραπείες.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ιδιωτικές Κλινικές σε Σύμβαση</h3>
            <p className="text-gray-700 text-sm">
              Ορισμένες ιδιωτικές κλινικές έχουν σύμβαση με τον ΕΟΠΥΥ. Σε αυτές μπορείτε να
              νοσηλευτείτε με μειωμένο κόστος. Ο κατάλογος διαθέσιμων κλινικών βρίσκεται στο
              eopyy.gov.gr.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοί Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.eopyy.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">⚕️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">ΕΟΠΥΥ (eopyy.gov.gr)</p>
              <p className="text-sm text-gray-600">Συνεργαζόμενοι γιατροί, κλινικές, φαρμακεία, παροχές</p>
            </div>
          </a>
          <a
            href="https://www.efka.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏛️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">e-ΕΦΚΑ (efka.gov.gr)</p>
              <p className="text-sm text-gray-600">Βεβαίωση ασφάλισης, ΑΜΚΑ, ιστορικό ασφάλισης</p>
            </div>
          </a>
          <a
            href="https://www.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🇬🇷</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">gov.gr</p>
              <p className="text-sm text-gray-600">Εγγραφή Προσωπικού Γιατρού, ψηφιακές υπηρεσίες υγείας</p>
            </div>
          </a>
          <a
            href="https://www.moh.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏥</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">myHealth (moh.gov.gr)</p>
              <p className="text-sm text-gray-600">Ηλεκτρονικές συνταγές, ιστορικό εξετάσεων, ραντεβού</p>
            </div>
          </a>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα. Οι παροχές και οι
          διαδικασίες του ΕΟΠΥΥ αλλάζουν. Για επικαιροποιημένες πληροφορίες σχετικά με τα
          δικαιώματά σας, επισκεφθείτε το eopyy.gov.gr ή απευθυνθείτε στον προσωπικό σας γιατρό.
        </p>
      </section>
    </StaticPageLayout>
  );
}
