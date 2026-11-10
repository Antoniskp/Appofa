'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { personAPI, organizationAPI, locationAPI } from '@/lib/api';
import regionsMetaData from '@/config/map-data/regions.metadata.json';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });
const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('el').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const CENTER = [38.5, 23.8];

export default function ParliamentarianDirectory({ regionsGeoJson }) {
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState([]);
  const [parties, setParties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [partyId, setPartyId] = useState(searchParams.get('party') || '');
  const [regionId, setRegionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [peopleResult, partyResult, firstLocationResult] = await Promise.all([
          personAPI.getAll({ position: 'parliamentary', page: 1, limit: 100 }),
          organizationAPI.getAll({ type: 'party', limit: 100 }),
          locationAPI.getAll({ limit: 1000, offset: 0 }),
        ]);
        const peopleData = peopleResult?.data || {};
        const allProfiles = [...(peopleData.profiles || [])];
        const pages = Math.min(20, Number(peopleData.pagination?.totalPages || 1));
        for (let page = 2; page <= pages; page += 1) {
          const result = await personAPI.getAll({ position: 'parliamentary', page, limit: 100 });
          allProfiles.push(...(result?.data?.profiles || []));
        }
        const allLocations = [...(firstLocationResult?.locations || firstLocationResult?.data?.locations || [])];
        const locationTotal = Number(firstLocationResult?.pagination?.total || firstLocationResult?.data?.pagination?.total || allLocations.length);
        for (let offset = 1000; offset < locationTotal; offset += 1000) {
          const result = await locationAPI.getAll({ limit: 1000, offset });
          allLocations.push(...(result?.locations || result?.data?.locations || []));
        }
        if (!active) return;
        setProfiles(allProfiles);
        setParties(partyResult?.organizations || partyResult?.data?.organizations || []);
        setLocations(allLocations);
      } catch {
        if (active) setError('Δεν ήταν δυνατή η φόρτωση των βουλευτών. Δοκιμάστε ξανά αργότερα.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const regionLocationIds = useMemo(() => {
    if (!regionId) return null;
    const region = regionsMetaData.regions.find((item) => item.id === regionId);
    const location = locations.find((item) => normalize(item.name) === normalize(region?.locationSearch));
    if (!location) return new Set();
    return new Set([String(location.id), ...locations.filter((item) => String(item.parent_id) === String(location.id)).map((item) => String(item.id))]);
  }, [regionId, locations]);

  const visibleProfiles = useMemo(() => profiles.filter((profile) => {
    const name = normalize([profile.firstNameNative, profile.lastNameNative, profile.firstNameEn, profile.lastNameEn, profile.nickname].filter(Boolean).join(' '));
    if (search && !name.includes(normalize(search))) return false;
    if (partyId && !(profile.politicalAffiliations || []).some((affiliation) => String(affiliation.organizationId || affiliation.organization?.id) === String(partyId))) return false;
    if (regionLocationIds) {
      const constituency = profile.constituency;
      if (!constituency || !regionLocationIds.has(String(constituency.id)) && !regionLocationIds.has(String(constituency.parent_id))) return false;
    }
    return true;
  }), [profiles, search, partyId, regionLocationIds]);

  const regionCounts = useMemo(() => Object.fromEntries(regionsMetaData.regions.map((region) => {
    const regionLocation = locations.find((item) => normalize(item.name) === normalize(region.locationSearch));
    const childIds = new Set(regionLocation ? [String(regionLocation.id), ...locations.filter((item) => String(item.parent_id) === String(regionLocation.id)).map((item) => String(item.id))] : []);
    const count = profiles.filter((profile) => {
      const name = normalize([profile.firstNameNative, profile.lastNameNative, profile.firstNameEn, profile.lastNameEn, profile.nickname].filter(Boolean).join(' '));
      if (search && !name.includes(normalize(search))) return false;
      if (partyId && !(profile.politicalAffiliations || []).some((affiliation) => String(affiliation.organizationId || affiliation.organization?.id) === String(partyId))) return false;
      const constituency = profile.constituency;
      return constituency && (childIds.has(String(constituency.id)) || childIds.has(String(constituency.parent_id)));
    }).length;
    return [region.id, count];
  })), [profiles, locations, search, partyId]);

  const polygons = useMemo(() => [{
    id: 'parliamentarian-regions',
    geojson: regionsGeoJson,
    style: { color: '#64748b', weight: 1.2, fillColor: '#94a3b8', fillOpacity: 0.08 },
    hoverStyle: { color: '#1d4ed8', weight: 2.2, fillColor: '#60a5fa', fillOpacity: 0.3 },
    fitBoundsOnClick: false,
    styleFeature: (feature, style) => regionId === feature?.properties?.id ? { ...style, color: '#1d4ed8', weight: 2.5, fillColor: '#3b82f6', fillOpacity: 0.38 } : style,
    onFeatureClick: (feature) => setRegionId((current) => current === feature?.properties?.id ? '' : feature?.properties?.id || ''),
    getTooltip: (props) => `${props.name || ''} · ${regionCounts[props.id] || 0} βουλευτές`,
  }], [regionId, regionCounts, regionsGeoJson]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Εκλογές &amp; Πολιτική</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Βουλευτές</h1>
        <p className="mt-2 max-w-3xl text-gray-600">Αναζητήστε τους βουλευτές και εξερευνήστε την εκλογική τους περιφέρεια στον χάρτη.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="order-2 space-y-4 lg:order-1">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="sr-only" htmlFor="parliamentarian-search">Αναζήτηση βουλευτή</label>
            <input id="parliamentarian-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Αναζήτηση ονόματος" className="rounded-lg border border-gray-300 px-3 py-2" />
            <label className="sr-only" htmlFor="parliamentarian-party">Κόμμα</label>
            <select id="parliamentarian-party" value={partyId} onChange={(event) => setPartyId(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2">
              <option value="">Όλα τα κόμματα</option>
              {parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{regionId ? regionsMetaData.regions.find((item) => item.id === regionId)?.name : 'Όλη η Ελλάδα'} · {visibleProfiles.length} βουλευτές</span>
            {(regionId || partyId || search) && <button type="button" onClick={() => { setRegionId(''); setPartyId(''); setSearch(''); }} className="font-medium text-blue-700 hover:underline">Καθαρισμός φίλτρων</button>}
          </div>
          {loading ? <p className="rounded-xl border border-gray-200 p-6 text-gray-600">Φόρτωση βουλευτών…</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p> : visibleProfiles.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {visibleProfiles.map((person) => {
                const name = [person.firstNameNative, person.lastNameNative].filter(Boolean).join(' ') || [person.firstNameEn, person.lastNameEn].filter(Boolean).join(' ') || person.nickname || 'Βουλευτής';
                const affiliation = (person.politicalAffiliations || []).find((item) => !partyId || String(item.organizationId || item.organization?.id) === String(partyId));
                return <li key={person.id}><Link href={`/persons/${person.slug}`} className="flex h-full gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm">
                  {person.photo || person.avatar ? <Image src={person.photo || person.avatar} alt="" width={56} height={56} unoptimized className="h-14 w-14 shrink-0 rounded-full object-cover" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-700">{name.slice(0, 1)}</span>}
                  <span className="min-w-0"><span className="block font-semibold text-gray-900">{name}</span><span className="mt-1 block text-sm text-gray-600">{affiliation?.organization?.name || 'Ανεξάρτητος'}{person.constituency?.name ? ` · ${person.constituency.name}` : ''}</span></span>
                </Link></li>;
              })}
            </ul>
          ) : <p className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-600">Δεν βρέθηκαν βουλευτές με αυτά τα φίλτρα.</p>}
        </div>

        <aside className="order-1 lg:order-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3"><div><h2 className="font-semibold text-gray-900">Βουλευτές ανά περιφέρεια</h2><p className="text-xs text-gray-500">Επιλέξτε περιοχή για φιλτράρισμα</p></div>{regionId && <button type="button" onClick={() => setRegionId('')} className="text-sm text-blue-700 hover:underline">Όλες</button>}</div>
            <div className="h-[390px]"><BaseMap center={CENTER} zoom={6} polygonLayers={polygons} className="h-full w-full" scrollWheelZoom={false} interactive /></div>
            <p className="px-4 py-2 text-xs text-gray-500">Η κατανομή βασίζεται στην εκλογική περιφέρεια που έχει καταχωριστεί για κάθε βουλευτή. Όρια: <a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer" className="underline">geoBoundaries / EuroGeoGraphics (2016)</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline">CC BY 4.0</a>.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
