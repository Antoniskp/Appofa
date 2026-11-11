'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { personAPI, organizationAPI } from '@/lib/api';
import regionsMetaData from '@/config/map-data/regions.metadata.json';
import districtsMetaData from '@/config/map-data/electoral-districts.metadata.json';
import districtLocationSlugs from '@/config/map-data/electoral-district-location-slugs.json';
import parliamentaryAssignments from '@/src/data/currentParliamentaryAssignments';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });
const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('el').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const CENTER = [38.5, 23.8];
const STATE_DISTRICT = {
  id: 'district-state',
  name: 'Επικρατείας',
  regionId: null,
  locationType: 'electoral_district',
};

const districtById = new Map([
  ...districtsMetaData.electoralDistricts.map((district) => [district.id, district]),
  [STATE_DISTRICT.id, STATE_DISTRICT],
]);
const regionById = new Map(regionsMetaData.regions.map((region) => [region.id, region]));
const districtIdByLocationSlug = new Map(Object.entries(districtLocationSlugs));
const assignmentByProfileSlug = new Map(
  parliamentaryAssignments.map((assignment) => [assignment.profileSlug, assignment])
);
const sortedRegions = [...regionsMetaData.regions].sort((a, b) => a.name.localeCompare(b.name, 'el'));
const sortedDistricts = [...districtsMetaData.electoralDistricts].sort((a, b) => a.name.localeCompare(b.name, 'el'));

function getProfileDistrictId(profile) {
  const rosterSlug = assignmentByProfileSlug.get(profile.slug)?.electoralDistrictSlug;
  return districtIdByLocationSlug.get(rosterSlug)
    || districtIdByLocationSlug.get(profile.constituency?.slug)
    || null;
}

