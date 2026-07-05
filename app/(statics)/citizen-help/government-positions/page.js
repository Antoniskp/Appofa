import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import positionTypesData from '@/config/governmentPositionTypes.json';
import positionsConfig from '@/config/governmentPositions.json';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ── Config lookups (computed once at module scope) ──────────────────────────
const typeMap = Object.fromEntries(positionTypesData.map((t) => [t.key, t]));

// slug → icon from governmentPositions.json (per-slug icons are more specific)
const iconMap = positionsConfig.positions.reduce((acc, p) => {
  if (p.icon) acc[p.slug] = p.icon;
  return acc;
}, {});

// slug → ministerCategory (only set for minister positions)
const ministerCategoryMap = positionsConfig.positions.reduce((acc, p) => {
  if (p.ministerCategory) acc[p.slug] = p.ministerCategory;
  return acc;
}, {});

// positionTypeKey values that are rendered in the "leadership" hero row
const LEADERSHIP_TYPES = new Set(['head_of_state', 'prime_minister', 'parliament_speaker']);

const MINISTER_CATEGORY_LABELS = {
  core: 'Βασικά Υπουργεία',
  social: 'Κοινωνική Πολιτική',
  development: 'Ανάπτυξη & Υποδομές',
  governance: 'Διακυβέρνηση & Ασφάλεια',
  sectoral: 'Τομεακά Υπουργεία',
  other: 'Λοιπά Υπουργεία',
};

// ── Metadata ────────────────────────────────────────────────────────────────
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

// ── Helper functions ─────────────────────────────────────────────────────────
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

function getPositionIcon(position) {
  return iconMap[position.slug] || typeMap[position.positionTypeKey]?.icon || '⚖️';
}

function getTypeBadgeColor(positionTypeKey) {
  return typeMap[positionTypeKey]?.color || 'bg-gray-100 text-gray-600';
}

function getTypeLabel(positionTypeKey) {
  return typeMap[positionTypeKey]?.labelGr || positionTypeKey;
}

// ── Data fetcher ─────────────────────────────────────────────────────────────
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

// ── Sub-components (server-renderable, no 'use client') ───────────────────────

function HolderAvatar({ photo, name, avatarColor, size = 'md' }) {
  const sizes = size === 'lg'
    ? 'h-16 w-16 text-xl'
    : 'h-10 w-10 text-sm';
  if (photo) {
    return (
      <img
        src={photo}
        alt={name || ''}
        className={`${sizes} rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm`}
      />
    );
  }
  const initial = (name?.trim() || '?').charAt(0).toUpperCase();
  return (
    <div
      className={`${sizes} rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white border-2 border-white shadow-sm`}
      style={avatarColor ? { backgroundColor: avatarColor } : { backgroundColor: '#6b7280' }}
      aria-label={name || 'Αγνώστου ονόματος'}
    >
      {initial}
    </div>
  );
}

