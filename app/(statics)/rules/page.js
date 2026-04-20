import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import { getTranslations } from 'next-intl/server';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Κανόνες - Απόφαση',
  description: 'Κατευθυντήριες γραμμές και κανόνες κοινότητας',
  openGraph: {
    title: 'Κανόνες - Απόφαση',
    description: 'Κατευθυντήριες γραμμές και κανόνες κοινότητας',
    url: `${SITE_URL}/rules`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Κανόνες - Απόφαση',
    description: 'Κατευθυντήριες γραμμές και κανόνες κοινότητας',
  },
  alternates: {
    canonical: `${SITE_URL}/rules`,
  },
};

export default async function RulesPage() {
  const tStatic = await getTranslations('static_pages');
  return (
    <StaticPageLayout title={tStatic('rules_title')} maxWidth="max-w-3xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← {tStatic('pages')}</Link>}>
      <p className="text-gray-700 mb-6">
        Οι κατευθυντήριες γραμμές μας για μια υγιή, εποικοδομητική και σεβαστική κοινότητα.
      </p>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-3">Κανόνες</h2>
          <p className="text-gray-700 mb-3">
            Αυτά είναι τα πράγματα που δεν επιτρέπονται στην πλατφόρμα:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Απειλές βίας ή εκφοβισμός άλλων χρηστών</li>
            <li>Ρητορική μίσους ή διακρίσεις βάσει φύλου, φυλής, θρησκείας ή άλλων χαρακτηριστικών</li>
            <li>Ανεπιθύμητο περιεχόμενο ή επαναλαμβανόμενο περιεχόμενο χωρίς αξία</li>
            <li>Παράνομο περιεχόμενο ή παραβίαση πνευματικών δικαιωμάτων</li>
            <li>Παραπλανητικές πληροφορίες ή σκόπιμη παραπληροφόρηση</li>
            <li>Προσβλητική γλώσσα ή προσωπικές επιθέσεις</li>
            <li>Χειραγώγηση ψηφοφοριών ή απάτη</li>
            <li>Κοινή χρήση προσωπικών δεδομένων άλλων χωρίς συγκατάθεση</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Τι ενθαρρύνουμε</h2>
          <p className="text-gray-700 mb-3">
            Θέλουμε να βλέπουμε τις ακόλουθες συμπεριφορές στην κοινότητά μας:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Σεβασμό και ευγένεια σε όλες τις αλληλεπιδράσεις</li>
            <li>Εποικοδομητική κριτική και διάλογο βασισμένο σε δεδομένα</li>
            <li>Διαφάνεια όταν μοιράζεστε πηγές ή πληροφορίες</li>
            <li>Ανοιχτό μυαλό και προθυμία να ακούσετε διαφορετικές απόψεις</li>
            <li>Υπεύθυνη συμμετοχή σε ψηφοφορίες και συζητήσεις</li>
            <li>Καλοπροαίρετες συνεισφορές που βοηθούν την κοινότητα</li>
            <li>Αναφορά προβληματικού περιεχομένου όταν το εντοπίζετε</li>
            <li>Συνεργασία για την επίλυση διαφωνιών</li>
          </ul>
        </div>
      </div>
    </StaticPageLayout>
  );
}
