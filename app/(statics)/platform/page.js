import Link from 'next/link';
import {
  InformationCircleIcon,
  StarIcon,
  HandRaisedIcon,
  UserGroupIcon,
  BookOpenIcon,
  EyeIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  LockClosedIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  UsersIcon,
  CubeIcon,
  SparklesIcon,
  PuzzlePieceIcon,
  NewspaperIcon,
  CurrencyEuroIcon,
  TrophyIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

export const metadata = {
  title: 'Πλατφόρμα | Appofa',
  description: 'Μάθετε περισσότερα για την πλατφόρμα Appofa — αποστολή, κανόνες, συνεισφορά και επικοινωνία.',
};

const categories = [
  {
    title: '🗺️ Οδηγός Πλατφόρμας',
    pages: [
      { href: '/platform/flows', label: 'Ροές Εφαρμογής', description: 'Πώς λειτουργούν οι κύριες ροές', Icon: ArrowPathIcon },
      { href: '/platform/roles', label: 'Ρόλοι Χρηστών', description: 'Δικαιώματα και ρόλοι (viewer, editor, admin)', Icon: UsersIcon },
      { href: '/platform/objects', label: 'Αντικείμενα', description: 'Άρθρα, χρήστες, ψηφοφορίες, τοποθεσίες', Icon: CubeIcon },
      { href: '/platform/features', label: 'Χαρακτηριστικά', description: 'Όλες οι δυνατότητες της πλατφόρμας', Icon: SparklesIcon },
      { href: '/platform/modules', label: 'Ενότητες Εφαρμογής', description: 'Όλες οι ενότητες και σελίδες της εφαρμογής', Icon: PuzzlePieceIcon },
      { href: '/platform/cost', label: 'Κόστος & Ώρες', description: 'Εκτιμώμενο κόστος ανάπτυξης και συντήρησης', Icon: CurrencyEuroIcon },
      { href: '/platform/badges', label: 'Badges & Επιτεύγματα', description: 'Σύστημα badges και τρόπος απόκτησης', Icon: TrophyIcon },
      { href: '/github-files', label: 'Αρχεία GitHub', description: 'Άμεσοι σύνδεσμοι σε αρχεία που αλλάζουν συχνά — κατηγορίες, χρώματα, μεταφράσεις', Icon: CodeBracketIcon },
    ],
  },
  {
    title: '📖 Πληροφορίες',
    pages: [
      { href: '/about', label: 'Σχετικά με εμάς', description: 'Ποιοι είμαστε και τι κάνουμε', Icon: InformationCircleIcon },
      { href: '/mission', label: 'Αποστολή μας', description: 'Η αποστολή και το όραμα της πλατφόρμας', Icon: StarIcon },
      { href: '/transparency', label: 'Διαφάνεια', description: 'Πολιτική διαφάνειας', Icon: EyeIcon },
    ],
  },
  {
    title: '🤝 Συμμετοχή',
    pages: [
      { href: '/contribute', label: 'Συνεισφορά', description: 'Πώς μπορείτε να βοηθήσετε', Icon: HandRaisedIcon },
      { href: '/become-moderator', label: 'Γίνε Συντονιστής', description: 'Πληροφορίες για τους moderators', Icon: UserGroupIcon },
      { href: '/reporters', label: 'Δημοσιογράφοι & Συντάκτες', description: 'Αίτηση και οδηγίες για δημοσιογράφους', Icon: NewspaperIcon },
    ],
  },
  {
    title: '📋 Οδηγίες & Υποστήριξη',
    pages: [
      { href: '/instructions', label: 'Οδηγίες Χρήσης', description: 'Πώς να χρησιμοποιήσετε την πλατφόρμα', Icon: BookOpenIcon },
      { href: '/faq', label: 'Συχνές Ερωτήσεις', description: 'Απαντήσεις σε συνήθη ερωτήματα', Icon: QuestionMarkCircleIcon },
      { href: '/contact', label: 'Επικοινωνία', description: 'Τρόποι επικοινωνίας μαζί μας', Icon: EnvelopeIcon },
    ],
  },
  {
    title: '⚖️ Κανόνες & Νομικά',
    pages: [
      { href: '/rules', label: 'Κανόνες Κοινότητας', description: 'Κανόνες και οδηγίες κοινότητας', Icon: ShieldCheckIcon },
      { href: '/privacy', label: 'Πολιτική Απορρήτου', description: 'GDPR και προστασία δεδομένων', Icon: LockClosedIcon },
      { href: '/terms', label: 'Όροι Χρήσης', description: 'Όροι και προϋποθέσεις χρήσης', Icon: DocumentTextIcon },
    ],
  },
];

export default function PlatformPage() {
  return (
    <StaticPageLayout
      title="Πλατφόρμα"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
    >
      <p className="text-lg text-gray-700 -mt-6">
        Μάθετε περισσότερα για την πλατφόρμα Appofa — αποστολή, κανόνες, συνεισφορά και επικοινωνία.
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
