import Link from 'next/link';
import {
  NewspaperIcon,
  VideoCameraIcon,
  ChartBarIcon,
  BookmarkIcon,
  StarIcon,
  MapPinIcon,
  UserCircleIcon,
  KeyIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Ενότητες Εφαρμογής | Appofa',
  description:
    'Εξερευνήστε τις ενότητες της εφαρμογής Appofa — περιεχόμενο, συμμετοχή, κοινότητα, τοποθεσίες, λογαριασμός και διαχείριση.',
  openGraph: {
    url: `${SITE_URL}/platform/modules`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Ενότητες Εφαρμογής | Appofa',
    description:
      'Εξερευνήστε τις ενότητες της εφαρμογής Appofa — περιεχόμενο, συμμετοχή, κοινότητα, τοποθεσίες, λογαριασμός και διαχείριση.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ενότητες Εφαρμογής | Appofa',
    description:
      'Εξερευνήστε τις ενότητες της εφαρμογής Appofa — περιεχόμενο, συμμετοχή, κοινότητα, τοποθεσίες, λογαριασμός και διαχείριση.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/modules`,
  },
};

const categories = [
  {
    title: '📰 Περιεχόμενο',
    pages: [
      { href: '/news', label: 'Ειδήσεις', description: 'Δημόσιες ειδήσεις εγκεκριμένες από admin', Icon: NewspaperIcon },
      { href: '/articles', label: 'Άρθρα', description: 'Εκπαιδευτικά άρθρα από την κοινότητα', Icon: DocumentTextIcon },
      { href: '/videos', label: 'Βίντεο', description: 'Βίντεο από YouTube και TikTok', Icon: VideoCameraIcon },
    ],
  },
  {
    title: '🗳️ Συμμετοχή',
    pages: [
      { href: '/polls', label: 'Δημοσκοπήσεις', description: 'Ψηφίστε και δημιουργήστε ψηφοφορίες', Icon: ChartBarIcon },
    ],
  },
  {
    title: '👥 Κοινότητα',
    pages: [
      { href: '/worthy-citizens', label: 'Αξιόλογοι Πολίτες', description: 'Αξιόλογες προσωπικότητες της κοινότητας', Icon: StarIcon },
      { href: '/bookmarks', label: 'Σελιδοδείκτες', description: 'Αποθηκευμένα άρθρα', Icon: BookmarkIcon },
    ],
  },
  {
    title: '🗺️ Τοποθεσίες',
    pages: [
      { href: '/locations', label: 'Τοποθεσίες', description: 'Ιεραρχικό σύστημα: Χώρα → Νομός → Δήμος', Icon: MapPinIcon },
    ],
  },
  {
    title: '🔐 Λογαριασμός',
    pages: [
      { href: '/register', label: 'Εγγραφή', description: 'Δημιουργία νέου λογαριασμού', Icon: UserCircleIcon },
      { href: '/login', label: 'Σύνδεση', description: 'Είσοδος στην πλατφόρμα', Icon: KeyIcon },
      { href: '/profile', label: 'Προφίλ', description: 'Διαχείριση του λογαριασμού σας', Icon: UserGroupIcon },
    ],
  },
  {
    title: '🛠️ Διαχείριση',
    pages: [
      { href: '/admin', label: 'Admin Panel', description: 'Διαχείριση χρηστών, ειδήσεων, τοποθεσιών', Icon: WrenchScrewdriverIcon },
    ],
  },
];

export default function ModulesPage() {
  return (
    <StaticPageLayout
      title="Ενότητες Εφαρμογής"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Εξερευνήστε όλες τις ενότητες και σελίδες της εφαρμογής Appofa — από το περιεχόμενο και
        τη συμμετοχή έως τον λογαριασμό και τη διαχείριση.
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
