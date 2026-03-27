import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Ροές Εφαρμογής | Appofa',
  description:
    'Κατανοήστε τις κύριες ροές της εφαρμογής Appofa — εγγραφή, δημιουργία άρθρου, έγκριση ειδήσεων, δημοσκοπήσεις και περισσότερα.',
  openGraph: {
    url: `${SITE_URL}/platform/flows`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Ροές Εφαρμογής | Appofa',
    description:
      'Κατανοήστε τις κύριες ροές της εφαρμογής Appofa — εγγραφή, δημιουργία άρθρου, έγκριση ειδήσεων, δημοσκοπήσεις και περισσότερα.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ροές Εφαρμογής | Appofa',
    description:
      'Κατανοήστε τις κύριες ροές της εφαρμογής Appofa — εγγραφή, δημιουργία άρθρου, έγκριση ειδήσεων, δημοσκοπήσεις και περισσότερα.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/flows`,
  },
};

const flows = [
  {
    id: 1,
    title: 'Εγγραφή & Σύνδεση',
    steps: [
      'Συμπλήρωση φόρμας εγγραφής (username, email, password)',
      'Επαλήθευση email',
      'Σύνδεση — ο server εκδίδει JWT αποθηκευμένο σε HttpOnly cookie',
      'Πρόσβαση σε προστατευμένο περιεχόμενο',
    ],
  },
  {
    id: 2,
    title: 'Δημιουργία Άρθρου',
    steps: [
      'Ο χρήστης επιλέγει τύπο: personal, articles (εκπαιδευτικό), ή news',
      'Συμπλήρωση τίτλου, περιεχομένου, κατηγορίας',
      'Αποθήκευση ως πρόχειρο (draft)',
      'Δημοσίευση (published)',
      'Αρχειοθέτηση (archived)',
    ],
  },
  {
    id: 3,
    title: 'Έγκριση Ειδήσεων',
    steps: [
      'Editor/Viewer υποβάλλει άρθρο τύπου news',
      'Το άρθρο μπαίνει σε ουρά αναμονής',
      'Admin ελέγχει και εγκρίνει ή απορρίπτει',
      'Αν εγκριθεί: δημοσιεύεται στο κοινό · Αν απορριφθεί: επιστρέφει στον δημιουργό',
    ],
  },
  {
    id: 4,
    title: 'Δημοσκοπήσεις',
    steps: [
      'Χρήστης δημιουργεί ψηφοφορία (ερώτηση + επιλογές)',
      'Δημοσίευση και εμφάνιση σε όλους',
      'Χρήστες ψηφίζουν (μία ψήφος ανά χρήστη)',
      'Αποτελέσματα ορατά δημόσια',
    ],
  },
  {
    id: 5,
    title: 'Bookmarks & Το Περιεχόμενό μου',
    steps: [
      'Χρήστης αποθηκεύει άρθρα με bookmark',
      'Προβολή αποθηκευμένων',
      'Διαχείριση ιδίων ειδήσεων (/my-news)',
      'Διαχείριση ψηφοφοριών (/my-polls)',
      'Προβολή ψήφων (/my-votes)',
    ],
  },
];

export default function FlowsPage() {
  return (
    <StaticPageLayout
      title="Ροές Εφαρμογής"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Κατανοήστε πώς λειτουργούν οι κύριες ροές της εφαρμογής Appofa — από την εγγραφή και τη
        δημιουργία περιεχομένου έως την έγκριση ειδήσεων και τις δημοσκοπήσεις.
      </p>

      <div className="space-y-8">
        {flows.map((flow) => (
          <section key={flow.id}>
            <div className="rounded-xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
                <h2 className="text-lg font-semibold text-indigo-900">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold mr-3">
                    {flow.id}
                  </span>
                  {flow.title}
                </h2>
              </div>

              {/* Steps */}
              <div className="px-6 py-5">
                <ol className="flex flex-wrap items-start gap-y-4">
                  {flow.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 flex-wrap">
                      <span className="flex items-start gap-2">
                        <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700 text-sm leading-relaxed">{step}</span>
                      </span>
                      {idx < flow.steps.length - 1 && (
                        <ChevronRightIcon
                          className="h-4 w-4 text-indigo-300 flex-shrink-0 mt-1 mx-1"
                          aria-hidden="true"
                        />
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        ))}
      </div>
    </StaticPageLayout>
  );
}