function LeadershipCard({ position }) {
  const icon = getPositionIcon(position);
  const badgeColor = getTypeBadgeColor(position.positionTypeKey);
  const typeLabel = getTypeLabel(position.positionTypeKey);
  const holder = position.currentHolders?.[0] || null;
  const holderName = holder ? getHolderDisplayName(holder) : null;
  const holderPhoto = holder?.holderPhoto || null;
  const holderAvatarColor = holder?.holderAvatarColor || null;
  const sinceLabel = holder?.since ? formatSinceDate(holder.since) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Header row: icon + badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl" aria-hidden="true">{icon}</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${badgeColor}`}>
          {typeLabel}
        </span>
      </div>

      {/* Position title */}
      <h3 className="text-base font-bold text-gray-900 leading-snug">{position.title}</h3>

      {/* Holder */}
      <div className="border-t border-gray-100 pt-3">
        {holderName ? (
          <div className="flex items-center gap-3">
            <HolderAvatar photo={holderPhoto} name={holderName} avatarColor={holderAvatarColor} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{holderName}</p>
              {sinceLabel && (
                <p className="text-xs text-gray-500 mt-0.5">Από {sinceLabel}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Δεν έχει καταχωρηθεί επίσημος κάτοχος</p>
        )}
      </div>
    </div>
  );
}

function MinisterCard({ position }) {
  const icon = getPositionIcon(position);
  const holder = position.currentHolders?.[0] || null;
  const holderName = holder ? getHolderDisplayName(holder) : null;
  const holderPhoto = holder?.holderPhoto || null;
  const holderAvatarColor = holder?.holderAvatarColor || null;
  const sinceLabel = holder?.since ? formatSinceDate(holder.since) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Position icon */}
      <span className="text-2xl mt-0.5 flex-shrink-0" aria-hidden="true">{icon}</span>

      <div className="min-w-0 flex-1">
        {/* Title */}
        <p className="text-sm font-semibold text-gray-800 leading-snug mb-2">{position.title}</p>

        {/* Holder */}
        {holderName ? (
          <div className="flex items-center gap-2">
            <HolderAvatar photo={holderPhoto} name={holderName} avatarColor={holderAvatarColor} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{holderName}</p>
              {sinceLabel && (
                <p className="text-xs text-gray-400">Από {sinceLabel}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Κενή θέση</p>
        )}
      </div>
    </div>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────
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
    emoji: '👑',
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function GovernmentPositionsPage() {
  const { positions, error } = await getCurrentGovernmentPositions('GR');

  // Partition positions
  const leadershipPositions = positions.filter((p) => LEADERSHIP_TYPES.has(p.positionTypeKey));
  const ministerPositions = positions.filter((p) => p.positionTypeKey === 'minister');
  const otherPositions = positions.filter(
    (p) => !LEADERSHIP_TYPES.has(p.positionTypeKey) && p.positionTypeKey !== 'minister',
  );

  // Group ministers by ministerCategory (from config JSON lookup)
  const ministersByCategory = {};
  for (const pos of ministerPositions) {
    const cat = ministerCategoryMap[pos.slug] || 'other';
    if (!ministersByCategory[cat]) ministersByCategory[cat] = [];
    ministersByCategory[cat].push(pos);
  }
  const ministerCategoryOrder = ['core', 'social', 'development', 'governance', 'sectoral', 'other'];

  const hasAnyContent = positions.length > 0;

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
      {/* Intro */}
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

      {/* Empty state */}
      {!hasAnyContent && !error && (
        <section>
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
            <span className="text-4xl" aria-hidden="true">🏛️</span>
            <p className="mt-3 text-gray-500">
              Δεν βρέθηκαν διαθέσιμες θέσεις για την Ελλάδα αυτή τη στιγμή.
            </p>
          </div>
        </section>
      )}

      {/* Leadership row */}
      {leadershipPositions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ηγεσία της Δημοκρατίας</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leadershipPositions.map((position) => (
              <LeadershipCard key={position.id || position.slug} position={position} />
            ))}
          </div>
        </section>
      )}

      {/* Ministers grouped by category */}
      {ministerPositions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Υπουργικό Συμβούλιο</h2>
          <div className="space-y-6">
            {ministerCategoryOrder
              .filter((cat) => ministersByCategory[cat]?.length > 0)
              .map((cat) => (
                <div key={cat}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {MINISTER_CATEGORY_LABELS[cat] || cat}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ministersByCategory[cat].map((position) => (
                      <MinisterCard key={position.id || position.slug} position={position} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Other positions (non-standard types from DB) */}
      {otherPositions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Λοιπές Θέσεις</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherPositions.map((position) => (
              <MinisterCard key={position.id || position.slug} position={position} />
            ))}
          </div>
        </section>
      )}

      {/* Sources */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Επίσημες Πηγές</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sources.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group"
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

      {/* Disclaimer */}
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
