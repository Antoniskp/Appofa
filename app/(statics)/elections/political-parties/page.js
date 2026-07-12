import Link from 'next/link';
import { StaticPageLayout } from '@/components/layout';
import PoliticalPartyComparison from '@/components/political/PoliticalPartyComparison';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Πολιτικά Κόμματα στην Ελλάδα | Appofa',
  description:
    'Σύγκριση κομματικών οργανώσεων στην Appofa με φιλοσοφία, ανθρώπους, δημόσια στατιστικά και συνδέσμους.',
  openGraph: {
    title: 'Πολιτικά Κόμματα στην Ελλάδα',
    description:
      'Σύγκριση κομματικών οργανώσεων με φιλοσοφία, ανθρώπους, δημόσια στατιστικά και συνδέσμους.',
    url: `${SITE_URL}/elections/political-parties`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Πολιτικά Κόμματα στην Ελλάδα',
    description:
      'Σύγκριση κομματικών οργανώσεων με φιλοσοφία, ανθρώπους, δημόσια στατιστικά και συνδέσμους.',
  },
  alternates: {
    canonical: `${SITE_URL}/elections/political-parties`,
  },
};

export default function PoliticalPartiesPage() {
  return (
    <StaticPageLayout
      title="Πολιτικά Κόμματα στην Ελλάδα"
      maxWidth="max-w-6xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/elections" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Εκλογές &amp; Πολιτική
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-2">
        Σύγκρινε τις κομματικές οργανώσεις που υπάρχουν στην Appofa: φιλοσοφία,
        δημόσιους ρόλους, μέλη όπου είναι ορατά, ψηφοφορίες, προτάσεις και
        επίσημες δημοσιεύσεις.
      </p>

      <PoliticalPartyComparison />

      <section>
        <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-4">
          <strong>Σημείωση:</strong> Τα στοιχεία προέρχονται από τις κομματικές
          οργανώσεις της Appofa και δεν αποτελούν πολιτική τοποθέτηση ή
          υποστήριξη οποιουδήποτε κόμματος. Για επίσημες πληροφορίες ανατρέξτε
          στους ιστοτόπους των οργανώσεων ή στο{' '}
          <a
            href="https://www.hellenicparliament.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            Ελληνικό Κοινοβούλιο
          </a>
          .
        </p>
      </section>
    </StaticPageLayout>
  );
}
