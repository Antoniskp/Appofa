import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Ανεξάρτητος Υποψήφιος — Διαδικασίες & Κόστη στην Ελλάδα',
  description: 'Διαδικασίες και κόστη για ανεξάρτητο υποψήφιο στις δημοτικές, περιφερειακές και βουλευτικές εκλογές στην Ελλάδα.',
  openGraph: {
    title: 'Ανεξάρτητος Υποψήφιος — Διαδικασίες & Κόστη στην Ελλάδα',
    description: 'Διαδικασίες και κόστη για ανεξάρτητο υποψήφιο στις δημοτικές, περιφερειακές και βουλευτικές εκλογές στην Ελλάδα.',
    url: `${SITE_URL}/citizen-help/independent-candidate`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Ανεξάρτητος Υποψήφιος — Διαδικασίες & Κόστη στην Ελλάδα',
    description: 'Διαδικασίες και κόστη για ανεξάρτητο υποψήφιο στις δημοτικές, περιφερειακές και βουλευτικές εκλογές στην Ελλάδα.',
  },
  alternates: {
    canonical: `${SITE_URL}/citizen-help/independent-candidate`,
  },
};

export default function IndependentCandidatePage() {
  return (
    <StaticPageLayout
      title="Ανεξάρτητος Υποψήφιος — Διαδικασίες & Κόστη στην Ελλάδα"
      maxWidth="max-w-4xl"
      breadcrumb={
        <Link href="/citizen-help" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Βοήθεια Πολίτη
        </Link>
      }
    >
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Αν θέλετε να κατεβείτε υποψήφιος χωρίς κόμμα στις εκλογές, χρειάζεστε να γνωρίζετε τις
          απαιτήσεις, τα βήματα υποβολής υποψηφιότητας και τα κόστη για κάθε τύπο εκλογών. Αυτός ο
          οδηγός καλύπτει τις τρεις κύριες θέσεις: Δήμαρχος, Περιφερειάρχης και Βουλευτής.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Συγκριτικός Πίνακας Θέσεων</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Θέση</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Ελάχιστη Ηλικία</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Απαιτούμενες Υπογραφές</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Παράβολο</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Αρχή Υποβολής</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700 font-medium">Δήμαρχος</td>
                <td className="px-4 py-3 text-gray-700">21 ετών</td>
                <td className="px-4 py-3 text-gray-700">Ανάλογα με πληθυσμό</td>
                <td className="px-4 py-3 text-gray-700">100–500 €</td>
                <td className="px-4 py-3 text-gray-700">Πρωτοδικείο</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700 font-medium">Περιφερειάρχης</td>
                <td className="px-4 py-3 text-gray-700">21 ετών</td>
                <td className="px-4 py-3 text-gray-700">Ανάλογα με πληθυσμό</td>
                <td className="px-4 py-3 text-gray-700">300–500 €</td>
                <td className="px-4 py-3 text-gray-700">Εφετείο</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700 font-medium">Βουλευτής</td>
                <td className="px-4 py-3 text-gray-700">25 ετών</td>
                <td className="px-4 py-3 text-gray-700">12–500 (ανά εκλογική περιφέρεια)</td>
                <td className="px-4 py-3 text-gray-700">~500 €</td>
                <td className="px-4 py-3 text-gray-700">Αρχή Υπ. Εσωτερικών / ΑΕΔ</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Δήμαρχος (Δημοτικές Εκλογές)</h2>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Προϋποθέσεις</h3>
        <div className="space-y-4 mb-6">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="text-base font-semibold mb-1">Ελληνική Ιθαγένεια</h4>
            <p className="text-gray-700 text-sm">Απαιτείται ελληνική ιθαγένεια και δικαίωμα ψήφου.</p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="text-base font-semibold mb-1">Ηλικία</h4>
            <p className="text-gray-700 text-sm">Τουλάχιστον 21 ετών κατά την ημέρα των εκλογών.</p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="text-base font-semibold mb-1">Μη κώλυμα εκλογιμότητας</h4>
            <p className="text-gray-700 text-sm">
              Ορισμένα αξιώματα (δημόσιοι υπάλληλοι, στρατιωτικοί, δικαστικοί) απαιτούν παραίτηση
              εντός τακτής προθεσμίας.
            </p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <h4 className="text-base font-semibold mb-1">Σχηματισμός Συνδυασμού</h4>
            <p className="text-gray-700 text-sm">
              Ο ανεξάρτητος υποψήφιος δηλώνει «συνδυασμό» έστω και μονοπρόσωπο.
            </p>
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Διαδικασία</h3>
        <div className="space-y-4 mb-6">
          {[
            'Συγκέντρωση απαιτούμενων υπογραφών υποστήριξης από εκλογείς του Δήμου.',
            'Υποβολή αίτησης στο αρμόδιο Πρωτοδικείο εντός των νόμιμων προθεσμιών.',
            'Κατάθεση παραβόλου (100–500 € ανάλογα με πληθυσμό Δήμου).',
            'Υποβολή δήλωσης περιουσιακής κατάστασης (Πόθεν Έσχες) στην ΑΠΔΠΧ.',
            'Τήρηση κανόνων διαφάνειας εκστρατείας — δήλωση εκλογικών εξόδων.',
          ].map((step, i) => (
            <div key={i} className="border-l-4 border-indigo-500 pl-4">
              <p className="text-gray-700 text-sm">
                <span className="font-semibold">{i + 1}.</span> {step}
              </p>
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Κόστη</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Κατηγορία Κόστους</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Κόστος (κατά προσέγγιση)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700">Παράβολο υποβολής υποψηφιότητας</td>
                <td className="px-4 py-3 text-gray-700">100–500 €</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Νομικές συμβουλές / σύνταξη δηλώσεων</td>
                <td className="px-4 py-3 text-gray-700">200–500 €</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Εκλογική εκστρατεία (ελάχιστο)</td>
                <td className="px-4 py-3 text-gray-700">500–5.000 €</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Περιφερειάρχης (Περιφερειακές Εκλογές)</h2>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Προϋποθέσεις</h3>
        <p className="text-gray-700 text-sm mb-6">
          Ίδιες με τον Δήμαρχο. Επιπλέον, ο συνδυασμός πρέπει να καλύπτει συγκεκριμένο αριθμό
          υποψηφίων περιφερειακών συμβούλων ανά περιφερειακή ενότητα.
        </p>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Διαδικασία</h3>
        <div className="space-y-4 mb-6">
          {[
            'Σχηματισμός πλήρους ψηφοδελτίου με συγκεκριμένο αριθμό υποψηφίων ανά Π.Ε.',
            'Υποβολή αίτησης στο αρμόδιο Εφετείο.',
            'Κατάθεση παραβόλου (300–500 €).',
            'Υποβολή δήλωσης Πόθεν Έσχες.',
            'Συμμόρφωση με νόμους εκλογικής δαπάνης και χρηματοδότησης.',
          ].map((step, i) => (
            <div key={i} className="border-l-4 border-indigo-500 pl-4">
              <p className="text-gray-700 text-sm">
                <span className="font-semibold">{i + 1}.</span> {step}
              </p>
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Κόστη</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Κατηγορία Κόστους</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Κόστος (κατά προσέγγιση)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700">Παράβολο υποβολής</td>
                <td className="px-4 py-3 text-gray-700">300–500 €</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Σύνταξη ψηφοδελτίου &amp; νομική βοήθεια</td>
                <td className="px-4 py-3 text-gray-700">500–1.500 €</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Εκλογική εκστρατεία (ελάχιστο)</td>
                <td className="px-4 py-3 text-gray-700">2.000–20.000 €</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Βουλευτής (Βουλευτικές Εκλογές)</h2>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Προϋποθέσεις</h3>
        <div className="space-y-4 mb-6">
          <div className="border-l-4 border-indigo-500 pl-4">
            <p className="text-gray-700 text-sm">Ελληνική ιθαγένεια, δικαίωμα ψήφου.</p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <p className="text-gray-700 text-sm">Τουλάχιστον 25 ετών κατά την ημέρα των εκλογών.</p>
          </div>
          <div className="border-l-4 border-indigo-500 pl-4">
            <p className="text-gray-700 text-sm">Μη κώλυμα εκλογιμότητας (άρθρο 56 Συντάγματος).</p>
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Διαδικασία</h3>
        <div className="space-y-4 mb-6">
          {[
            'Συγκέντρωση υπογραφών υποστήριξης (12 έως 500 ανάλογα με εκλογική περιφέρεια).',
            'Υποβολή υποψηφιότητας στο Εφετείο της εκλογικής περιφέρειας.',
            'Κατάθεση παραβόλου (~500 €) — επιστρέφεται εφόσον ο υποψήφιος συγκεντρώσει ≥3% των έγκυρων ψήφων.',
            'Δήλωση εκλογικών εξόδων και πηγών χρηματοδότησης στο Ελεγκτικό Συνέδριο εντός 90 ημερών.',
            'Ανακοίνωση δήλωσης περιουσιακής κατάστασης.',
          ].map((step, i) => (
            <div key={i} className="border-l-4 border-indigo-500 pl-4">
              <p className="text-gray-700 text-sm">
                <span className="font-semibold">{i + 1}.</span> {step}
              </p>
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Κόστη</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Κατηγορία Κόστους</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Κόστος (κατά προσέγγιση)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-gray-700">Παράβολο υποβολής</td>
                <td className="px-4 py-3 text-gray-700">~500 € (επιστρέφεται υπό όρους)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-gray-700">Νομική υποστήριξη</td>
                <td className="px-4 py-3 text-gray-700">300–1.000 €</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-700">Εκλογική εκστρατεία (ελάχιστο)</td>
                <td className="px-4 py-3 text-gray-700">1.000–10.000 €</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Κοινά Βήματα (Σύνοψη)</h2>
        <div className="space-y-4">
          {[
            {
              title: 'Συγκέντρωση Δικαιολογητικών',
              desc: 'Αστυνομική ταυτότητα, πιστοποιητικό γέννησης, αντίγραφο ποινικού μητρώου, βεβαίωση μη κωλύματος.',
            },
            {
              title: 'Συλλογή Υπογραφών',
              desc: 'Ανάλογα με θέση και περιφέρεια, συλλέξτε τις υπογραφές εκλογέων που απαιτούνται.',
            },
            {
              title: 'Υποβολή μέσω gov.gr ή Δικαστηρίου',
              desc: 'Για δημοτικές/περιφερειακές εκλογές χρησιμοποιείτε gov.gr (Taxisnet). Για βουλευτικές, υποβολή στο Εφετείο.',
            },
            {
              title: 'Καταβολή Παραβόλου',
              desc: 'Μέσω e-παράβολο ή τραπεζικής κατάθεσης.',
            },
            {
              title: 'Δήλωση Πόθεν Έσχες',
              desc: 'Υποχρεωτική για όλες τις θέσεις.',
            },
            {
              title: 'Διαφάνεια Εκστρατείας',
              desc: 'Τήρηση λογαριασμού εκλογικής εκστρατείας και δήλωση εξόδων εντός νόμιμης προθεσμίας.',
            },
          ].map(({ title, desc }, i) => (
            <div key={i} className="border-l-4 border-indigo-500 pl-4">
              <h3 className="text-base font-semibold mb-1">
                {i + 1}. {title}
              </h3>
              <p className="text-gray-700 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Χρήσιμοί Σύνδεσμοι</h2>
        <div className="space-y-3">
          <a
            href="https://www.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🇬🇷</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">gov.gr</p>
              <p className="text-sm text-gray-600">Υποβολή υποψηφιότητας δημοτικών/περιφερειακών εκλογών</p>
            </div>
          </a>
          <a
            href="https://www.ypes.gov.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">🏛️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Υπουργείο Εσωτερικών</p>
              <p className="text-sm text-gray-600">Εκλογική νομοθεσία και οδηγίες</p>
            </div>
          </a>
          <a
            href="https://www.elsyn.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">⚖️</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Ελεγκτικό Συνέδριο</p>
              <p className="text-sm text-gray-600">Έλεγχος εκλογικών δαπανών βουλευτών</p>
            </div>
          </a>
          <a
            href="https://www.hellenicparliament.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <span className="text-2xl" aria-hidden="true">📋</span>
            <div>
              <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">Hellenic Parliament</p>
              <p className="text-sm text-gray-600">Πληροφορίες για υποψηφίους βουλευτές</p>
            </div>
          </a>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Σημαντική Σημείωση</h2>
        <p className="text-gray-700 text-sm">
          Οι πληροφορίες σε αυτή τη σελίδα είναι ενημερωτικού χαρακτήρα και δεν αποτελούν νομική
          συμβουλή. Τα κόστη και οι διαδικασίες ενδέχεται να τροποποιηθούν με νόμο. Για ακριβείς
          και επικαιροποιημένες πληροφορίες, απευθυνθείτε στο Υπουργείο Εσωτερικών, στο αρμόδιο
          Πρωτοδικείο/Εφετείο ή στο gov.gr.
        </p>
      </section>
    </StaticPageLayout>
  );
}
