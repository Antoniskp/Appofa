import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import Link from 'next/link';
import { StaticPageLayout } from '@/components/layout';
import badges from '@/config/badges.json';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Badges & Επιτεύγματα | Appofa',
  description:
    'Ανακαλύψτε το σύστημα badges της πλατφόρμας Appofa — κερδίστε επιτεύγματα για τη δραστηριότητά σας. Τρία επίπεδα: Χάλκινο, Ασημένιο, Χρυσό.',
  openGraph: {
    url: `${SITE_URL}/platform/badges`,
    type: 'website',
    locale: 'el_GR',
    siteName: 'Appofa',
    title: 'Badges & Επιτεύγματα | Appofa',
    description:
      'Ανακαλύψτε το σύστημα badges της πλατφόρμας Appofa — κερδίστε επιτεύγματα για τη δραστηριότητά σας. Τρία επίπεδα: Χάλκινο, Ασημένιο, Χρυσό.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Badges & Επιτεύγματα | Appofa',
    description:
      'Ανακαλύψτε το σύστημα badges της πλατφόρμας Appofa — κερδίστε επιτεύγματα για τη δραστηριότητά σας. Τρία επίπεδα: Χάλκινο, Ασημένιο, Χρυσό.',
  },
  alternates: {
    canonical: `${SITE_URL}/platform/badges`,
  },
};

const CATEGORY_LABELS = {
  content: '📰 Περιεχόμενο',
  profile: '👤 Προφίλ',
  popularity: '⭐ Δημοτικότητα',
  community: '🤝 Κοινότητα',
  'dream-team': '🏛️ Dream Team',
};

const TIER_EMOJIS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
};

function groupByCategory(badgeList) {
  const grouped = {};
  for (const badge of badgeList) {
    if (!grouped[badge.category]) {
      grouped[badge.category] = [];
    }
    grouped[badge.category].push(badge);
  }
  return grouped;
}

function buildBadgeImageMap(badgeList) {
  const map = {};
  for (const badge of badgeList) {
    for (const { tier } of badge.tiers) {
      const key = `${badge.slug}-${tier}`;
      try {
        const imagePath = path.join(process.cwd(), 'public', 'images', 'badges', `${key}.svg`);
        map[key] = fs.existsSync(imagePath);
      } catch {
        map[key] = false;
      }
    }
  }
  return map;
}

const badgeImageMap = buildBadgeImageMap(badges);

export default function BadgesPage() {
  const grouped = groupByCategory(badges);

  return (
    <StaticPageLayout
      title="Badges & Επιτεύγματα"
      maxWidth="max-w-5xl"
      showHelpfulLinks={false}
      breadcrumb={
        <Link href="/platform" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Πλατφόρμα
        </Link>
      }
    >
      <p className="text-lg text-gray-700 -mt-6">
        Τα badges ανταμείβουν τους χρήστες για σημαντικά ορόσημα στην πλατφόρμα. Κάθε badge
        διατίθεται σε τρία επίπεδα — 🥉 Χάλκινο, 🥈 Ασημένιο και 🥇 Χρυσό — και εμφανίζεται
        στο προφίλ σας.
      </p>

      {/* Image Specifications */}
      <section className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">🖼️ Προδιαγραφές Εικόνων Badge</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-blue-800">
          <div>
            <span className="font-medium">Μορφή:</span> SVG (Scalable Vector Graphics)
          </div>
          <div>
            <span className="font-medium">Διαστάσεις viewport:</span> 128 × 128 (κλιμακώσιμο)
          </div>
          <div>
            <span className="font-medium">Σύμβαση ονομασίας:</span>{' '}
            <code className="bg-blue-100 rounded px-1 font-mono">{'{badge-slug}-{tier}.svg'}</code>
          </div>
          <div>
            <span className="font-medium">Επίπεδα:</span> bronze, silver, gold
          </div>
          <div className="sm:col-span-2">
            <span className="font-medium">Παράδειγμα:</span>{' '}
            <code className="bg-blue-100 rounded px-1 font-mono">article-writer-bronze.svg</code>
          </div>
          <div className="sm:col-span-2">
            <span className="font-medium">Χρωματική παλέτα:</span>{' '}
            <span className="inline-flex items-center gap-3 mt-1">
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: '#CD7F32' }}
                />
                <span>Bronze <code className="bg-blue-100 rounded px-1 font-mono">#CD7F32</code></span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: '#C0C0C0' }}
                />
                <span>Silver <code className="bg-blue-100 rounded px-1 font-mono">#C0C0C0</code></span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: '#FFD700' }}
                />
                <span>Gold <code className="bg-blue-100 rounded px-1 font-mono">#FFD700</code></span>
              </span>
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="font-medium">Φάκελος badges:</span>{' '}
            <a
              href="https://github.com/Antoniskp/Appofa/tree/main/public/images/badges"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              github.com/Antoniskp/Appofa/tree/main/public/images/badges
            </a>
          </div>
        </div>
      </section>

      {/* Badge Catalog */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">🏅 Κατάλογος Badges</h2>
        <div className="space-y-10">
          {Object.entries(grouped).map(([category, categoryBadges]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                {CATEGORY_LABELS[category] ?? category}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {categoryBadges.map((badge) => (
                  <div
                    key={badge.slug}
                    className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-900 text-base">{badge.name}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{badge.description}</p>
                    </div>
                    <div className="flex gap-3">
                      {badge.tiers.map((t) => {
                        const hasImage = badgeImageMap[`${badge.slug}-${t.tier}`];
                        return (
                          <div key={t.tier} className="flex-1 flex flex-col items-center text-center gap-1">
                            {hasImage ? (
                              <Image
                                src={`/images/badges/${badge.slug}-${t.tier}.svg`}
                                alt={`${badge.name} — ${t.label}`}
                                width={48}
                                height={48}
                                className="w-12 h-12"
                              />
                            ) : (
                              <span className="text-3xl leading-none" aria-hidden="true">
                                {TIER_EMOJIS[t.tier]}
                              </span>
                            )}
                            <span className="text-xs font-medium text-gray-700">{t.label}</span>
                            <span className="text-xs text-gray-500">{t.criteria}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
}
