import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  AcademicCapIcon, BanknotesIcon, BuildingLibraryIcon,
  CpuChipIcon, SparklesIcon, GlobeEuropeAfricaIcon,
} from '@heroicons/react/24/outline';

const topics = [
  { key: 'education', category: 'Εκπαίδευση', icon: AcademicCapIcon },
  { key: 'economy', category: 'Οικονομία & Επιχειρήσεις', icon: BanknotesIcon },
  { key: 'society', category: 'Πολιτική & Κοινωνία', icon: BuildingLibraryIcon },
  { key: 'technology', category: 'Τεχνολογία & Καινοτομία', icon: CpuChipIcon },
  { key: 'culture', category: 'Ψυχαγωγία & Πολιτισμός', icon: SparklesIcon },
  { key: 'environment', category: 'Περιβάλλον', icon: GlobeEuropeAfricaIcon },
];

export default function PollTopics({ tags = [] }) {
  const t = useTranslations('pollTopics');
  return (
    <nav aria-label={t('title')} className="mb-5">
      <div className="flex flex-wrap gap-2">
        {topics.map(({ key, category, icon: Icon }) => (
          <Link
            key={key}
            href={`/polls?category=${encodeURIComponent(category)}`}
            prefetch={false}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-gray-200 bg-ivory px-3 py-2 transition-colors hover:border-copper hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Icon aria-hidden="true" className="h-4 w-4 text-copper" />
            <span className="text-xs font-semibold text-gray-900">{t(`${key}.title`)}</span>
          </Link>
        ))}
      </div>
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-600">{t('popularTags')}</span>
          {tags.slice(0, 5).map(tag => (
            <Link
              key={tag}
              href={`/polls?tag=${encodeURIComponent(tag)}`}
              prefetch={false}
              className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
