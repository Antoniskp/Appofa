import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const metadata = {
  title: 'Κυβερνητικές Θέσεις & Αξιωματούχοι — Ελλάδα',
  description:
    'Κατάλογος κυβερνητικών θέσεων και των σημερινών κατόχων τους στην Ελλάδα — Πρόεδρος Δημοκρατίας, Πρωθυπουργός, Υπουργοί και λοιποί αξιωματούχοι.',
  openGraph: {
    title: 'Κυβερνητικές Θέσεις & Αξιωματούχοι — Ελλάδα',
    description:
      'Πρόεδρος Δημοκρατίας, Πρωθυπουργός, Υπουργοί και λοιποί αξιωματούχοι της ελληνικής κυβέρνησης.',
    url: `${SITE_URL}/citizen-help/government-positions`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Κυβερνητικές Θέσεις & Αξιωματούχοι — Ελλάδα',
    description:
      'Κατάλογος θέσεων και κατόχων τους: Πρόεδρος, Πρωθυπουργός, Υπουργοί.',
  },
  alternates: {
    canonical: `${SITE_URL}/citizen-help/government-positions`,
  },
};

function getHolderDisplayName(holder) {
  const user = holder?.user;
  if (!user) return null;
  const fullName = [user.firstNameNative, user.lastNameNative].filter(Boolean).join(' ').trim();
  return fullName || user.username || null;
}

function formatSinceDate(since) {
  if (!since) return null;
  const date = new Date(since);
  if (Number.isNaN(date.getTime())) return since;
  return new Intl.DateTimeFormat('el-GR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export async function getCurrentGovernmentPositions(countryCode = 'GR') {
  try {
    const res = await fetch(
      `${API_URL}/api/dream-team/current-holders?countryCode=${encodeURIComponent(countryCode.toUpperCase())}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) {
      return { positions: [], error: true };
    }
    const json = await res.json();
    if (!json?.success || !Array.isArray(json.data)) {
      return { positions: [], error: true };
    }
    return { positions: json.data, error: false };
  } catch {
    return { positions: [], error: true };
  }
}

const sources = [
  {
    href: 'https://primeminister.gr',
    label: 'Γραφείο Πρωθυπουργού',
    desc: 'Σύνθεση Κυβέρνησης & επίσημες ανακοινώσεις',
    emoji: '🏛️',
  },
  {
    href: 'https://www.presidency.gr',
    label: 'Προεδρία της Δημοκρατίας',
    desc: 'Επίσημος ιστότοπος Προέδρου Δημοκρατίας',
    emoji: '🏛️',
  },
  {
    href: 'https://www.hellenicparliament.gr',
    label: 'Ελληνικό Κοινοβούλιο',
    desc: 'Βουλευτές, Επιτροπές, Νόμοι',
    emoji: '🗳️',
  },
  {
    href: 'https://www.mfa.gr',
    label: 'Υπουργείο Εξωτερικών',
    desc: 'Επίσημος ιστότοπος ΥΠΕΞ',
    emoji: '🌍',
  },
];

export default async function GovernmentPositionsPage() {
  const { positions, error } = await getCurrentGovernmentPositions('GR');

  return (
    <StaticPageLayout
      title="Κυβερνητικές Θέσεις & Αξιωματούχοι"
      maxWidth="max-w-5xl"
      breadcrumb={
        <Link href="/elections" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Εκλογές &amp; Πολιτική
        </Link>
      }
    >
      <section>
        <p className="text-xl text-gray-700 leading-relaxed">
          Κατάλογος των βασικών κυβερνητικών θέσεων της Ελληνικής Δημοκρατίας και των επίσημων
          τωρινών κατόχων τους, όπως καταγράφονται στο μητρώο θέσεων της πλατφόρμας.
        </p>
        {error && (
          <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            ⚠️ Προσωρινά δεν ήταν δυνατή η φόρτωση των επίσημων στοιχείων από το μητρώο. Δείτε τις
            επίσημες πηγές παρακάτω για επιβεβαίωση.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Επίσημοι Τωρινοί Κάτοχοι (Ελλάδα)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700">Θέση</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Κάτοχος</th>
              </tr>
            </thead>
            <tbody>
              {positions.length > 0 ? positions.map((position, idx) => (
                <tr key={position.id || position.slug} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-800">{position.title}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {position.currentHolders?.length ? (
                      <ul className="space-y-1">
                        {position.currentHolders.map((holder, index) => {
                          const holderName = getHolderDisplayName(holder);
                          const sinceLabel = formatSinceDate(holder?.since);
                          return (
                            <li key={`${position.id || position.slug}-${holder.id || index}`}>
                              <span className="font-medium text-gray-900">
                                {holderName || 'Μη διαθέσιμο όνομα'}
                              </span>
                              {sinceLabel && (
                                <span className="text-gray-500"> — Από: {sinceLabel}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-gray-500 italic">Δεν έχει καταχωρηθεί επίσημος κάτοχος</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={2} className="px-4 py-5 text-center text-gray-500">
                    Δεν βρέθηκαν διαθέσιμες θέσεις για την Ελλάδα αυτή τη στιγμή.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Επίσημες Πηγές</h2>
        <div className="space-y-3">
          {sources.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <span className="text-2xl" aria-hidden="true">{link.emoji}</span>
              <div>
                <p className="font-semibold text-blue-900 group-hover:text-blue-600 transition-colors">
                  {link.label}
                </p>
                <p className="text-sm text-gray-600">{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-200 pt-4">
          <strong>Σημείωση:</strong> Η σελίδα αντλεί δεδομένα από το επίσημο μητρώο
          GovernmentPositions/GovernmentCurrentHolders που χρησιμοποιεί και η διαχείριση Dream Team.
          Για επιβεβαίωση σε πραγματικό χρόνο απευθυνθείτε και στο{' '}
          <a
            href="https://primeminister.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            primeminister.gr
          </a>
          .
        </p>
      </section>
    </StaticPageLayout>
  );
}
