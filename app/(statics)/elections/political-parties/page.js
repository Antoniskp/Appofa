import Link from 'next/link';
import { getAllParties } from '@/lib/utils/politicalParties';
import { StaticPageLayout } from '@/components/layout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Πολιτικά Κόμματα στην Ελλάδα | Appofa',
  description:
    'Όλα τα ενεργά κοινοβουλευτικά και αξιόλογα πολιτικά κόμματα της Ελλάδας — ονόματα, συντομογραφίες, ιδεολογική τοποθέτηση και επίσημοι σύνδεσμοι.',
  openGraph: {
    title: 'Πολιτικά Κόμματα στην Ελλάδα',
    description:
      'Όλα τα ενεργά κοινοβουλευτικά και αξιόλογα πολιτικά κόμματα της Ελλάδας.',
    url: `${SITE_URL}/elections/political-parties`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Πολιτικά Κόμματα στην Ελλάδα',
    description:
      'Όλα τα ενεργά κοινοβουλευτικά και αξιόλογα πολιτικά κόμματα της Ελλάδας.',
  },
  alternates: {
    canonical: `${SITE_URL}/elections/political-parties`,
  },
};

const POSITION_LABELS = {
  'far-left': 'Ακροαριστερά',
  'left': 'Αριστερά',
  'center-left': 'Κεντροαριστερά',
  'center-right': 'Κεντροδεξιά',
  'right': 'Δεξιά',
  'far-right': 'Ακροδεξιά',
  'independent': 'Ανεξάρτητος',
};

export default function PoliticalPartiesPage() {
  const parties = getAllParties(false);

  return (
    <StaticPageLayout
      title="Πολιτικά Κόμματα στην Ελλάδα"
      maxWidth="max-w-5xl"
      breadcrumb={
        <Link href="/elections" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Εκλογές &amp; Πολιτική
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-2">
        Τα ενεργά κοινοβουλευτικά και αξιόλογα πολιτικά κόμματα που δραστηριοποιούνται στην
        Ελλάδα — με πληροφορίες για την ιδεολογική τους τοποθέτηση, το έτος ίδρυσης και τον
        επίσημο ιστότοπό τους.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {parties.map((party) => (
          <div
            key={party.id}
            className={`relative flex flex-col gap-3 p-5 rounded-xl border bg-white transition-shadow hover:shadow-md ${
              party.active ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
            style={{ borderTopColor: party.color, borderTopWidth: 3 }}
          >
            {!party.active && (
              <span className="absolute top-3 right-3 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                Ανενεργό
              </span>
            )}

            {/* Logo / fallback */}
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center rounded-full ring-2 ring-white overflow-hidden flex-shrink-0"
                style={{ backgroundColor: party.color, width: 40, height: 40 }}
                aria-hidden="true"
              >
                {party.logo ? (
                  <img
                    src={party.logo}
                    alt={party.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-bold leading-none">
                    {party.abbreviation.charAt(0)}
                  </span>
                )}
              </span>
              <div>
                <p className="font-bold text-gray-900 leading-tight">{party.name}</p>
                <p className="text-xs text-gray-500">{party.nameEn}</p>
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <span className="font-medium text-gray-500">Συντομογραφία: </span>
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold text-white"
                  style={{ backgroundColor: party.color }}
                >
                  {party.abbreviation}
                </span>
              </p>
              <p>
                <span className="font-medium text-gray-500">Τοποθέτηση: </span>
                {POSITION_LABELS[party.position] ?? party.position}
              </p>
              {party.founded && (
                <p>
                  <span className="font-medium text-gray-500">Ίδρυση: </span>
                  {party.founded}
                </p>
              )}
            </div>

            {/* Website */}
            {party.website && (
              <a
                href={party.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto text-sm text-blue-600 hover:underline hover:text-blue-800 transition-colors"
              >
                Επίσημος ιστότοπος →
              </a>
            )}
          </div>
        ))}
      </div>

      <section>
        <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-4">
          <strong>Σημείωση:</strong> Η παρουσίαση των κομμάτων γίνεται με σκοπό την ενημέρωση και
          δεν αποτελεί πολιτική τοποθέτηση ή υποστήριξη οποιουδήποτε κόμματος. Τα στοιχεία
          ενδέχεται να μην αντικατοπτρίζουν άμεσα τελευταίες αλλαγές. Για επίσημες πληροφορίες
          ανατρέξτε στους ιστότοπους των κομμάτων ή στο{' '}
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
