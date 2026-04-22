import Link from 'next/link';
import {
  NewspaperIcon,
  ChartBarIcon,
  MapPinIcon,
  StarIcon,
  VideoCameraIcon,
  BookmarkIcon,
  CogIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Χαρακτηριστικά Πλατφόρμας | Appofa',
  description:
    'Ανακαλύψτε όλα τα χαρακτηριστικά της πλατφόρμας Appofa — ειδήσεις, δημοσκοπήσεις, τοποθεσίες, ασφάλεια και περισσότερα.',
  openGraph: {
    url: `${SITE_URL}/platform/features`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Χαρακτηριστικά Πλατφόρμας | Appofa',
    description:
      'Ανακαλύψτε όλα τα χαρακτηριστικά της πλατφόρμας Appofa — ειδήσεις, δημοσκοπήσεις, τοποθεσίες, ασφάλεια και περισσότερα.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Χαρακτηριστικά Πλατφόρμας | Appofa',
    description:
      'Ανακαλύψτε όλα τα χαρακτηριστικά της πλατφόρμας Appofa — ειδήσεις, δημοσκοπήσεις, τοποθεσίες, ασφάλεια και περισσότερα.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/features`,
  },
};

const features = [
  {
    Icon: NewspaperIcon,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Ειδήσεις & Άρθρα',
    description:
      'Συγκέντρωση τοπικών ειδήσεων, δημιουργία άρθρων και εκπαιδευτικό περιεχόμενο από την κοινότητα. Υποστηρίζονται τύποι: personal, articles, news και video.',
    link: null,
  },
  {
    Icon: ChartBarIcon,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    title: 'Δημοσκοπήσεις',
    description:
      'Δημοτικές ψηφοφορίες για κοινοτικά θέματα. Κάθε χρήστης μπορεί να ψηφίσει μία φορά και τα αποτελέσματα είναι δημόσια και ορατά σε όλους.',
    link: '/polls',
    linkLabel: 'Δες τις δημοσκοπήσεις →',
  },
  {
    Icon: MapPinIcon,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Τοποθεσίες',
    description:
      'Γεωεπισήμανση περιεχομένου ανά Χώρα, Νομό και Δήμο. Φιλτράρισμα ειδήσεων και άρθρων ανά γεωγραφική περιοχή για εντοπισμένη ενημέρωση.',
    link: null,
  },
  {
    Icon: StarIcon,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    title: 'Αναγνωρισμένοι από την Κοινότητα',
    description:
      'Ανακαλύψτε πολίτες που έχουν αναγνωριστεί από την κοινότητα ανά θεματική περιοχή μέσω εγκρίσεων.',
    link: '/worthy-citizens',
    linkLabel: 'Εξερεύνησε →',
  },
  {
    Icon: VideoCameraIcon,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    title: 'Βίντεο',
    description:
      'Ενσωμάτωση βίντεο από YouTube και TikTok απευθείας στην πλατφόρμα. Παρακολουθήστε περιεχόμενο χωρίς να φύγετε από την εφαρμογή.',
    link: '/videos',
    linkLabel: 'Δες βίντεο →',
  },
  {
    Icon: BookmarkIcon,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
    title: 'Σελιδοδείκτες',
    description:
      'Αποθηκεύστε άρθρα για μελλοντική ανάγνωση με ένα κλικ. Πρόσβαση σε όλους τους σελιδοδείκτες σας από το προφίλ σας ανά πάσα στιγμή.',
    link: null,
  },
  {
    Icon: CogIcon,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    title: 'Διαχείριση',
    description:
      'Πλήρες admin dashboard για έγκριση και απόρριψη ειδήσεων, διαχείριση χρηστών και ρόλων, καθώς και διαχείριση ιεραρχίας τοποθεσιών.',
    link: null,
  },
  {
    Icon: ShieldCheckIcon,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    title: 'Ασφάλεια',
    description:
      'Προστασία CSRF, JWT αποθηκευμένο σε HttpOnly cookies, rate limiting αιτημάτων και role-based έλεγχος πρόσβασης σε όλα τα endpoints.',
    link: null,
  },
];

export default function FeaturesPage() {
  return (
    <StaticPageLayout
      title="Χαρακτηριστικά Πλατφόρμας"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Ανακαλύψτε όλες τις δυνατότητες της πλατφόρμας Appofa — από τη δημοσίευση ειδήσεων και τις
        δημοτικές ψηφοφορίες έως την ασφάλεια και τη διαχείριση περιεχομένου.
      </p>

      <section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ Icon, iconBg, iconColor, title, description, link, linkLabel }) => (
            <div
              key={title}
              className="flex flex-col gap-3 p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconBg}`}>
                <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
              </span>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 mb-1">{title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
              </div>
              {link && (
                <Link
                  href={link}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  {linkLabel}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
}