export default function ParliamentarianDirectory({ districtsGeoJson }) {
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState([]);
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState('');
  const [partyId, setPartyId] = useState(searchParams.get('party') || '');
  const [regionId, setRegionId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [peopleResult, partyResult] = await Promise.all([
          personAPI.getAll({ position: 'parliamentary', page: 1, limit: 100 }),
          organizationAPI.getAll({ type: 'party', limit: 100 }),
        ]);
        const peopleData = peopleResult?.data || {};
        const allProfiles = [...(peopleData.profiles || [])];
        const pages = Math.min(20, Number(peopleData.pagination?.totalPages || 1));
        for (let page = 2; page <= pages; page += 1) {
          const result = await personAPI.getAll({ position: 'parliamentary', page, limit: 100 });
          allProfiles.push(...(result?.data?.profiles || []));
        }
        if (!active) return;
        setProfiles(allProfiles);
        setParties(partyResult?.organizations || partyResult?.data?.organizations || []);
      } catch {
        if (active) setError('Δεν ήταν δυνατή η φόρτωση των βουλευτών. Δοκιμάστε ξανά αργότερα.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const profilesWithDistricts = useMemo(() => profiles.map((profile) => ({
    ...profile,
    mapDistrictId: getProfileDistrictId(profile),
  })), [profiles]);

  const searchAndPartyProfiles = useMemo(() => profilesWithDistricts.filter((profile) => {
    const name = normalize([
      profile.firstNameNative,
      profile.lastNameNative,
      profile.firstNameEn,
      profile.lastNameEn,
      profile.nickname,
    ].filter(Boolean).join(' '));
    if (search && !name.includes(normalize(search))) return false;
    if (partyId && !(profile.politicalAffiliations || []).some((affiliation) => (
      String(affiliation.organizationId || affiliation.organization?.id) === String(partyId)
    ))) return false;
    return true;
  }), [profilesWithDistricts, search, partyId]);

  const districtCounts = useMemo(() => {
    const counts = {};
    searchAndPartyProfiles.forEach((profile) => {
      if (profile.mapDistrictId) counts[profile.mapDistrictId] = (counts[profile.mapDistrictId] || 0) + 1;
    });
    return counts;
  }, [searchAndPartyProfiles]);

  const visibleProfiles = useMemo(() => searchAndPartyProfiles.filter((profile) => {
    if (districtId && profile.mapDistrictId !== districtId) return false;
    if (regionId && districtById.get(profile.mapDistrictId)?.regionId !== regionId) return false;
    return true;
  }), [searchAndPartyProfiles, districtId, regionId]);

  const districtOptions = useMemo(() => {
    const regionalDistricts = regionId
      ? sortedDistricts.filter((district) => district.regionId === regionId)
      : sortedDistricts;
    return regionId ? regionalDistricts : [...regionalDistricts, STATE_DISTRICT];
  }, [regionId]);

  const polygons = useMemo(() => [{
    id: 'electoral-districts',
    geojson: districtsGeoJson,
    style: { color: '#64748b', weight: 1.1, fillColor: '#94a3b8', fillOpacity: 0.07 },
    hoverStyle: { color: '#1d4ed8', weight: 2, fillColor: '#60a5fa', fillOpacity: 0.28 },
    fitBoundsOnClick: true,
    styleFeature: (feature, style) => {
      const featureId = feature?.properties?.id;
      if (featureId === districtId) {
        return { ...style, color: '#9a3412', weight: 2.8, fillColor: '#fb923c', fillOpacity: 0.45 };
      }
      if (regionId && feature?.properties?.regionId === regionId) {
        return { ...style, color: '#1d4ed8', weight: 1.5, fillColor: '#60a5fa', fillOpacity: 0.17 };
      }
      return style;
    },
    onFeatureClick: (feature) => {
      const clickedDistrict = feature?.properties?.id;
      const clickedRegion = feature?.properties?.regionId;
      if (!clickedDistrict) return;
      setDistrictId((current) => current === clickedDistrict ? '' : clickedDistrict);
      setRegionId(clickedRegion || '');
    },
    getTooltip: (props) => `${props.name || ''} · ${districtCounts[props.id] || 0} βουλευτές`,
  }], [districtsGeoJson, districtCounts, districtId, regionId]);

  const clearFilters = () => {
    setRegionId('');
    setDistrictId('');
    setPartyId('');
    setSearch('');
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Εκλογές &amp; Πολιτική</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Βουλευτές</h1>
        <p className="mt-2 max-w-3xl text-gray-600">Αναζητήστε τους βουλευτές ανά κόμμα και εκλογική περιφέρεια στον χάρτη.</p>
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
            <span>{districtId ? districtById.get(districtId)?.name : regionId ? regionById.get(regionId)?.name : 'Όλη η Ελλάδα'} · {visibleProfiles.length} βουλευτές</span>
            {(regionId || districtId || partyId || search) && <button type="button" onClick={clearFilters} className="font-medium text-blue-700 hover:underline">Καθαρισμός φίλτρων</button>}
          </div>
          {loading ? <p className="rounded-xl border border-gray-200 p-6 text-gray-600">Φόρτωση βουλευτών…</p> : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</p> : visibleProfiles.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {visibleProfiles.map((person) => {
                const name = [person.firstNameNative, person.lastNameNative].filter(Boolean).join(' ') || [person.firstNameEn, person.lastNameEn].filter(Boolean).join(' ') || person.nickname || 'Βουλευτής';
                const affiliation = (person.politicalAffiliations || []).find((item) => !partyId || String(item.organizationId || item.organization?.id) === String(partyId));
                const district = districtById.get(person.mapDistrictId);
                const districtLabel = district?.name || person.constituency?.name || 'Εκλογική περιφέρεια μη καταχωρισμένη';
                return <li key={person.id}><Link href={`/persons/${person.slug}`} className="flex h-full gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm">
                  {person.photo || person.avatar ? <Image src={person.photo || person.avatar} alt="" width={56} height={56} unoptimized className="h-14 w-14 shrink-0 rounded-full object-cover" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-700">{name.slice(0, 1)}</span>}
                  <span className="min-w-0"><span className="block font-semibold text-gray-900">{name}</span><span className="mt-1 block text-sm text-gray-600">{affiliation?.organization?.name || 'Ανεξάρτητος'} · {districtLabel}</span></span>
                </Link></li>;
              })}
            </ul>
          ) : <p className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-600">Δεν βρέθηκαν βουλευτές με αυτά τα φίλτρα.</p>}
        </div>

        <aside className="order-1 lg:order-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3"><div><h2 className="font-semibold text-gray-900">Βουλευτές ανά εκλογική περιφέρεια</h2><p className="text-xs text-gray-500">Επιλέξτε περιφέρεια ή πατήστε ένα πολύγωνο</p></div>{(regionId || districtId) && <button type="button" onClick={() => { setRegionId(''); setDistrictId(''); }} className="text-sm text-blue-700 hover:underline">Όλες</button>}</div>
            <div className="relative h-[420px]">
              <div className="absolute left-3 right-3 top-3 z-[1000] grid gap-2 rounded-lg bg-white/95 p-2 shadow sm:right-auto sm:w-[300px]">
                <label className="sr-only" htmlFor="parliamentarian-map-region">Περιφέρεια</label>
                <select id="parliamentarian-map-region" value={regionId} onChange={(event) => { setRegionId(event.target.value); setDistrictId(''); }} className="min-w-0 rounded border border-gray-300 bg-white px-2 py-2 text-sm text-gray-800">
                  <option value="">Όλες οι περιφέρειες</option>
                  {sortedRegions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                </select>
                <label className="sr-only" htmlFor="parliamentarian-map-district">Εκλογική περιφέρεια</label>
                <select id="parliamentarian-map-district" value={districtId} onChange={(event) => {
                  const nextDistrictId = event.target.value;
                  setDistrictId(nextDistrictId);
                  setRegionId(districtById.get(nextDistrictId)?.regionId || '');
                }} className="min-w-0 rounded border border-gray-300 bg-white px-2 py-2 text-sm text-gray-800">
                  <option value="">Όλες οι εκλογικές περιφέρειες</option>
                  {districtOptions.map((district) => <option key={district.id} value={district.id}>{district.name}{district.seats ? ` · ${district.seats} έδρες` : ' · χωρίς γεωγραφικό πολύγωνο'}</option>)}
                </select>
              </div>
              <BaseMap center={CENTER} zoom={6} polygonLayers={polygons} className="h-full w-full" scrollWheelZoom={false} interactive />
            </div>
            <p className="px-4 py-2 text-xs text-gray-500">Πολύγωνα: <a href="https://github.com/codeforgermany/click_that_hood/blob/main/public/data/greece-prefectures.geojson" target="_blank" rel="noreferrer" className="underline">Click That Hood / Eurostat</a>. Οι περιφέρειες Αττικής και Θεσσαλονίκης βασίζονται σε γεωμετρίες δήμων <a href="https://www.geoboundaries.org/api/current/gbOpen/GRC/ADM3/" target="_blank" rel="noreferrer" className="underline">geoBoundaries ADM3</a> και στον καταμερισμό του <a href="https://www.ypes.gr/statistika/ethnikes-ekloges/vouleutikes-ekloges/endiaferoyn-toys-syndyasmoys" target="_blank" rel="noreferrer" className="underline">Υπουργείου Εσωτερικών</a>.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
