import Link from 'next/link';
import {
  ScaleIcon,
  TruckIcon,
  BriefcaseIcon,
  HeartIcon,
  BuildingLibraryIcon,
  UsersIcon,
  CalculatorIcon,
  HomeIcon,
  BuildingOfficeIcon,
  WrenchIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  ComputerDesktopIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline';
import { StaticPageLayout } from '@/components/layout';

export const metadata = {
  title: 'Βοήθεια Πολίτη | Appofa',
  description: 'Πρακτικοί οδηγοί και πληροφορίες για τον πολίτη — δικαιώματα, φορολογία, εργασία, μεταβιβάσεις και πολλά ακόμα.',
};

const categories = [
  {
    title: '🛒 Δικαιώματα & Προστασία',
    pages: [
      { href: '/consumer-rights', label: 'Δικαιώματα Καταναλωτή', description: 'Γνωρίστε τα δικαιώματά σας στις αγορές', Icon: ScaleIcon },
    ],
  },
  {
    title: '💼 Εργασία & Ασφάλιση',
    pages: [
      { href: '/dypa-unemployment', label: 'ΔΥΠΑ - Ανεργία', description: 'Επίδομα ανεργίας και υπηρεσίες ΔΥΠΑ', Icon: BriefcaseIcon },
      { href: '/health-insurance', label: 'Ασφάλιση Υγείας', description: 'ΕΦΚΑ και κάλυψη υγείας', Icon: HeartIcon },
      { href: '/labor-market', label: 'Αγορά Εργασίας', description: 'Δικαιώματα εργαζομένων και εργοδοτών', Icon: UsersIcon },
    ],
  },
  {
    title: '🏛️ Δημόσιες Υπηρεσίες',
    pages: [
      { href: '/kep-services', label: 'Υπηρεσίες ΚΕΠ', description: 'Τι μπορείτε να κάνετε στο ΚΕΠ', Icon: BuildingLibraryIcon },
      { href: '/digital-services', label: 'Ψηφιακές Υπηρεσίες', description: 'gov.gr και ψηφιακές δημόσιες υπηρεσίες', Icon: ComputerDesktopIcon },
    ],
  },
  {
    title: '🚗 Μεταφορά & Μεταβιβάσεις',
    pages: [
      { href: '/driving-license', label: 'Δίπλωμα Οδήγησης', description: 'Οδηγός για απόκτηση & ανανέωση διπλώματος', Icon: TruckIcon },
      { href: '/car-transfer', label: 'Μεταβίβαση Αυτοκινήτου', description: 'Διαδικασία αλλαγής κυριότητας οχήματος', Icon: WrenchIcon },
      { href: '/boat-transfer', label: 'Μεταβίβαση Σκάφους', description: 'Διαδικασία μεταβίβασης σκάφους', Icon: GlobeAltIcon },
    ],
  },
  {
    title: '🏠 Ακίνητα',
    pages: [
      { href: '/rental-guide', label: 'Οδηγός Ενοικίασης', description: 'Συμβόλαια, δικαιώματα ενοικιαστών', Icon: HomeIcon },
      { href: '/property-transfer', label: 'Μεταβίβαση Ακινήτου', description: 'Βήματα για αγορά και μεταβίβαση', Icon: BuildingOfficeIcon },
    ],
  },
  {
    title: '💰 Φορολογία & Οικονομία',
    pages: [
      { href: '/taxation-guide', label: 'Φορολογικός Οδηγός', description: 'Δηλώσεις, φόροι και ΑΑΔΕ', Icon: CalculatorIcon },
      { href: '/price-comparison', label: 'Σύγκριση Τιμών', description: 'Εργαλεία σύγκρισης τιμών αγοράς', Icon: ChartBarIcon },
      { href: '/economy', label: 'Οικονομία', description: 'Οικονομικές ειδήσεις και αναλύσεις', Icon: CurrencyEuroIcon },
    ],
  },
  {
    title: '🚀 Επιχειρηματικότητα',
    pages: [
      { href: '/start-business', label: 'Έναρξη Επιχείρησης', description: 'Πώς να ξεκινήσετε τη δική σας επιχείρηση', Icon: RocketLaunchIcon },
    ],
  },
];

export default function CitizenHelpPage() {
  return (
    <StaticPageLayout
      title="Βοήθεια Πολίτη"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
    >
      <p className="text-lg text-gray-700 -mt-6">
        Πρακτικοί οδηγοί και πληροφορίες για τον πολίτη — δικαιώματα, φορολογία, εργασία, μεταβιβάσεις και πολλά ακόμα.
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
