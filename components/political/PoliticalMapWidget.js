'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BuildingLibraryIcon, MagnifyingGlassIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { electoralDistrictAPI, locationAPI } from '@/lib/api/locations';
import { getLocationDistrictId, getProfileDistrictId } from '@/lib/parliamentary-districts';
import { loadParliamentarians, loadPoliticalCandidates, politicalPersonName } from '@/lib/political-map-data';
import { mapGeometryBounds, normalizeMapSearch } from '@/lib/map-utils';
import { mapLayerHref } from '@/lib/map-layers';
import districtsMetadata from '@/config/map-data/electoral-districts.metadata.json';
import ConsultationCommitment from './ConsultationCommitment';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });
const DISTRICTS = [...districtsMetadata.electoralDistricts].sort((a, b) => a.name.localeCompare(b.name, 'el'));
const COUNTRY_BOUNDS = { north: 42, south: 34.7, east: 29.8, west: 19.2 };
const initialFeed = { loading: true, error: false, items: [] };

function PersonPreview({ person, registration }) {
  const t = useTranslations('politicalWidget');
  const name = politicalPersonName(person);
  const image = person.photo || person.avatar;
  const href = registration ? `/candidate-registrations/${registration.id}` : `/persons/${person.slug}`;
  const party = registration ? registration.isIndependent ? t('independent') : registration.partyName
    : person.politicalAffiliations?.find(item => item.organization)?.organization.name;
  return <li className="rounded-xl border border-brand-border bg-white p-3">
    <Link href={href} className="flex items-start gap-3 rounded-lg hover:text-copper" aria-label={t(registration ? 'openCampaign' : 'openProfile', { name })}>
      {image ? <Image src={image} alt="" width={40} height={40} unoptimized className="h-10 w-10 shrink-0 rounded-full object-cover" />
        : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory text-sm font-semibold text-copper" aria-hidden="true">{name.slice(0, 1)}</span>}
      <span className="min-w-0"><span className="block break-words text-sm font-semibold text-charcoal">{name}</span>
        <span className="mt-1 block text-xs text-gray-500">{party || t('noParty')}</span>
        {registration && <span className="mt-2 block text-[10px] font-semibold text-copper">{t('cycle', { cycle: registration.electionCycle && registration.electionCycle !== 'current' ? registration.electionCycle : t('unspecifiedCycle') })}</span>}
        {(registration?.slogan || registration?.platform || person.bio) && <span className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-600">{registration?.slogan || registration?.platform || person.bio}</span>}
      </span>
    </Link>
    {registration && <ConsultationCommitment registration={registration} compact />}
  </li>;
}

export default function PoliticalMapWidget({ homeLocationId, homeLocation }) {
  const t = useTranslations('politicalWidget');
  const mapText = useTranslations('homeMap');
  const id = useId();
  const [districtId, setDistrictId] = useState('');
  const [query, setQuery] = useState('');
  const [areaSearch, setAreaSearch] = useState({ loading: false, error: false, items: [] });
  const [suggestedDistricts, setSuggestedDistricts] = useState([]);
  const [areaStatus, setAreaStatus] = useState('');
  const [representatives, setRepresentatives] = useState(initialFeed);
  const [candidates, setCandidates] = useState(initialFeed);
  const [geojson, setGeojson] = useState(null);
  const [boundaryError, setBoundaryError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const manualSelection = useRef(false);
  const resolutionRequest = useRef(0);
  const districts = useMemo(() => [...DISTRICTS, { id: 'district-state', name: mapText('electoral.state') }], [mapText]);
  const district = districts.find(item => item.id === districtId);
  const selectedFeature = geojson?.features.find(feature => feature.properties?.id === districtId);
  const focusTarget = useMemo(() => selectedFeature ? { bounds: mapGeometryBounds(selectedFeature) } : null, [selectedFeature]);
  const href = mapLayerHref('parliamentarians', districtId);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // People are only shown once a district is chosen, so fetch them on first selection
  // instead of on page load (the full MP roster is several hundred KB).
  const peopleNeeded = Boolean(districtId);
  const [peopleRequested, setPeopleRequested] = useState(false);
  useEffect(() => { if (peopleNeeded) setPeopleRequested(true); }, [peopleNeeded]);
  useEffect(() => {
    if (!peopleRequested) return undefined;
    let cancelled = false;
    const controller = new AbortController();
    setRepresentatives(initialFeed); setCandidates(initialFeed);
    loadParliamentarians().then(items => { if (!cancelled) setRepresentatives({ loading: false, error: false, items }); })
      .catch(() => { if (!cancelled) setRepresentatives({ loading: false, error: true, items: [] }); });
    loadPoliticalCandidates(controller.signal).then(items => { if (!cancelled) setCandidates({ loading: false, error: false, items }); })
      .catch(() => { if (!cancelled) setCandidates({ loading: false, error: true, items: [] }); });
    return () => { cancelled = true; controller.abort(); };
  }, [peopleRequested, retry]);

  // District boundaries are only drawn when the map is visible (desktop, or opened on mobile).
  const mapVisible = desktop || mapOpen;
  const [mapRequested, setMapRequested] = useState(false);
  useEffect(() => { if (mapVisible) setMapRequested(true); }, [mapVisible]);
  useEffect(() => {
    if (!mapRequested) return undefined;
    let cancelled = false;
    const controller = new AbortController();
    setBoundaryError(false);
    fetch('/api/electoral-districts', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Boundaries unavailable');
      const body = await response.json();
      if (!Array.isArray(body.features) || !body.features.length) throw new Error('Boundaries unavailable');
      if (!cancelled) setGeojson(body);
    }).catch(() => { if (!cancelled) setBoundaryError(true); });
    return () => { cancelled = true; controller.abort(); };
  }, [mapRequested, retry]);

  const chooseDistrict = useCallback(value => {
    manualSelection.current = true; resolutionRequest.current += 1;
    setDistrictId(value); setQuery(''); setSuggestedDistricts([]); setAreaStatus('');
  }, []);

  const resolveArea = useCallback(async location => {
    const request = ++resolutionRequest.current;
    const direct = getLocationDistrictId(location);
    setSuggestedDistricts([]); setQuery(''); setDistrictId('');
    if (direct) { setDistrictId(direct); setQuery(''); setAreaStatus(''); return; }
    setAreaStatus('resolving');
    try {
      const response = await electoralDistrictAPI.getMunicipalityDistricts(location.id);
      if (request !== resolutionRequest.current) return;
      if (!response?.success) throw new Error('District unavailable');
      const matches = [...new Set((response.districts || []).map(getLocationDistrictId).filter(Boolean))];
      if (matches.length === 1) {
        setDistrictId(matches[0]); setQuery(''); setAreaStatus('');
      } else {
        setDistrictId(''); setSuggestedDistricts(matches);
        setAreaStatus(matches.length ? 'multipleDistricts' : 'chooseManually');
      }
    } catch { if (request === resolutionRequest.current) setAreaStatus('areaError'); }
  }, []);

  useEffect(() => {
    if (manualSelection.current) return;
    setDistrictId(''); setAreaStatus('');
    if (homeLocationId) resolveArea({ id: homeLocationId, slug: homeLocation?.slug });
    return () => { resolutionRequest.current += 1; };
  }, [homeLocationId, homeLocation?.slug, resolveArea]);
  useEffect(() => () => { resolutionRequest.current += 1; }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) { setAreaSearch({ loading: false, error: false, items: [] }); return; }
    let cancelled = false;
    setAreaSearch({ loading: true, error: false, items: [] });
    const timer = setTimeout(() => {
      locationAPI.getMapActivity({ search: term }).then(response => {
        if (!response?.success) throw new Error('Search unavailable');
        if (!cancelled) setAreaSearch({ loading: false, error: false, items: (response.locations || []).slice(0, 4) });
      }).catch(() => { if (!cancelled) setAreaSearch({ loading: false, error: true, items: [] }); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const districtMatches = query.trim().length >= 2 ? districts.filter(item => normalizeMapSearch(item.name).includes(normalizeMapSearch(query))).slice(0, 4) : [];
  const mps = representatives.items.filter(person => getProfileDistrictId(person) === districtId);
  const campaigns = candidates.items.filter(item => item.districtId === districtId);
  const polygons = useMemo(() => geojson ? [{ id: 'political-widget-districts', geojson,
    style: { color: '#b5a598', weight: 1, fillColor: '#e9cbb9', fillOpacity: 0.35 },
    hoverStyle: { color: '#80462f', weight: 2, fillOpacity: 0.6 },
    styleFeature: (feature, style) => feature.properties?.id === districtId ? { ...style, color: '#80462f', weight: 2.5, fillColor: '#bc8868', fillOpacity: 0.65 } : style,
    // District names are bundled data, escaped before Leaflet inserts the tooltip.
    getTooltip: properties => String(properties.name || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]),
    fitBoundsOnClick: false,
    onFeatureClick: feature => chooseDistrict(feature.properties?.id || ''),
  }] : [], [geojson, districtId, chooseDistrict]);

  const renderPeople = (feed, people, isCandidate) => <section aria-label={t(isCandidate ? 'candidates' : 'representatives')} className="min-w-0">
    <div className="mb-3 flex items-center gap-2">
      {isCandidate ? <UserGroupIcon className="h-4 w-4 text-copper" aria-hidden="true" /> : <BuildingLibraryIcon className="h-4 w-4 text-copper" aria-hidden="true" />}
      <h4 className="text-sm font-semibold text-charcoal">{t(isCandidate ? 'candidates' : 'representatives')}</h4>
      {!feed.loading && !feed.error && <span className="ml-auto rounded-full bg-ivory px-2 py-1 text-xs font-semibold text-gray-600">{people.length}</span>}
    </div>
    {feed.loading ? <p role="status" className="text-xs text-gray-500">{t('loading')}</p> : feed.error ? <p role="alert" className="text-xs text-red-700">{t('peopleError')} <button type="button" onClick={() => setRetry(value => value + 1)} className="min-h-9 underline">{mapText('retry')}</button></p>
      : people.length ? <ul className="space-y-3">{people.slice(0, 2).map(item => <PersonPreview key={item.id} person={isCandidate ? item.candidate : item} registration={isCandidate ? item : undefined} />)}</ul>
        : <p className="rounded-xl bg-ivory/50 p-3 text-xs leading-relaxed text-gray-500">{t(isCandidate ? 'emptyCandidates' : 'emptyRepresentatives')}</p>}
    {people.length > 2 && <Link href={href} className="mt-2 inline-flex min-h-10 items-center text-xs font-semibold text-copper hover:underline">{t('seeAll', { count: people.length })} →</Link>}
  </section>;

  return <div className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
    <div className="border-b border-brand-border bg-ivory/40 p-4 sm:p-5">
      <label htmlFor={`${id}-search`} className="mb-2 block text-base font-semibold text-charcoal">{t('findDistrict')}</label>
      <div className="flex flex-wrap gap-2">
        <div className="flex min-w-0 basis-full items-center gap-2 rounded-xl border border-brand-border bg-white px-3 sm:flex-1 sm:basis-auto">
          <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-copper" aria-hidden="true" />
          <input id={`${id}-search`} type="search" maxLength={100} value={query} onChange={event => { manualSelection.current = true; resolutionRequest.current += 1; setAreaStatus(''); setQuery(event.target.value); }} placeholder={t('searchPlaceholder')} aria-controls={query.trim().length >= 2 ? `${id}-matches` : undefined} className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </div>
        <select aria-label={t('districtSelect')} value={districtId} onChange={event => chooseDistrict(event.target.value)} className="min-h-11 min-w-0 max-w-full flex-1 rounded-xl border border-brand-border bg-white px-3 text-sm sm:max-w-64">
          <option value="">{t('chooseDistrict')}</option>
          {districts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        {homeLocationId && <button type="button" onClick={() => { manualSelection.current = true; resolveArea({ id: homeLocationId, slug: homeLocation?.slug }); }} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-brand-border px-3 text-xs font-semibold text-copper"><MapPinIcon className="h-4 w-4" />{mapText('myArea')}</button>}
      </div>
      {query.trim().length >= 2 && <div id={`${id}-matches`} className="mt-3 grid gap-2 sm:grid-cols-2" aria-live="polite">
        {districtMatches.map(item => <button key={item.id} type="button" onClick={() => chooseDistrict(item.id)} className="min-h-11 rounded-lg border border-brand-border bg-white p-2 text-left text-xs font-semibold hover:border-copper">{item.name}</button>)}
        {areaSearch.items.map(location => <button key={location.id} type="button" onClick={() => resolveArea(location)} className="min-h-11 rounded-lg border border-brand-border bg-white p-2 text-left text-xs hover:border-copper">{location.name_local || location.name}</button>)}
        {areaSearch.loading && <p role="status" className="text-xs text-gray-500">{mapText('searching')}</p>}
        {areaSearch.error && <p className="text-xs text-gray-500">{t('areaError')}</p>}
        {!areaSearch.loading && !areaSearch.error && !areaSearch.items.length && !districtMatches.length && <p className="text-xs text-gray-500">{mapText('noAreas')}</p>}
      </div>}
      {areaStatus && <p role="status" className="mt-3 text-xs leading-relaxed text-gray-600">{t(areaStatus)}</p>}
      {suggestedDistricts.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{districts.filter(item => suggestedDistricts.includes(item.id)).map(item => <button key={item.id} type="button" onClick={() => chooseDistrict(item.id)} className="min-h-11 rounded-xl border border-copper/30 bg-white px-3 text-xs font-semibold text-copper">{item.name}</button>)}</div>}
    </div>
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.4fr)]">
      <div className="order-1 min-w-0 p-4 sm:p-5 lg:order-2">
        {district ? <>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div><p className="text-[10px] font-semibold uppercase tracking-widest text-copper">{t('yourDistrict')}</p><h3 className="mt-1 text-xl font-semibold text-charcoal" aria-live="polite">{district.name}</h3></div>
            <button type="button" onClick={() => chooseDistrict('')} className="min-h-10 text-xs font-semibold text-copper hover:underline">{t('changeDistrict')}</button>
          </div>
          {districtId === 'district-state' && <p className="mb-3 text-xs text-gray-500">{mapText('electoral.stateHint')}</p>}
          <div className="grid gap-5 sm:grid-cols-2">{renderPeople(representatives, mps, false)}{renderPeople(candidates, campaigns, true)}</div>
          <p className="mt-4 text-[10px] leading-relaxed text-gray-500">{t('cycleNote')}</p>
        </> : <div className="flex min-h-40 flex-col justify-center rounded-xl border border-dashed border-brand-border bg-ivory/30 p-5 lg:min-h-[320px]">
          <MapPinIcon className="mb-3 h-7 w-7 text-copper" aria-hidden="true" />
          <h3 className="text-xl font-semibold text-charcoal">{t('promptTitle')}</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">{t('promptBody')}</p>
        </div>}
      </div>
      <div className="order-2 border-t border-brand-border lg:order-1 lg:border-r lg:border-t-0">
        <button type="button" aria-expanded={mapOpen} aria-controls={`${id}-map`} onClick={() => setMapOpen(value => !value)} className="flex min-h-12 w-full items-center justify-between px-4 text-xs font-semibold text-copper lg:hidden">{t(mapOpen ? 'hideMap' : 'showMap')}<span aria-hidden="true">{mapOpen ? '−' : '+'}</span></button>
        <div id={`${id}-map`} className={`${mapOpen ? 'block' : 'hidden'} relative h-[260px] bg-ivory lg:block lg:h-full lg:min-h-[360px]`}>
          {(desktop || mapOpen) && (boundaryError ? <p role="alert" className="p-4 text-xs text-red-700">{t('mapError')} <button type="button" onClick={() => setRetry(value => value + 1)} className="min-h-10 underline">{mapText('retry')}</button></p> : <BaseMap center={[38.5, 23.8]} zoom={6} zoomAnimation={false} bounds={COUNTRY_BOUNDS} polygonLayers={polygons} className="h-full w-full" focusTarget={focusTarget} viewResetKey={districtId ? 0 : 1} ariaLabel={t('mapLabel')} />)}
        </div>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border bg-ivory/40 px-4 py-3 sm:px-5">
      <p className="text-xs text-gray-500">{t('fullMapHint')}</p>
      <Link href={href} className="inline-flex min-h-11 items-center rounded-xl bg-charcoal px-4 text-sm font-semibold text-white hover:bg-copper">{t(district ? 'exploreDistrict' : 'openMap')} →</Link>
    </div>
  </div>;
}
