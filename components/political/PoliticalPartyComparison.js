'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowTopRightOnSquareIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  PlayCircleIcon,
  UserGroupIcon,
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

function profileName(profile) {
  if (!profile) return '';
  const nativeName = `${profile.firstNameNative || ''} ${profile.lastNameNative || ''}`.trim();
  const englishName = `${profile.firstNameEn || ''} ${profile.lastNameEn || ''}`.trim();
  return nativeName || englishName || profile.username || '';
}

function rolePersonName(role) {
  return profileName(role.personProfile) || profileName(role.user);
}

async function readPublicList(request, key) {
  try {
    return { items: listFromResponse(await request(), key), restricted: false };
  } catch (error) {
    const restricted = error?.status === 401 || error?.status === 403;
    return { items: [], restricted };
  }
}

async function loadPartyDetails(partyId) {
  const [roles, members, polls, suggestions, officialPosts] = await Promise.all([
    readPublicList(() => organizationAPI.getRoles(partyId), 'roles'),
    readPublicList(() => organizationAPI.getMembers(partyId), 'members'),
    readPublicList(() => organizationAPI.getPolls(partyId), 'polls'),
    readPublicList(() => organizationAPI.getSuggestions(partyId), 'suggestions'),
    readPublicList(() => organizationAPI.getOfficialPosts(partyId), 'officialPosts'),
  ]);

  return { roles, members, polls, suggestions, officialPosts };
}

function PartyLogo({ party }) {
  return party.logo ? (
    <img
      src={party.logo}
      alt={party.name}
      className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
    />
  ) : (
    <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-sm font-semibold text-gray-600">
      {getInitials(party.name)}
    </span>
  );
}

function StatPill({ icon: Icon, label, value, muted = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${
      muted ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-gray-200 bg-white text-gray-700'
    }`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-semibold text-gray-900">{value}</span>
      <span>{label}</span>
    </span>
  );
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
  const [detailsById, setDetailsById] = useState({});
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('all');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadParties() {
      setLoading(true);
      setError('');

      try {
        const response = await organizationAPI.getAll({ type: 'party', limit: 100 });
        const organizations = listFromResponse(response, 'organizations').slice().sort(sortParties);

        if (cancelled) return;
        setParties(organizations);
        setLoading(false);
        setDetailsLoading(true);

        const detailEntries = await Promise.all(
          organizations.map(async (party) => [party.id, await loadPartyDetails(party.id)])
        );

        if (!cancelled) {
          setDetailsById(Object.fromEntries(detailEntries));
          setDetailsLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Δεν ήταν δυνατή η φόρτωση των κομματικών οργανισμών.');
          setLoading(false);
          setDetailsLoading(false);
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

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Κόμμα</th>
                <th className="px-4 py-3 font-medium">Φιλοσοφία</th>
                <th className="px-4 py-3 font-medium">Άνθρωποι</th>
                <th className="px-4 py-3 text-right font-medium">Μέλη</th>
                <th className="px-4 py-3 text-right font-medium">Δράση</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredParties.map((party) => {
                const details = detailsById[party.id];
                const roleCount = details?.roles.items.length ?? 0;
                const memberCount = details?.members.restricted ? '—' : (details?.members.items.length ?? '...');
                const activityCount = (details?.polls.items.length || 0)
                  + (details?.suggestions.items.length || 0)
                  + (details?.officialPosts.items.length || 0);

                return (
                  <tr key={party.id}>
                    <td className="px-4 py-3 align-top">
                      <Link href={`/organizations/${party.slug}`} className="font-semibold text-gray-900 hover:text-blue-700">
                        {party.name}
                      </Link>
                      <div className="mt-1 text-xs text-gray-500">
                        {POSITION_LABELS[party.politicalPosition] || party.politicalPosition || 'Χωρίς θέση'}
                      </div>
                    </td>
                    <td className="max-w-sm px-4 py-3 align-top text-gray-600">
                      <span className="line-clamp-2">
                        {party.description || 'Δεν έχει προστεθεί ακόμη σύντομη φιλοσοφία/περιγραφή.'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">{roleCount}</td>
                    <td className="px-4 py-3 text-right align-top text-gray-700">{memberCount}</td>
                    <td className="px-4 py-3 text-right align-top text-gray-700">{details ? activityCount : '...'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {detailsLoading && (
          <p className="text-xs text-gray-500">Φορτώνονται άνθρωποι και δημόσια στατιστικά...</p>
        )}
      </section>

      {filteredParties.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          Δεν βρέθηκαν κομματικές οργανώσεις με αυτά τα φίλτρα.
        </div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2" aria-label="Αναλυτικές κάρτες κομμάτων">
          {filteredParties.map((party) => {
            const details = detailsById[party.id];
            const roles = details?.roles.items || [];
            const visibleRoles = roles.slice(0, 4);
            const memberCount = details?.members.restricted ? null : details?.members.items.length;
            const pollCount = details?.polls.items.length || 0;
            const suggestionCount = details?.suggestions.items.length || 0;
            const officialPostCount = details?.officialPosts.items.length || 0;
            const latestOfficialPosts = (details?.officialPosts.items || []).slice(0, 2);

            return (
              <article key={party.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <PartyLogo party={party} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 text-lg font-semibold text-gray-900">{party.name}</h2>
                      {party.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <CheckBadgeIcon className="h-3.5 w-3.5" />
                          Επαληθευμένο
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {POSITION_LABELS[party.politicalPosition] || party.politicalPosition || 'Χωρίς δηλωμένη θέση'}
                      {party.location?.name ? ` · ${party.location.name}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Φιλοσοφία</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-700">
                      {party.description || 'Η οργάνωση δεν έχει συμπληρώσει ακόμη περιγραφή, πρόγραμμα ή φιλοσοφία.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatPill icon={UserGroupIcon} label="ρόλοι" value={roles.length} />
                    <StatPill
                      icon={UserGroupIcon}
                      label={details?.members.restricted ? 'μέλη κρυφά' : 'μέλη'}
                      value={memberCount ?? '—'}
                      muted={details?.members.restricted}
                    />
                    <StatPill icon={ChartBarIcon} label="δημ. ψηφοφορίες" value={pollCount} />
                    <StatPill icon={ChartBarIcon} label="προτάσεις" value={suggestionCount} />
                    <StatPill icon={ChartBarIcon} label="επίσημα posts" value={officialPostCount} />
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Άνθρωποι</h3>
                    {visibleRoles.length > 0 ? (
                      <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                        {visibleRoles.map((role) => {
                          const person = rolePersonName(role);
                          return (
                            <li key={role.id} className="flex items-start justify-between gap-3">
                              <span className="font-medium text-gray-900">{role.title}</span>
                              <span className="text-right text-gray-600">{person || 'Κενή θέση'}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">Δεν έχουν προστεθεί δημόσιοι ρόλοι ακόμη.</p>
                    )}
                  </div>

                  {latestOfficialPosts.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Τελευταία επίσημα</h3>
                      <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                        {latestOfficialPosts.map((post) => (
                          <li key={`${post.contentType}-${post.id}`} className="line-clamp-1">
                            {post.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <PartyLinks party={party} />
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
