'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import BaseMap from '@/components/map/BaseMap';
import ConsultationCommitment from '@/components/political/ConsultationCommitment';
import { loadParliamentarians, loadPoliticalCandidates } from '@/lib/political-map-data';
import { getProfileDistrictId } from '@/lib/parliamentary-districts';
import { mapGeometryBounds, normalizeMapSearch } from '@/lib/map-utils';
import districtsMetadata from '@/config/map-data/electoral-districts.metadata.json';

const COUNTRY_BOUNDS = { north: 42, south: 34.7, east: 29.8, west: 19.2 };
const DISTRICTS = [...districtsMetadata.electoralDistricts].sort((a, b) => a.name.localeCompare(b.name, 'el'));
const escape = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const personName = person => [person.firstNameNative, person.lastNameNative].filter(Boolean).join(' ')
  || [person.firstNameEn, person.lastNameEn].filter(Boolean).join(' ') || person.nickname || person.username || person.slug;

export default function HomeElectoralMap({ tileMode = 'light', onTileModeChange, onDistrictChange, initialDistrictId = '' }) {
  const t = useTranslations('homeMap');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  const [districtId, setDistrictId] = useState(() => initialDistrictId === 'district-state'
    || DISTRICTS.some(district => district.id === initialDistrictId) ? initialDistrictId : '');
  const [peopleMode, setPeopleMode] = useState('representatives');
  const [cycle, setCycle] = useState('');
  const [candidates, setCandidates] = useState(null);
  const [candidateError, setCandidateError] = useState(false);
  const [candidateRetry, setCandidateRetry] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [viewResetKey, setViewResetKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(true);
  const results = useRef(null);
  const initialFocus = useRef(false);
  const areaControls = useRef(null);
  const areasReady = useCallback(controls => { areaControls.current = controls; }, []);
  const highlight = id => { setHoveredId(id); areaControls.current?.highlight(id); };
  const unhighlight = id => { setHoveredId(null); areaControls.current?.unhighlight(id); };
  const districts = useMemo(() => [...DISTRICTS, { id: 'district-state', name: t('electoral.state') },
    ...(peopleMode === 'candidates' ? [{ id: 'unassigned', name: t('electoral.unassigned') }] : [])], [t, peopleMode]);
  const selectedDistrict = districts.find(district => district.id === districtId);

  useEffect(() => {
    if (peopleMode !== 'candidates') return;
    let cancelled = false;
    const controller = new AbortController();
    setCandidates(null); setCandidateError(false);
    loadPoliticalCandidates(controller.signal).then(items => { if (!cancelled) setCandidates(items); })
      .catch(() => { if (!cancelled) setCandidateError(true); });
    return () => { cancelled = true; controller.abort(); };
  }, [peopleMode, candidateRetry]);
  const cycles = useMemo(() => [...new Set((candidates || []).map(item => item.electionCycle || 'current'))].sort().reverse(), [candidates]);
  const candidateMode = peopleMode === 'candidates';
  const peopleLoading = loading || (candidateMode && candidates === null && !candidateError);
  const peopleError = error || (candidateMode && candidateError);
  const countLabel = candidateMode ? 'electoral.candidateCount' : 'electoral.mpCount';
  const people = useMemo(() => candidateMode ? (candidates || [])
    .filter(item => !cycle || (item.electionCycle || 'current') === cycle)
    .map(item => ({ ...item.candidate, id: item.id, districtId: item.districtId || 'unassigned',
      campaign: item, href: `/candidate-registrations/${item.id}` })) : data?.profiles || [], [candidateMode, candidates, cycle, data]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true); setError(false); setData(null);
    Promise.all([
      fetch('/api/electoral-districts', { signal: controller.signal }).then(response => {
        if (!response.ok) throw new Error('Boundaries unavailable');
        return response.json();
      }),
      loadParliamentarians(),
    ]).then(([geojson, profiles]) => {
      if (!Array.isArray(geojson.features) || !geojson.features.length) throw new Error('Boundaries unavailable');
      if (!cancelled) setData({ geojson, profiles: profiles.map(profile => ({ ...profile, districtId: getProfileDistrictId(profile) })) });
    }).catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [retry]);

  useEffect(() => {
    if (!data || initialFocus.current) return;
    initialFocus.current = true;
    const feature = data.geojson.features.find(item => item.properties?.id === initialDistrictId);
    const bounds = feature && mapGeometryBounds(feature);
    if (bounds) setFocusTarget({ bounds });
  }, [data, initialDistrictId]);

  const matchingProfiles = useMemo(() => {
    const term = normalizeMapSearch(query);
    return people.filter(person => !term || normalizeMapSearch([
      personName(person), person.firstNameEn, person.lastNameEn,
      districts.find(district => district.id === person.districtId)?.name,
      ...(person.politicalAffiliations || []).map(item => item.organization?.name),
      person.campaign?.partyName, person.campaign?.slogan,
    ].filter(Boolean).join(' ')).includes(term));
  }, [people, districts, query]);
  const districtCounts = useMemo(() => {
    const counts = {};
    matchingProfiles.forEach(person => { if (person.districtId) counts[person.districtId] = (counts[person.districtId] || 0) + 1; });
    return counts;
  }, [matchingProfiles]);
  const matchingDistricts = districts.filter(district => !query.trim()
    || normalizeMapSearch(district.name).includes(normalizeMapSearch(query)) || districtCounts[district.id]);
  const visibleProfiles = matchingProfiles.filter(person => person.districtId === districtId);

  const chooseDistrict = useCallback(id => {
    setDistrictId(id); setHoveredId(null); setSheetOpen(true);
    onDistrictChange?.(id);
    const feature = data?.geojson.features.find(item => item.properties?.id === id);
    const bounds = feature && mapGeometryBounds(feature);
    setFocusTarget(bounds ? { bounds } : null);
    if (results.current) results.current.scrollTop = 0;
  }, [data, onDistrictChange]);
  const polygons = useMemo(() => data ? [{
    id: 'home-electoral-districts', geojson: data.geojson,
    style: { color: '#b5a598', weight: 1, fillColor: '#e9cbb9', fillOpacity: 0.4 },
    hoverStyle: { color: '#80462f', weight: 2.5, fillOpacity: 0.65 },
    styleFeature: (feature, style) => feature.properties?.id === districtId
      ? { ...style, color: '#80462f', weight: 2.5, fillColor: '#bc8868', fillOpacity: 0.65 } : style,
    getTooltip: props => `${escape(props.name)} · ${escape(t(countLabel, { count: districtCounts[props.id] || 0 }))}`,
    fitBoundsOnClick: false,
    onFeatureClick: feature => chooseDistrict(feature.properties?.id || ''),
    onFeatureHover: feature => setHoveredId(feature?.properties?.id || null),
    onLayerInit: areasReady,
  }] : [], [data, districtId, districtCounts, countLabel, t, chooseDistrict, areasReady]);
  const reset = () => {
    chooseDistrict(''); setQuery(''); setViewResetKey(value => value + 1);
  };

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border bg-ivory/40 p-3 sm:px-4">
      <div role="group" aria-label={t('electoral.people')} className="flex flex-wrap gap-2">
        {['representatives', 'candidates'].map(mode => <button key={mode} type="button" aria-pressed={peopleMode === mode}
          onClick={() => { setPeopleMode(mode); if (districtId === 'unassigned') chooseDistrict(''); }}
          className={`min-h-11 rounded-lg px-3 text-xs font-semibold ${peopleMode === mode ? 'bg-charcoal text-white' : 'border border-brand-border bg-white text-gray-600'}`}>{t(`electoral.${mode}`)}</button>)}
      </div>
      {candidateMode && <select aria-label={t('electoral.cycle')} value={cycle} onChange={event => setCycle(event.target.value)} className="min-h-11 max-w-full rounded-lg border border-brand-border bg-white px-3 text-xs">
        <option value="">{t('electoral.allCycles')}</option>
        {cycles.map(value => <option key={value} value={value}>{value === 'current' ? t('electoral.unspecifiedCycle') : value}</option>)}
      </select>}
    </div>
    {candidateMode && <p className="border-b border-brand-border bg-ivory/30 px-4 py-3 text-xs leading-relaxed text-gray-600">{t('electoral.candidateHint')}</p>}
    <div className="flex flex-wrap gap-2 border-b border-brand-border p-3 sm:p-4">
      <div className="flex min-w-0 basis-full items-center gap-2 rounded-xl border border-brand-border bg-ivory/50 px-3 sm:flex-1 sm:basis-auto">
        <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-copper" aria-hidden="true" />
        <input type="search" value={query} maxLength={100} onChange={event => { setQuery(event.target.value); chooseDistrict(''); }} aria-label={t('electoral.search')} placeholder={t('electoral.search')} className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </div>
      <label className="sr-only" htmlFor="home-electoral-district">{t('electoral.district')}</label>
      <select id="home-electoral-district" value={districtId} onChange={event => chooseDistrict(event.target.value)} className="min-h-11 min-w-0 max-w-full rounded-xl border border-brand-border bg-white px-3 text-sm sm:max-w-64">
        <option value="">{t('electoral.allDistricts')}</option>
        {districts.map(district => <option key={district.id} value={district.id}>{district.name}</option>)}
      </select>
      <button type="button" onClick={reset} className="min-h-11 rounded-xl border border-brand-border px-3 text-xs font-semibold text-charcoal">{t('wholeCountry')}</button>
    </div>
    <div className="md:grid md:h-[560px] md:grid-cols-[minmax(0,1fr)_340px]">
      <div className="relative h-[320px] min-w-0 bg-ivory md:h-full" aria-busy={loading}>
        <BaseMap center={[38.5, 23.8]} zoom={6} zoomAnimation={false} bounds={COUNTRY_BOUNDS} polygonLayers={polygons} className="h-full w-full" focusTarget={focusTarget} viewResetKey={viewResetKey} tileMode={tileMode} ariaLabel={t('electoral.mapLabel')} showResetControl showFullscreenControl controlLabels={{ reset: t('reset'), expand: t('expand'), close: t('close') }} />
        <div className="pointer-events-none absolute left-14 right-28 top-3 z-[450] flex justify-center"><span className="rounded-xl border border-brand-border bg-white/95 px-3 py-2 text-center text-[11px] font-medium text-charcoal shadow-sm">{t('electoral.hint')}</span></div>
        <div className="absolute bottom-7 left-3 z-[450] flex gap-1 rounded-lg border border-brand-border bg-white/95 p-1 shadow-sm" role="group" aria-label={t('background')}>
          {['light', 'satellite'].map(mode => <button key={mode} type="button" aria-pressed={tileMode === mode} onClick={() => onTileModeChange(mode)} className={`min-h-9 rounded-md px-3 text-xs font-semibold ${tileMode === mode ? 'bg-charcoal text-white' : 'text-gray-600'}`}>{t(mode)}</button>)}
        </div>
      </div>
      <aside className="flex min-h-0 flex-col border-t border-brand-border md:border-l md:border-t-0" aria-label={t('electoral.results')}>
        <button type="button" onClick={() => setSheetOpen(value => !value)} aria-expanded={sheetOpen} aria-controls="home-electoral-results" className="flex min-h-11 items-center justify-center gap-2 text-xs font-semibold text-gray-600 md:hidden"><span className="h-1 w-8 rounded-full bg-gray-300" />{t(sheetOpen ? 'hideResults' : 'showResults')}</button>
        <div id="home-electoral-results" className={`${sheetOpen ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col md:flex`}>
          <div className="border-b border-brand-border bg-ivory/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-copper">{t('electoral.title')}</p>
            <h3 className="mt-1 text-lg font-semibold text-charcoal">{selectedDistrict?.name || t('country')}</h3>
            <p className="mt-2 text-xs text-gray-500" aria-live="polite">{peopleLoading ? t('electoral.loading') : peopleError ? t('electoral.error') : districtId ? t(countLabel, { count: visibleProfiles.length }) : t('electoral.hint')}</p>
            {districtId && <button type="button" onClick={() => chooseDistrict('')} className="mt-2 min-h-10 text-xs font-semibold text-copper">← {t('electoral.allDistricts')}</button>}
          </div>
          <div ref={results} className="max-h-72 min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 md:max-h-none" aria-busy={loading}>
            {peopleLoading ? <p role="status" className="flex items-center gap-2 p-2 text-xs text-gray-500"><ArrowPathIcon className="h-4 w-4 animate-spin" />{t('electoral.loading')}</p> : peopleError ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{t('electoral.error')} <button type="button" onClick={() => { setRetry(value => value + 1); setCandidateRetry(value => value + 1); }} className="underline">{t('retry')}</button></p> : districtId ? <>
              {districtId === 'district-state' && <p className="mb-3 text-xs text-gray-500">{t('electoral.stateHint')}</p>}
              {districtId === 'unassigned' && <p className="mb-3 text-xs text-gray-500">{t('electoral.unassignedHint')}</p>}
              {visibleProfiles.length ? <ul className="space-y-2">{visibleProfiles.map(person => {
                const name = personName(person);
                const affiliation = (person.politicalAffiliations || []).find(item => item.organization);
                return <li key={person.id}><Link href={person.href || `/persons/${person.slug}`} className="flex gap-3 rounded-xl border border-brand-border p-3 hover:border-copper hover:bg-ivory/50">
                  {person.photo || person.avatar ? <Image src={person.photo || person.avatar} alt="" width={44} height={44} unoptimized className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ivory font-semibold text-copper" aria-hidden="true">{name?.slice(0, 1)}</span>}
                  <span className="min-w-0"><span className="block break-words text-sm font-semibold text-charcoal">{name}</span><span className="mt-1 block text-xs text-gray-500">{candidateMode ? person.campaign.isIndependent ? t('electoral.independent') : person.campaign.partyName || t('electoral.noParty') : affiliation?.organization?.name || t('electoral.independent')}</span>
                    {candidateMode && <><span className="mt-2 block text-[10px] font-semibold text-copper">{!person.campaign.electionCycle || person.campaign.electionCycle === 'current' ? t('electoral.unspecifiedCycle') : person.campaign.electionCycle}</span>
                      {person.campaign.slogan && <span className="mt-2 block text-xs text-charcoal">{person.campaign.slogan}</span>}
                      {person.campaign.platform && <span className="mt-1 line-clamp-3 block text-xs text-gray-500">{person.campaign.platform}</span>}</>}
                  </span>
                </Link>{candidateMode && <ConsultationCommitment registration={person.campaign} compact />}</li>;
              })}</ul> : <p className="p-3 text-sm text-gray-500">{t(candidateMode ? 'electoral.emptyCandidates' : 'electoral.empty')}</p>}
            </> : matchingDistricts.length ? <ul className="space-y-2" aria-label={t('electoral.allDistricts')}>
              {matchingDistricts.map(district => <li key={district.id}><button type="button" onClick={() => chooseDistrict(district.id)} onMouseEnter={() => highlight(district.id)} onMouseLeave={() => unhighlight(district.id)} onFocus={() => highlight(district.id)} onBlur={() => unhighlight(district.id)} className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm ${hoveredId === district.id ? 'border-copper bg-ivory' : 'border-brand-border hover:bg-ivory/60'}`}>
                <span className="min-w-0 break-words font-semibold text-charcoal">{district.name}</span><span className="shrink-0 rounded-full bg-ivory px-2 py-1 text-[10px] font-semibold text-copper">{t(countLabel, { count: districtCounts[district.id] || 0 })}</span>
              </button></li>)}
            </ul> : <p className="p-3 text-sm text-gray-500">{t('noAreas')}</p>}
          </div>
        </div>
      </aside>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border bg-ivory/30 px-4 py-3 text-[10px] text-gray-500">
      <Link href="/citizen-help/regions-electoral-map" className="hover:underline">{t('electoral.boundaries')}</Link>
      <Link href="/parliamentarians" className="font-semibold text-copper hover:underline">{t('electoral.directory')} →</Link>
    </div>
  </>;
}
