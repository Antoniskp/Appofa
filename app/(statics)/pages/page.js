import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import {
  AcademicCapIcon,
  CodeBracketIcon,
  FlagIcon,
  LifebuoyIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

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

const sections = [
  {
    href: '/platform',
    title: 'Πλατφόρμα',
    description:
      'Πληροφορίες, κανόνες, συμμετοχή, οδηγίες χρήσης και νομικά θέματα για την πλατφόρμα Απόφαση.',
    Icon: WrenchScrewdriverIcon,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
  },
  {
    href: '/citizen-help',
    title: 'Βοήθεια Πολίτη',
    description:
      'Πρακτικοί οδηγοί για φορολογία, εργασία, μεταβιβάσεις ακινήτων, ψηφιακές υπηρεσίες και πολλά άλλα.',
    Icon: LifebuoyIcon,
    color: 'text-green-700',
    bg: 'bg-green-50',
  },
  {
    href: '/elections',
    title: 'Εκλογές & Πολιτική',
    description:
      'Πολιτικά κόμματα, εκλογές, αξιωματούχοι και θεσμοί της Ελληνικής Δημοκρατίας.',
    Icon: FlagIcon,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
  },
  {
    href: '/education',
    title: 'Εκπαίδευση',
    description:
      'Πληροφορίες για το ελληνικό εκπαιδευτικό σύστημα, τις βαθμίδες εκπαίδευσης και προτάσεις βελτίωσης.',
    Icon: AcademicCapIcon,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
  },
  {
    href: '/github-files',
    title: 'Αρχεία GitHub',
    description:
      'Άμεσοι σύνδεσμοι προς τα αρχεία του αποθετηρίου που αλλάζουν συχνά — κατηγορίες, χρώματα, μεταφράσεις και ρυθμίσεις.',
    Icon: CodeBracketIcon,
    color: 'text-gray-700',
    bg: 'bg-gray-100',
  },
];

export default function PagesHubPage() {
  return (
    <StaticPageLayout title="Σελίδες" maxWidth="max-w-3xl" showHelpfulLinks={false}>
      <p className="text-xl text-gray-700 leading-relaxed -mt-2">
        Όλες οι πληροφορίες, οδηγίες και θεματικές ενότητες της πλατφόρμας Απόφαση.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mt-8">
        {sections.map(({ href, title, description, Icon, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-4 border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all group bg-white"
          >
            <div className={`w-12 h-12 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                {title}
                <span aria-hidden="true" className="text-gray-400 group-hover:text-blue-400">
                  →
                </span>
              </h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </StaticPageLayout>
  );
}
