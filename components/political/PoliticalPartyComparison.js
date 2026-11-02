'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import OrgAvatar from '@/components/organization/OrgAvatar';
import { CheckBadgeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
  return <OrgAvatar org={{ ...party, type: 'party' }} size="h-12 w-12" fallback={
    <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-600">
      {getInitials(party.name)}
    </span>
  } />;
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
        <section aria-label="Κάρτες κομμάτων" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredParties.map(party => {
            const profile = `/organizations/${party.slug}`;
            const stats = party.positionStats;
            return <article key={party.id} className="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <Link href={profile} className="group flex items-center gap-3 rounded">
                <span aria-hidden="true"><PartyLogo party={party} /></span>
                <div className="min-w-0">
                  <h2 className="break-words text-base font-semibold leading-snug text-gray-900 group-hover:text-blue-800 group-hover:underline">
                    {party.name}
                    {party.isVerified && <CheckBadgeIcon aria-label="Επαληθευμένο" role="img" className="ml-1 inline h-4 w-4 text-blue-700" />}
                  </h2>
                  {party.politicalPosition && <p className="text-xs text-gray-600">{POSITION_LABELS[party.politicalPosition] || party.politicalPosition}</p>}
                </div>
              </Link>
              {party.description && <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-600">{party.description}</p>}
              <div className="mt-auto pt-3">
                <Link href={profile + '?tab=tab_positions'} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-2 text-xs font-medium tabular-nums hover:underline">
                  <span className="text-blue-800">{stats ? stats.positions + (stats.positions === 1 ? ' θέση' : ' θέσεις') : 'Πολιτικές θέσεις'}</span>
                  {stats && <><span className="text-emerald-800">+{stats.support} υπέρ</span><span className="text-rose-800">−{stats.oppose} κατά</span></>}
                </Link>
              </div>
            </article>;
          })}
        </section>}
    </div>
  );
}
