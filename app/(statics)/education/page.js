import StaticPageLayout from '@/components/StaticPageLayout';
import CommentsThread from '@/components/comments/CommentsThread';

export const metadata = {
  title: 'Εκπαίδευση - Απόφαση',
  description: 'Το εκπαιδευτικό σύστημα, προκλήσεις και προτάσεις για τη βελτίωσή του.',
};

// entityType and entityId used to scope comments to this specific page
const COMMENTS_ENTITY_TYPE = 'page';
const COMMENTS_ENTITY_ID = 'education';

export default function EducationPage() {
  return (
    <StaticPageLayout title="Εκπαίδευση" maxWidth="max-w-4xl">
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Η εκπαίδευση είναι θεμέλιο κάθε κοινωνίας. Εδώ παρουσιάζουμε πληροφορίες για το ελληνικό
          εκπαιδευτικό σύστημα, τις προκλήσεις που αντιμετωπίζει και προτάσεις βελτίωσης.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Το Εκπαιδευτικό Σύστημα στην Ελλάδα</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            Η δημόσια εκπαίδευση στην Ελλάδα είναι υποχρεωτική για 11 χρόνια και δωρεάν σε όλες τις
            βαθμίδες, από το νηπιαγωγείο ως το λύκειο. Το ελληνικό κράτος διαθέτει επίσης δίκτυο
            δημόσιων πανεπιστημίων και ΤΕΙ.
          </p>
          <p className="text-gray-700">
            Παρά τη διαθεσιμότητά του, το σύστημα αντιμετωπίζει χρόνιες προκλήσεις: υποχρηματοδότηση,
            αναντιστοιχία δεξιοτήτων με αγορά εργασίας, και ανισότητες μεταξύ αστικών και αγροτικών
            περιοχών.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Βαθμίδες Εκπαίδευσης</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🏫 Πρωτοβάθμια</h3>
            <p className="text-gray-700 text-sm">
              Νηπιαγωγείο (4–6 ετών) και Δημοτικό Σχολείο (6–12 ετών). Βάση αλφαβητισμού και
              βασικών γνώσεων.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">📚 Δευτεροβάθμια</h3>
            <p className="text-gray-700 text-sm">
              Γυμνάσιο (12–15 ετών) και Λύκειο (15–18 ετών). Ολοκλήρωση υποχρεωτικής εκπαίδευσης
              και προετοιμασία για τριτοβάθμιο επίπεδο.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">🎓 Τριτοβάθμια</h3>
            <p className="text-gray-700 text-sm">
              Πανεπιστήμια, ΤΕΙ (νυν Πανεπιστήμια μετά τον Ν. 4610/2019) και Μεταπτυχιακά
              προγράμματα. Εξειδίκευση σε επιστημονικά και τεχνικά πεδία.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2 text-indigo-700">💻 Δια Βίου Μάθηση</h3>
            <p className="text-gray-700 text-sm">
              Ενήλικη εκπαίδευση, επαγγελματική κατάρτιση και ψηφιακές πλατφόρμες μάθησης που
              επιτρέπουν συνεχή ανάπτυξη δεξιοτήτων.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Προκλήσεις & Προτάσεις</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ψηφιακός Μετασχηματισμός</h3>
            <p className="text-gray-700 text-sm">
              Ενσωμάτωση ψηφιακών εργαλείων στην εκπαίδευση, ενίσχυση υποδομών και κατάρτιση
              εκπαιδευτικών σε νέες τεχνολογίες.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Αναδιάρθρωση Αναλυτικών Προγραμμάτων</h3>
            <p className="text-gray-700 text-sm">
              Ενημέρωση της ύλης ώστε να αντανακλά τις σύγχρονες ανάγκες: κριτική σκέψη, πολιτική
              αγωγή, οικονομικός αλφαβητισμός και STEM.
            </p>
          </div>

          <div className="border-l-4 border-indigo-500 pl-4">
            <h3 className="text-lg font-semibold mb-1">Ισότητα Ευκαιριών</h3>
            <p className="text-gray-700 text-sm">
              Μείωση ανισοτήτων μεταξύ αστικών και αγροτικών σχολείων, ενίσχυση υποτροφιών και
              στήριξη μαθητών από ευάλωτες ομάδες.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Μοιράσου την άποψή σου</h2>
        <p className="text-gray-700 text-sm">
          Η εκπαίδευση αφορά όλους. Συμμετέχοντας στη συζήτηση παρακάτω, βοηθάς να διαμορφωθεί
          μια κοινή αντίληψη για τις αλλαγές που χρειάζεται το σύστημα.
        </p>
      </section>

      <CommentsThread
        entityType={COMMENTS_ENTITY_TYPE}
        entityId={COMMENTS_ENTITY_ID}
      />
    </StaticPageLayout>
  );
}
