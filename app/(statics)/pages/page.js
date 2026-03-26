import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Σελίδες - Απόφαση',
  description: 'Όλες οι πληροφορίες, οδηγίες και θεματικές σελίδες της πλατφόρμας Απόφαση σε κατηγορίες.',
  openGraph: {
    title: 'Σελίδες - Απόφαση',
    description: 'Όλες οι πληροφορίες, οδηγίες και θεματικές σελίδες της πλατφόρμας Απόφαση σε κατηγορίες.',
    url: `${SITE_URL}/pages`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Σελίδες - Απόφαση',
    description: 'Όλες οι πληροφορίες, οδηγίες και θεματικές σελίδες της πλατφόρμας Απόφαση σε κατηγορίες.',
  },
  alternates: {
    canonical: `${SITE_URL}/pages`,
  },
};

const categories = [
  {
    title: 'Πληροφορίες',
    icon: '📖',
    pages: [
      {
        href: '/about',
        title: 'Σχετικά με εμάς',
        description: 'Η ιστορία, το όραμα και η ομάδα πίσω από την πλατφόρμα Απόφαση.',
      },
      {
        href: '/mission',
        title: 'Αποστολή',
        description: 'Η αποστολή και οι στόχοι μας για μια διαφανή και συμμετοχική κοινότητα.',
      },
      {
        href: '/transparency',
        title: 'Διαφάνεια',
        description: 'Πώς λειτουργούμε, ποιες αρχές ακολουθούμε και πώς διαχειριζόμαστε το περιεχόμενο.',
      },
      {
        href: '/categories',
        title: 'Κατηγορίες',
        description: 'Όλες οι κατηγορίες άρθρων, ειδήσεων και ψηφοφοριών. Προτείνετε νέες κατηγορίες μέσω GitHub.',
      },
    ],
  },
  {
    title: 'Βοήθεια / Οδηγίες',
    icon: '🛟',
    pages: [
      {
        href: '/instructions',
        title: 'Οδηγίες Χρήσης',
        description: 'Οδηγός για νέους χρήστες: πώς να δημιουργήσετε λογαριασμό, άρθρο ή ψηφοφορία.',
      },
      {
        href: '/faq',
        title: 'Συχνές Ερωτήσεις (FAQ)',
        description: 'Απαντήσεις στις πιο συχνές ερωτήσεις για τη χρήση της πλατφόρμας.',
      },
    ],
  },
  {
    title: 'Συμμετοχή',
    icon: '🤝',
    pages: [
      {
        href: '/contribute',
        title: 'Συνεισφορά',
        description: 'Μάθετε πώς μπορείτε να βοηθήσετε στην ανάπτυξη και βελτίωση της πλατφόρμας.',
      },
      {
        href: '/become-moderator',
        title: 'Γίνε Συντονιστής',
        description: 'Πληροφορίες για όσους ενδιαφέρονται να αναλάβουν ρόλο συντονιστή στην κοινότητα.',
      },
    ],
  },
  {
    title: 'Θεματικές (με σχόλια)',
    icon: '💬',
    description: 'Ενημερωτικές σελίδες με δυνατότητα σχολιασμού από την κοινότητα.',
    pages: [
      {
        href: '/economy',
        title: 'Οικονομία',
        description: 'Βασικές έννοιες, τάσεις και ανάλυση της ελληνικής και παγκόσμιας οικονομίας.',
      },
      {
        href: '/education',
        title: 'Εκπαίδευση',
        description: 'Το εκπαιδευτικό σύστημα, προκλήσεις και προτάσεις για τη βελτίωσή του.',
      },
      {
        href: '/price-comparison',
        title: 'Σύγκριση Τιμών',
        description: 'Πληροφορίες και αναλύσεις για τις τιμές καταναλωτικών αγαθών στην Ελλάδα.',
      },
      {
        href: '/car-transfer',
        title: 'Αγορά & Μεταβίβαση Αυτοκινήτου',
        description: 'Πλήρης οδηγός για αγορά, πώληση και μεταβίβαση αυτοκινήτου στην Ελλάδα — έγγραφα, κόστη, φόροι.',
      },
      {
        href: '/boat-transfer',
        title: 'Αγορά & Μεταβίβαση Σκάφους',
        description: 'Πλήρης οδηγός για αγορά, πώληση και μεταβίβαση σκάφους αναψυχής στην Ελλάδα — νηολόγηση, έγγραφα, κόστη.',
      },
      {
        href: '/property-transfer',
        title: 'Αγορά & Μεταβίβαση Ακινήτου',
        description: 'Πλήρης οδηγός για αγορά, πώληση και μεταβίβαση γης, κατοικίας ή κτιρίου στην Ελλάδα — συμβολαιογράφος, φόροι, Κτηματολόγιο.',
      },
    ],
  },
  {
    title: 'Νομικά / Κανόνες',
    icon: '⚖️',
    pages: [
      {
        href: '/terms',
        title: 'Όροι Χρήσης',
        description: 'Οι νομικοί όροι που διέπουν τη χρήση της πλατφόρμας.',
      },
      {
        href: '/privacy',
        title: 'Πολιτική Απορρήτου',
        description: 'Πώς συλλέγουμε, χρησιμοποιούμε και προστατεύουμε τα δεδομένα σας.',
      },
      {
        href: '/rules',
        title: 'Κανόνες Κοινότητας',
        description: 'Οι κανόνες συμπεριφοράς και περιεχομένου για όλα τα μέλη της κοινότητας.',
      },
    ],
  },
  {
    title: 'Επικοινωνία',
    icon: '✉️',
    pages: [
      {
        href: '/contact',
        title: 'Επικοινωνία',
        description: 'Στείλτε μας μήνυμα ή επικοινωνήστε μέσω Discord για άμεση βοήθεια.',
      },
    ],
  },
];

export default function PagesHubPage() {
  return (
    <StaticPageLayout title="Σελίδες" maxWidth="max-w-5xl" showHelpfulLinks={false}>
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Όλες οι πληροφορίες, οδηγίες και θεματικές ενότητες της πλατφόρμας Απόφαση σε κατηγορίες.
        </p>
      </section>

      {categories.map((category) => (
        <section key={category.title}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl" aria-hidden="true">{category.icon}</span>
            <h2 className="text-2xl font-semibold">{category.title}</h2>
          </div>
          {category.description && (
            <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.pages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-all group"
              >
                <h3 className="font-semibold text-blue-900 group-hover:text-blue-600 mb-1 transition-colors flex items-center justify-between">
                  {page.title}
                  <span aria-hidden="true" className="text-gray-400 group-hover:text-blue-400 transition-colors">→</span>
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{page.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </StaticPageLayout>
  );
}
