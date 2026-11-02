'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import OrgAvatar from '@/components/organization/OrgAvatar';
import {
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  ArrowRightIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { organizationAPI } from '@/lib/api';
import { POSITION_LABELS } from '@/lib/utils/politicalParties';

const POSITION_ORDER = ['far-left', 'left', 'center-left', 'independent', 'center-right', 'right', 'far-right'];
const POSITION_FILTERS = ['all', ...POSITION_ORDER];

function sortParties(a, b) {
  const positionA = POSITION_ORDER.indexOf(a.politicalPosition);
  const positionB = POSITION_ORDER.indexOf(b.politicalPosition);
  const safeA = positionA === -1 ? POSITION_ORDER.length : positionA;
  const safeB = positionB === -1 ? POSITION_ORDER.length : positionB;

  if (safeA !== safeB) return safeA - safeB;
  return String(a.name || '').localeCompare(String(b.name || ''), 'el');
}

function getInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'P';
  return words.slice(0, 2).map((word) => Array.from(word)[0]).join('').toUpperCase();
}

function listFromResponse(response, key) {
  return response?.data?.[key] || response?.[key] || [];
}

function PartyLogo({ party }) {
  return <OrgAvatar org={{ ...party, type: 'party' }} size="h-16 w-16" fallback={
    <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-600">
      {getInitials(party.name)}
    </span>
  } />;
}

function PartyLinks({ party }) {
  const videoHref = `/videos?search=${encodeURIComponent(party.name || '')}`;

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <Link
        href={`/organizations/${party.slug}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 px-3 py-1.5 font-medium text-blue-700 hover:bg-blue-50"
      >
        <BuildingOffice2Icon className="h-4 w-4" />
        Προφίλ
      </Link>
      <Link
        href={videoHref}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
      >
        <PlayCircleIcon className="h-4 w-4" />
        Βίντεο
      </Link>
      {party.website && (
        <a
          href={party.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          <GlobeAltIcon className="h-4 w-4" />
          Ιστότοπος
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

export default function PoliticalPartyComparison() {
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadParties() {
      setLoading(true);
      setError('');

      try {
        const organizations = [];
        let page = 1;
        let pages;
        do {
          const response = await organizationAPI.getAll({ type: 'party', positionStats: true, limit: 100, page });
          if (cancelled) return;
          organizations.push(...listFromResponse(response, 'organizations'));
          pages = response?.data?.pagination?.totalPages || 1;
        } while (++page <= pages);
        setParties(organizations.sort(sortParties));
        setLoading(false);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Δεν ήταν δυνατή η φόρτωση των κομματικών οργανισμών.');
          setLoading(false);
        }
      }
    }

    loadParties();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredParties = useMemo(() => {
    const cleanSearch = search.trim().toLocaleLowerCase('el');

    return parties.filter((party) => {
      const matchesPosition = position === 'all' || party.politicalPosition === position;
      const matchesSearch = !cleanSearch
        || String(party.name || '').toLocaleLowerCase('el').includes(cleanSearch)
        || String(party.description || '').toLocaleLowerCase('el').includes(cleanSearch);

      return matchesPosition && matchesSearch;
    });
  }, [parties, position, search]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-11 rounded-lg bg-gray-100" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-52 rounded-lg bg-gray-100" />
          <div className="h-52 rounded-lg bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Αναζήτηση κόμματος</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Αναζήτηση κόμματος ή φιλοσοφίας..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label>
            <span className="sr-only">Ιδεολογική θέση</span>
            <select
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 md:w-56"
            >
              {POSITION_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? 'Όλες οι θέσεις' : POSITION_LABELS[value] || value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p aria-live="polite" className="text-sm text-gray-600">Κόμματα: <strong>{filteredParties.length}</strong></p>
      </section>
      {filteredParties.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-gray-600">Δεν βρέθηκαν κόμματα με αυτά τα φίλτρα.</p> :
        <section aria-label="Κάρτες κομμάτων" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredParties.map(party => {
            const profile = `/organizations/${party.slug}`;
            const stats = party.positionStats;
            return <article key={party.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md">
              <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 p-5">
                <span aria-hidden="true"><PartyLogo party={party} /></span>
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-bold leading-tight text-slate-900"><Link className="hover:text-blue-800 hover:underline" href={profile}>{party.name}</Link></h2>
                  {party.politicalPosition && <p className="mt-1 text-sm text-slate-600">{POSITION_LABELS[party.politicalPosition] || party.politicalPosition}</p>}
                  {party.isVerified && <span className="mt-1 inline-flex items-center gap-1 text-xs text-blue-800"><CheckBadgeIcon className="h-4 w-4" />Επαληθευμένο</span>}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                {party.description && <p className="line-clamp-3 text-sm leading-6 text-slate-700">{party.description}</p>}
                <div className="mt-auto">
                  {stats && <dl className="mb-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3">
                    {[[stats.positions, 'Θέσεις', 'text-slate-900'], ['+' + stats.support, 'Ψήφοι υπέρ', 'text-emerald-800'], ['−' + stats.oppose, 'Ψήφοι κατά', 'text-rose-800']].map(([value, label, color]) => <div key={label} className="flex flex-col-reverse"><dt className="text-xs text-slate-600">{label}</dt><dd className={`text-xl font-bold tabular-nums ${color}`}>{value}</dd></div>)}
                  </dl>}
                  <Link href={profile + '?tab=tab_positions'} className="mb-3 flex items-center justify-between rounded-lg bg-blue-800 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900">Πολιτικές θέσεις<ArrowRightIcon className="h-4 w-4" /></Link>
                  <PartyLinks party={party} />
                </div>
              </div>
            </article>;
          })}
        </section>}
    </div>
  );
}
