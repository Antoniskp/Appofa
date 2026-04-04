'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AcademicCapIcon, FlagIcon, LifebuoyIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const ELECTIONS_PATHS = [
  '/elections',
  '/citizen-help/independent-candidate',
  '/citizen-help/public-officials-salaries',
  '/citizen-help/government-positions',
  '/citizen-help/prefecture-seats',
  '/citizen-help/regions-electoral-map',
];

const CITIZEN_HELP_PATHS = [
  '/consumer-rights', '/driving-license', '/dypa-unemployment',
  '/health-insurance', '/kep-services', '/labor-market',
  '/taxation-guide', '/rental-guide', '/property-transfer',
  '/car-transfer', '/boat-transfer', '/start-business',
  '/price-comparison', '/digital-services', '/economy',
  '/citizen-help',
];

const PLATFORM_PATHS = [
  '/about', '/mission', '/contribute', '/become-moderator',
  '/instructions', '/transparency', '/faq', '/rules',
  '/contact', '/privacy', '/terms', '/platform',
];

const EDUCATION_PATHS = [
  '/education',
];

export default function StaticsSubNav() {
  const pathname = usePathname();

  const isElectionsActive = ELECTIONS_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  const isCitizenHelpActive = !isElectionsActive && CITIZEN_HELP_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  const isPlatformActive = PLATFORM_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  const isEducationActive = EDUCATION_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  const activeTabClass = 'border-b-2 border-blue-600 text-blue-600 font-semibold';
  const inactiveTabClass = 'text-blue-900 hover:text-blue-700 border-b-2 border-transparent';

  return (
    <nav
      aria-label="Κατηγορίες"
      className="bg-sand border-b border-seafoam/70"
    >
      <div className="app-container">
        <div className="flex gap-1">
          <Link
            href="/citizen-help"
            aria-current={isCitizenHelpActive ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm transition-colors ${isCitizenHelpActive ? activeTabClass : inactiveTabClass}`}
          >
            <LifebuoyIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            Βοήθεια Πολίτη
          </Link>
          <Link
            href="/elections"
            aria-current={isElectionsActive ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm transition-colors ${isElectionsActive ? activeTabClass : inactiveTabClass}`}
          >
            <FlagIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            Εκλογές &amp; Πολιτική
          </Link>
          <Link
            href="/platform"
            aria-current={isPlatformActive ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm transition-colors ${isPlatformActive ? activeTabClass : inactiveTabClass}`}
          >
            <WrenchScrewdriverIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            Πλατφόρμα
          </Link>
          <Link
            href="/education"
            aria-current={isEducationActive ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm transition-colors ${isEducationActive ? activeTabClass : inactiveTabClass}`}
          >
            <AcademicCapIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            Εκπαίδευση
          </Link>
        </div>
      </div>
    </nav>
  );
}
