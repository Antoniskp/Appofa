import Link from 'next/link';
import {
  BuildingLibraryIcon,
  UserCircleIcon,
  CurrencyEuroIcon,
  MapIcon,
  GlobeAltIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Εκλογές & Πολιτική | Appofa',
  description:
    'Πληροφορίες για τις εκλογές, τα πολιτικά κόμματα, τους αξιωματούχους και τους θεσμούς της Ελληνικής Δημοκρατίας.',
  openGraph: {
    title: 'Εκλογές & Πολιτική | Appofa',
    description:
      'Πληροφορίες για τις εκλογές, τα πολιτικά κόμματα, τους αξιωματούχους και τους θεσμούς της Ελληνικής Δημοκρατίας.',
    url: `${SITE_URL}/elections`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Εκλογές & Πολιτική | Appofa',
    description:
      'Πληροφορίες για τις εκλογές, τα πολιτικά κόμματα, τους αξιωματούχους και τους θεσμούς της Ελληνικής Δημοκρατίας.',
  },
  alternates: {
    canonical: `${SITE_URL}/elections`,
  },
};

const categories = [
  {
    title: '🗳️ Εκλογές & Κόμματα',
    pages: [
      {
        href: '/elections/political-parties',
        label: 'Πολιτικά Κόμματα',
        description: 'Τα ενεργά πολιτικά κόμματα στην Ελλάδα',
        Icon: FlagIcon,
      },
      {
        href: '/citizen-help/independent-candidate',
        label: 'Ανεξάρτητος Υποψήφιος',
        description: 'Διαδικασίες & κόστη για υποψηφιότητα χωρίς κόμμα',
        Icon: UserCircleIcon,
      },
      {
        href: '/citizen-help/prefecture-seats',
        label: 'Έδρες ανά Περιφέρεια',
        description: 'Πόσοι βουλευτές εκλέγονται σε κάθε εκλογική περιφέρεια',
        Icon: MapIcon,
      },
      {
        href: '/citizen-help/regions-electoral-map',
        label: 'Περιφέρειες & Εκλογικές Περιφέρειες',
        description: 'Χαρτογράφηση Περιφερειών με εκλογικές περιφέρειες & ανάλυση',
        Icon: GlobeAltIcon,
      },
    ],
  },
  {
    title: '🏛️ Αξιωματούχοι & Θεσμοί',
    pages: [
      {
        href: '/citizen-help/government-positions',
        label: 'Κυβερνητικές Θέσεις',
        description: 'Ποιος κατέχει ποια θέση — Πρόεδρος, ΠΜ, Υπουργοί',
        Icon: BuildingLibraryIcon,
      },
      {
        href: '/citizen-help/public-officials-salaries',
        label: 'Αμοιβές Αξιωματούχων',
        description: 'Μισθοί & παροχές ΠΜ, Υπουργών, Βουλευτών, Περιφερειαρχών, Δημάρχων',
        Icon: CurrencyEuroIcon,
      },
    ],
  },
];

export default function ElectionsPage() {
  return (
    <StaticPageLayout
      title="Εκλογές & Πολιτική"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
    >
      <p className="text-lg text-gray-700 -mt-6">
        Πληροφορίες για τις εκλογές, τα πολιτικά κόμματα, τους αξιωματούχους και τους θεσμούς
        της Ελληνικής Δημοκρατίας.
      </p>

      <div className="space-y-10">
        {categories.map(({ title, pages }) => (
          <section key={title}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages.map(({ href, label, description, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <span className="mt-0.5 flex-shrink-0 p-2 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold text-blue-900 group-hover:text-blue-700 transition-colors">
                      {label}
                    </span>
                    <span className="block text-sm text-gray-600 mt-0.5">{description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </StaticPageLayout>
  );
}
