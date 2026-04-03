import Link from 'next/link';
import {
  NewspaperIcon,
  MegaphoneIcon,
  VideoCameraIcon,
  ChartBarIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  UsersIcon,
  BookmarkIcon,
  TrophyIcon,
  MapPinIcon,
  KeyIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
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

const sections = [
  {
    title: '📰 Περιεχόμενο',
    modules: [
      {
        href: '/articles',
        label: 'Άρθρα',
        description:
          'Δημιουργήστε, διαβάστε και διαχειριστείτε εκπαιδευτικά άρθρα. Υποστηρίζονται τρεις τύποι: Προσωπικά, Άρθρα και Ειδήσεις, με καταστάσεις πρόχειρο, δημοσιευμένο και αρχειοθετημένο.',
        Icon: NewspaperIcon,
      },
      {
        href: '/news',
        label: 'Ειδήσεις',
        description:
          'Άρθρα ειδήσεων που απαιτούν έγκριση από διαχειριστή πριν δημοσιευτούν. Διασφαλίζεται η εγκυρότητα του περιεχομένου.',
        Icon: MegaphoneIcon,
      },
      {
        href: '/videos',
        label: 'Βίντεο',
        description:
          'Ενσωματώστε βίντεο από YouTube ή TikTok ως αυτόνομες γρήγορες αναρτήσεις ή μέσα σε άρθρα.',
        Icon: VideoCameraIcon,
      },
    ],
  },
  {
    title: '🗳️ Συμμετοχή',
    modules: [
      {
        href: '/polls',
        label: 'Ψηφοφορίες',
        description:
          'Δημιουργήστε απλές ή σύνθετες ψηφοφορίες, ψηφίστε και δείτε αποτελέσματα με γραφήματα Chart.js. Υποστηρίζεται εξαγωγή ελέγχου ψηφοφορίας.',
        Icon: ChartBarIcon,
      },
      {
        href: '/suggestions',
        label: 'Προτάσεις & Λύσεις',
        description:
          'Υποβάλετε ιδέες ή προβλήματα. Άλλοι χρήστες μπορούν να ψηφίσουν υπέρ ή κατά και να δημοσιεύσουν λύσεις.',
        Icon: LightBulbIcon,
      },
      {
        href: '/articles',
        label: 'Σχόλια',
        description:
          'Σχολιάστε άρθρα και συμμετέχετε στη συζήτηση της κοινότητας απευθείας κάτω από κάθε ανάρτηση.',
        Icon: ChatBubbleLeftRightIcon,
      },
      {
        href: '/articles',
        label: 'Αξιολογήσεις',
        description:
          'Αντιδράστε και αξιολογήστε άρθρα εκφράζοντας την άποψή σας μέσα από το σύστημα endorsements.',
        Icon: HandThumbUpIcon,
      },
    ],
  },
  {
    title: '👥 Κοινότητα',
    modules: [
      {
        href: '/users',
        label: 'Χρήστες & Follows',
        description:
          'Περιηγηθείτε σε προφίλ χρηστών και ακολουθήστε ή διακόψετε την παρακολούθηση άλλων μελών της κοινότητας.',
        Icon: UsersIcon,
      },
      {
        href: '/bookmarks',
        label: 'Αποθηκευμένα',
        description:
          'Αποθηκεύστε άρθρα και ψηφοφορίες για να τα διαβάσετε ή να τα επισκεφτείτε ξανά αργότερα.',
        Icon: BookmarkIcon,
      },
      {
        href: '/worthy-citizens',
        label: 'Άξιοι Πολίτες',
        description:
          'Ανακαλύψτε τα αξιόλογα μέλη της κοινότητας που αναδεικνύονται για τη συνεισφορά τους στην πλατφόρμα.',
        Icon: TrophyIcon,
      },
      {
        href: '/platform/badges',
        label: 'Badges & Επιτεύγματα',
        description:
          'Κερδίστε badges για τη δραστηριότητά σας στην πλατφόρμα. Τρία επίπεδα: Χάλκινο, Ασημένιο, Χρυσό.',
        Icon: TrophyIcon,
      },
    ],
  },
  {
    title: '🗺️ Τοποθεσίες',
    modules: [
      {
        href: '/locations',
        label: 'Τοποθεσίες',
        description:
          'Ιεραρχικό σύστημα τοποθεσιών: Διεθνές → Χώρα → Νομός → Δήμος. Το περιεχόμενο μπορεί να γεωγραφικά χαρακτηριστεί.',
        Icon: MapPinIcon,
      },
    ],
  },
  {
    title: '🔐 Λογαριασμός',
    modules: [
      {
        href: '/login',
        label: 'Είσοδος / Εγγραφή',
        description:
          'Εγγραφείτε ή συνδεθείτε με email ή μέσω GitHub OAuth για πρόσβαση σε όλες τις λειτουργίες.',
        Icon: KeyIcon,
      },
      {
        href: '/profile',
        label: 'Προφίλ',
        description:
          'Διαχειριστείτε τα στοιχεία του λογαριασμού σας, τη φωτογραφία προφίλ και τις προσωπικές σας ρυθμίσεις.',
        Icon: UserCircleIcon,
      },
    ],
  },
  {
    title: '🛠️ Διαχείριση',
    modules: [
      {
        href: '/admin',
        label: 'Admin Panel',
        description:
          'Πλήρες διαχειριστικό περιβάλλον για τη διαχείριση χρηστών, άρθρων, μηνυμάτων, τοποθεσιών και ρόλων.',
        Icon: Cog6ToothIcon,
      },
      {
        href: '/contact',
        label: 'Μηνύματα / Επικοινωνία',
        description:
          'Αποστολή μηνυμάτων επικοινωνίας ή αίτησης για moderator προς την ομάδα της πλατφόρμας.',
        Icon: EnvelopeIcon,
      },
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
        Εξερευνήστε όλες τις κύριες ενότητες και λειτουργίες που προσφέρει η πλατφόρμα Appofa.
      </p>

      <div className="space-y-10">
        {sections.map(({ title, modules }) => (
          <section key={title}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map(({ href, label, description, Icon }) => (
                <Link
                  key={label}
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
