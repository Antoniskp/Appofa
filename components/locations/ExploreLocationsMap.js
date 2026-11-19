'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { MapPinIcon, VideoCameraIcon, HandRaisedIcon, ArrowPathIcon, BuildingLibraryIcon, NewspaperIcon, SignalIcon } from '@heroicons/react/24/outline';
import { locationAPI } from '@/lib/api/locations';
import { hasMapPoint, mapGeometryBounds, normalizeMapBoundary } from '@/lib/map-utils';
import { MAP_LAYERS, mapLayerHref } from '@/lib/map-layers';
import HomeElectoralMap from './HomeElectoralMap';
import { MapExplorerLayout, MapExplorerLoading, MapExplorerToolbar } from './MapExplorerLayout';

const Canvas = dynamic(() => import('./HomeMapCanvas'), { ssr: false, loading: MapExplorerLoading });
const EMPTY = [];
const LAYERS = ['issues', 'polls', 'cameras', 'news', 'live'];
const ICONS = { issues: MapPinIcon, polls: HandRaisedIcon, cameras: VideoCameraIcon, parliamentarians: BuildingLibraryIcon, news: NewspaperIcon, live: SignalIcon };

export default function ExploreLocationsMap({ prefectures = EMPTY, homeLocationId, className, loading: initialLoading = false,
  initialLayer = 'issues', activeLayer, onLayerChange, showLayerControls = true, initialDistrictId = '', showMapLink = false }) {
  const t = useTranslations('homeMap');
  const element = useRef(null), results = useRef(null), lastFocused = useRef(undefined);
  const [enabled, setEnabled] = useState(false);
  const [rootId, setRootId] = useState(null);
  const [localLayer, setLayer] = useState(initialLayer);
  const layer = activeLayer || localLayer;
  const [districtId, setDistrictId] = useState(initialDistrictId);
  const [tileMode, setTileMode] = useState('light');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState({ query: '', locations: EMPTY, loading: false, error: false });
  const [viewport, setViewport] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [viewResetKey, setViewResetKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(true);
  const detail = Boolean(bounds && bounds.north - bounds.south < 1.5);
  const requestKey = JSON.stringify([rootId, layer, detail ? bounds : null, retry]);
  const current = data?.scope === rootId ? data : null;
  const items = data?.key === requestKey ? data.items : EMPTY;
  const areas = current?.areas || (rootId ? EMPTY : prefectures);
  const selected = items.find(item => item.id === selectedId);

  useEffect(() => {
    if (!element.current || typeof IntersectionObserver === 'undefined') { setEnabled(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setEnabled(true); observer.disconnect(); }
    }, { rootMargin: '300px' });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { setBounds(viewport); setPage(1); }, 350);
    return () => clearTimeout(timer);
  }, [viewport]);
  useEffect(() => {
    if (!enabled || layer === 'parliamentarians') return;
    const [scope, kind, viewBounds] = JSON.parse(requestKey);
    let cancelled = false;
    setLoading(true); setError(false);
    locationAPI.getMapActivity({ locationId: scope || undefined, layer: kind, detail: String(Boolean(viewBounds)),
      ...(viewBounds || {}), page }).then(response => {
      if (!response.success) throw new Error('Map unavailable');
      if (cancelled) return;
      setData(previous => ({ ...response, scope, key: requestKey,
        items: page > 1 && previous?.key === requestKey
          ? [...new Map([...previous.items, ...response.items].map(item => [item.id, item])).values()] : response.items }));
      if (lastFocused.current !== scope) {
        lastFocused.current = scope;
        if (scope && response.location) {
          const area = response.location;
          const areaBounds = mapGeometryBounds(normalizeMapBoundary(area.boundary_geojson)) || area.bounding_box;
          setFocusTarget(areaBounds ? { bounds: areaBounds } : hasMapPoint(area) ? { lat: Number(area.lat), lng: Number(area.lng), zoom: area.type === 'municipality' ? 12 : 9 } : null);
        }
      }
    }).catch(() => { if (!cancelled) setError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [enabled, layer, page, requestKey]);
  const isPolitical = layer === 'parliamentarians';
  useEffect(() => {
    if (isPolitical || !searchOpen) return;
    const term = query.trim();
    if (term.length < 2) { setSearch({ query: term, locations: EMPTY, loading: false, error: false }); return; }
    let cancelled = false;
    setSearch({ query: term, locations: EMPTY, loading: true, error: false });
    const timer = setTimeout(() => {
      locationAPI.getMapActivity({ search: term }).then(response => {
        if (!response.success) throw new Error('Search unavailable');
        if (!cancelled) setSearch({ query: term, locations: response.locations || EMPTY, loading: false, error: false });
      }).catch(() => { if (!cancelled) setSearch({ query: term, locations: EMPTY, loading: false, error: true }); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, retry, isPolitical, searchOpen]);

  const chooseArea = useCallback(id => {
    setRootId(Number(id)); setPage(1); setSelectedId(null); setQuery(''); setSearchOpen(false); setSheetOpen(true);
    if (results.current) results.current.scrollTop = 0;
  }, []);
  const selectMarker = useCallback(id => {
    if (id.startsWith('area-')) chooseArea(id.slice(5));
    else { setSelectedId(id); setSheetOpen(true); }
  }, [chooseArea]);
  useEffect(() => {
    const panel = results.current;
    const card = panel && Array.from(panel.querySelectorAll('[data-home-map-item]')).find(node => node.dataset.homeMapItem === selectedId);
    if (card) panel.scrollTop += card.getBoundingClientRect().top - panel.getBoundingClientRect().top - 12;
  }, [selectedId]);
  const reset = () => {
    setRootId(null); setPage(1); setSelectedId(null); setFocusTarget(null); setQuery(''); setSearchOpen(false);
    lastFocused.current = null; setViewResetKey(value => value + 1);
    if (results.current) results.current.scrollTop = 0;
  };
  const mapAreas = useMemo(() => areas.map(area => ({ ...area,
    boundary_geojson: area.boundary_geojson || prefectures.find(pref => pref.id === area.id)?.boundary_geojson,
  })), [areas, prefectures]);
  const areaName = current?.location?.name_local || current?.location?.name || t('country');
  const areaHref = current?.location ? `/locations/${current.location.slug || current.location.id}` : '/locations';
  const showSearch = searchOpen && query.trim().length >= 2;
  const changeLayer = kind => {
    if (kind === layer) return;
    setLayer(kind);
    onLayerChange?.(kind, districtId);
    setPage(1);
    setSelectedId(null);
    setHoveredId(null);
    setSearchOpen(false);
    if (results.current) results.current.scrollTop = 0;
  };
  const areaList = <ul className="space-y-2" aria-label={t('areas')}>
    {areas.map(area => <li key={area.id}><button type="button" onClick={() => chooseArea(area.id)} onMouseEnter={() => setHoveredId(`area-${area.id}`)} onMouseLeave={() => setHoveredId(null)} onFocus={() => setHoveredId(`area-${area.id}`)} onBlur={() => setHoveredId(null)} className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm ${hoveredId === `area-${area.id}` ? 'border-copper bg-ivory' : 'border-brand-border hover:bg-ivory/60'}`}>
      <span className="min-w-0 break-words font-semibold text-charcoal">{area.name_local || area.name}</span>
      <span className="shrink-0 rounded-full bg-ivory px-2.5 py-1 text-xs font-semibold text-copper" aria-label={area.totals ? t('areaCount', { count: area.totals[layer], kind: t(layer) }) : t('loading')}>{area.totals ? area.totals[layer] : '…'}</span>
    </button></li>)}
  </ul>;

  return <div ref={element} className={`home-map overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm ${className || ''}`}>
    {showLayerControls && <div className="grid auto-rows-fr grid-cols-3 gap-2 border-b border-brand-border p-3 sm:px-4 lg:grid-cols-6" role="group" aria-label={t('layers')}>
      {MAP_LAYERS.map(kind => {
        const Icon = ICONS[kind];
        return <button key={kind} type="button" aria-pressed={layer === kind} onClick={() => changeLayer(kind)}
          className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-xs font-semibold sm:flex-row sm:gap-2 ${layer === kind ? 'bg-charcoal text-white' : 'bg-ivory text-gray-600 hover:text-copper'}`}>
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{t(kind === 'parliamentarians' ? 'political' : kind)}
        </button>;
      })}
    </div>}
    {isPolitical ? <HomeElectoralMap enabled={enabled} tileMode={tileMode} onTileModeChange={setTileMode} initialDistrictId={districtId}
      onDistrictChange={setDistrictId} sheetOpen={sheetOpen} setSheetOpen={setSheetOpen} /> : <>
      <MapExplorerToolbar label={t('search')} clearLabel={t('clearSearch')} query={query} onQueryChange={value => { setQuery(value); setSearchOpen(true); }}
        onSearchFocus={() => setSearchOpen(true)} onDismiss={() => setSearchOpen(false)} onReset={reset}
        searchResultsId={showSearch ? 'home-map-search-results' : undefined}>
      {showSearch && <div id="home-map-search-results" className="absolute inset-x-0 top-full mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-brand-border bg-white p-2 shadow-lg" aria-live="polite">
        {search.loading || search.query !== query.trim() ? <p className="p-3 text-sm text-gray-500">{t('searching')}</p> : search.error ? <p role="alert" className="p-3 text-sm text-red-700">{t('searchError')} <button type="button" onClick={() => setRetry(value => value + 1)} className="underline">{t('retry')}</button></p> : search.locations.length ? <ul>{search.locations.map(area => <li key={area.id}><button type="button" onClick={() => chooseArea(area.id)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-ivory"><span className="font-semibold">{area.name_local || area.name}</span><span className="text-xs text-gray-500">{t(`types.${area.type}`)}</span></button></li>)}</ul> : <p className="p-3 text-sm text-gray-500">{t('noAreas')}</p>}
      </div>}
      </MapExplorerToolbar>
      <MapExplorerLayout
        map={enabled ? <Canvas areas={mapAreas} items={items} location={current?.location} layer={layer} detail={detail} loading={loading || !current} selectedId={selected?.id} hoveredId={hoveredId} onMarkerClick={selectMarker} onHover={setHoveredId} onViewportChange={setViewport} focusTarget={focusTarget} viewResetKey={viewResetKey} tileMode={tileMode} label={t('mapLabel', { name: areaName })} controlLabels={{ reset: t('reset'), expand: t('expand'), close: t('close') }} /> : <MapExplorerLoading />}
        hint={t(detail ? 'pinHint' : 'zoomHint')} tileMode={tileMode} onTileModeChange={setTileMode}
        resultsLabel={t('results')} resultsRef={results} loading={loading || initialLoading} sheetOpen={sheetOpen} setSheetOpen={setSheetOpen}
        footer={<div className="flex flex-wrap items-center gap-x-3 gap-y-1" role="group" aria-label={t('legend')}>
          {detail ? <span>{t('pinLegend')}</span> : <><span className="font-semibold">{t(layer)}</span>{[['#e5e7eb', '0'], ['#e9cbb9', '1–5'], ['#bc8868', '6–20'], ['#80462f', '21+']].map(([color, label]) => <span key={label} className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-black/10" style={{ backgroundColor: color }} />{label}</span>)}</>}
        </div>}>
          <div className="border-b border-brand-border bg-ivory/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-copper">{t('areaPreview')}</p>
            <h3 className="mt-1 text-lg font-semibold text-charcoal">{areaName}</h3>
            <div className="my-3 grid grid-cols-3 gap-2" aria-busy={loading}>
              {LAYERS.map(kind => <div key={kind} className={`rounded-lg border px-2 py-2 ${layer === kind ? 'border-copper bg-ivory' : 'border-brand-border bg-white'}`}><span className="block text-lg font-semibold tabular-nums text-charcoal">{current ? current.totals[kind] ?? 0 : '…'}</span><span className="text-[10px] text-gray-600">{t(kind)}</span></div>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={areaHref} className="inline-flex min-h-11 items-center rounded-lg bg-copper px-3 text-xs font-semibold text-white hover:bg-brand-hover">{t('exploreArea')} →</Link>
              {homeLocationId && <button type="button" onClick={() => chooseArea(homeLocationId)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-copper/30 px-3 text-xs font-semibold text-copper"><MapPinIcon className="h-4 w-4" aria-hidden="true" />{t('myArea')}</button>}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-600">{t('scopeHint')}</p>
          </div>
          <div className="p-3">
            {loading && <p role="status" className="flex items-center gap-2 p-2 text-xs text-gray-500"><ArrowPathIcon className="h-4 w-4 animate-spin" />{t('loading')}</p>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{t('error')} <button type="button" onClick={() => setRetry(value => value + 1)} className="underline">{t('retry')}</button></p>}
            {!loading && !error && !current?.location && <p className="p-3 text-sm text-gray-500">{t('unavailable')}</p>}
            {detail ? <>
              {!loading && !error && <p className="mb-3 px-1 text-[11px] text-gray-500" aria-live="polite">{t('visibleCount', { count: data?.key === requestKey ? data.pagination.total : 0 })}</p>}
              {!loading && !error && !items.length && <p className="py-4 text-sm text-gray-500">{t('empty')}</p>}
              {items.map(item => { const Icon = ICONS[item.kind]; const active = selectedId === item.id || hoveredId === item.id; return <article key={item.id} data-home-map-item={item.id} className={`mb-3 overflow-hidden rounded-xl border ${active ? 'border-copper bg-ivory/50' : 'border-brand-border'}`}>
                <button type="button" aria-pressed={selectedId === item.id} onClick={() => setSelectedId(item.id)} onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)} onFocus={() => setHoveredId(item.id)} onBlur={() => setHoveredId(null)} className="block w-full p-3 text-left">
                  <Icon className={`mb-2 h-5 w-5 ${item.kind === 'cameras' ? 'text-teal-700' : item.kind === 'polls' ? 'text-violet-700' : 'text-copper'}`} aria-hidden="true" />
                  <h4 className="break-words text-sm font-semibold text-charcoal">{item.title}</h4>
                  <p className="mt-1 text-xs text-gray-500">{item.location?.name_local || item.location?.name}</p>
                  {item.approximate && <p className="mt-2 text-[10px] text-gray-500">{t('areaPin')}</p>}
                  {item.kind === 'cameras' && <p className={`mt-2 text-[10px] font-semibold ${item.isWorking ? 'text-teal-700' : 'text-gray-500'}`}>{t(item.isWorking ? 'working' : 'offline')}</p>}
                </button>
                <div className="flex items-center justify-between gap-2 border-t border-brand-border px-3 py-2">
                  <a href={item.href} {...(['cameras', 'live'].includes(item.kind) ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="py-1 text-xs font-semibold text-copper hover:underline" aria-label={t('openNamed', { title: item.title })}>{t(`open.${item.kind}`)} {['cameras', 'live'].includes(item.kind) ? '↗' : '→'}</a>
                  <button type="button" onClick={() => { setSelectedId(item.id); setFocusTarget({ lat: Number(item.lat), lng: Number(item.lng), zoom: 15 }); }} className="min-h-9 text-xs text-gray-600 hover:text-copper">{t('showOnMap')}</button>
                </div>
              </article>; })}
              {data?.key === requestKey && page < data.pagination.totalPages && <button type="button" disabled={loading} onClick={() => setPage(value => value + 1)} className="min-h-11 w-full rounded-lg border border-brand-border text-xs font-semibold text-copper disabled:opacity-40">{t('loadMore')}</button>}
              {areas.length > 0 && <details className="mt-3"><summary className="min-h-10 cursor-pointer text-xs font-semibold text-copper">{t('areas')}</summary>{areaList}</details>}
            </> : areaList}
          </div>
      </MapExplorerLayout>
    </>}
    {showMapLink && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border bg-ivory/40 px-4 py-4">
      <span className="text-xs text-gray-500">{t('widgetHint')}</span>
      <Link href={mapLayerHref(layer, districtId)} className="inline-flex min-h-11 items-center rounded-xl bg-charcoal px-4 text-sm font-semibold text-white hover:bg-copper">{t('openMap')} →</Link>
    </div>}
  </div>;
}
