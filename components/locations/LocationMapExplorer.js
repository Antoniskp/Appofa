'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowPathIcon, ArrowsPointingOutIcon, ChevronRightIcon, MagnifyingGlassIcon, MapPinIcon, PlusIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LocationMap from './LocationMap';
import { geoAPI, locationSectionAPI, suggestionAPI } from '@/lib/api';
import { MAP_ISSUE_TYPES, MAP_ISSUE_TYPE_COLORS } from '@/lib/constants/mapIssues';
import { MAP_ISSUE_ICON_PATHS } from '@/lib/map-marker-icons';
import { hasMapPoint, normalizeMapBoundary, normalizeMapSearch, mapGeometryBounds, pointInMapBounds } from '@/lib/map-utils';

const EMPTY = [];
const STATUS_CLASSES = {
  open: 'bg-amber-50 text-amber-800', under_review: 'bg-blue-50 text-blue-800',
  implemented: 'bg-emerald-50 text-emerald-800', rejected: 'bg-gray-100 text-gray-600',
};

function IssueIcon({ type }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5"><path d={MAP_ISSUE_ICON_PATHS[type] || MAP_ISSUE_ICON_PATHS.other} /></svg>;
}

function safeCameraUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch { return null; }
}

export default function LocationMapExplorer({ location, childLocations = EMPTY, breadcrumb = EMPTY, summaryCounts,
  pendingIssuePin, reporting = false, onReportingChange, onMapClick, reportForm, isAuthenticated, refreshKey = 0 }) {
  const t = useTranslations('mapExplorer');
  const cameraText = useTranslations('cameras');
  const locale = useLocale();
  const [filters, setFilters] = useState({ search: '', issueType: '', status: '', days: '', bounds: null });
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [data, setData] = useState({ key: '', issues: EMPTY, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [cameraData, setCameraData] = useState({ locationId: null, cameras: EMPTY, loading: true, error: false });
  const [cameraRetryKey, setCameraRetryKey] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [viewport, setViewport] = useState(null);
  const [searchedViewport, setSearchedViewport] = useState(null);
  const [viewResetKey, setViewResetKey] = useState(0);
  const [tileMode, setTileMode] = useState('light');
  const [activePanel, setActivePanel] = useState('issues');
  const [expanded, setExpanded] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(248);
  const [addressState, setAddressState] = useState({ results: null, loading: false, error: false });
  const markerControls = useRef(null);
  const areaControls = useRef(null);
  const resultsPanel = useRef(null);
  const explorerElement = useRef(null);
  const selectedMarker = useRef(null);
  const sheetDrag = useRef(null);
  const expandButton = useRef(null);
  const addressRequest = useRef(0);
  const queryKey = JSON.stringify([location.id, filters, refreshKey]);
  const issues = data.key === queryKey ? data.issues : EMPTY;
  const issueLabels = useMemo(() => Object.fromEntries(MAP_ISSUE_TYPES.map(type => [type.value, t(`types.${type.value}`)])), [t]);
  const selectedIssue = issues.find(issue => String(issue.id) === String(selectedId));
  const selectedChild = childLocations.find(child => String(child.id) === String(selectedChildId));
  const matchingChildren = useMemo(() => childLocations.filter(child => normalizeMapSearch(`${child.name} ${child.name_local || ''}`).includes(normalizeMapSearch(filters.search))), [childLocations, filters.search]);
  const cameras = cameraData.locationId === location.id ? cameraData.cameras : EMPTY;
  const camerasLoading = cameraData.locationId !== location.id || cameraData.loading;
  const matchingCameras = useMemo(() => cameras.filter(camera => {
    const source = camera.sourceLocation;
    const matchesSearch = normalizeMapSearch(`${camera.label} ${source?.name || ''} ${source?.name_local || ''}`).includes(normalizeMapSearch(filters.search));
    return matchesSearch && (!filters.bounds || (hasMapPoint(camera.mapLocation)
      && pointInMapBounds(camera.mapLocation.lat, camera.mapLocation.lng, filters.bounds)));
  }), [cameras, filters.search, filters.bounds]);
  const selectedCamera = matchingCameras.find(camera => String(camera.id) === String(selectedCameraId));

  const updateFilters = patch => {
    setFilters(current => ({ ...current, ...patch }));
    setPage(1);
    setSelectedId(null);
    setSelectedChildId(null);
    setSelectedCameraId(null);
    addressRequest.current += 1;
    setAddressState({ results: null, loading: false, error: false });
  };

  useEffect(() => {
    let cancelled = false;
    setCameraData({ locationId: location.id, cameras: EMPTY, loading: true, error: false });
    locationSectionAPI.getAllCameras({ locationId: location.id }).then(response => {
      if (!response?.success) throw new Error('Cameras unavailable');
      if (!cancelled) setCameraData({ locationId: location.id, cameras: response.cameras || EMPTY, loading: false, error: false });
    }).catch(() => {
      if (!cancelled) setCameraData({ locationId: location.id, cameras: EMPTY, loading: false, error: true });
    });
    return () => { cancelled = true; };
  }, [location.id, refreshKey, cameraRetryKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const response = await suggestionAPI.getMapIssues({ locationId: location.id, search: filters.search || undefined,
          issueType: filters.issueType || undefined, status: filters.status || undefined, days: filters.days || undefined,
          ...(filters.bounds || {}), page });
        if (!response?.success) throw new Error('Map unavailable');
        if (cancelled) return;
        setData(previous => ({ key: queryKey,
          issues: [...new Map([...(page > 1 && previous.key === queryKey ? previous.issues : []), ...(response.data || [])]
            .filter(issue => hasMapPoint(issue, 'mapLat', 'mapLng')).map(issue => [issue.id, issue])).values()],
          total: response.pagination?.total || 0, totalPages: response.pagination?.totalPages || 0 }));
      } catch { if (!cancelled) setError(true); }
      finally { if (!cancelled) setLoading(false); }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [location.id, filters, page, queryKey, retryKey]);

  useEffect(() => {
    selectedMarker.current = selectedIssue ? `issue-${selectedIssue.id}` : selectedChild ? `child-${selectedChild.id}` : selectedCamera ? `camera-${selectedCamera.id}` : null;
  }, [selectedIssue, selectedChild, selectedCamera]);

  useEffect(() => {
    const panel = resultsPanel.current;
    const resultId = activePanel === 'issues' ? selectedId : activePanel === 'cameras' ? selectedCameraId : selectedChildId;
    const card = panel && Array.from(panel.querySelectorAll('[data-map-result]')).find(node => node.dataset.mapResult === String(resultId));
    if (!card) return;
    // Scroll only the results panel; selecting a pin must not scroll the page.
    panel.scrollTop += card.getBoundingClientRect().top - panel.getBoundingClientRect().top - 12;
  }, [selectedId, selectedChildId, selectedCameraId, activePanel]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = event => {
      if (event.key === 'Escape') { setExpanded(false); expandButton.current?.focus(); }
      if (event.key === 'Tab') {
        const controls = Array.from(explorerElement.current.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]')).filter(node => node.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handleKey); };
  }, [expanded]);

  const highlight = useCallback(id => {
    setHoveredId(id);
    if (id) markerControls.current?.highlight(id);
    if (id) areaControls.current?.highlight(id);
  }, []);
  const unhighlight = id => {
    setHoveredId(null);
    markerControls.current?.unhighlight(id, id === selectedMarker.current ? 'selected' : 'explorer');
    areaControls.current?.unhighlight(id);
  };
  const selectMarker = useCallback(id => {
    setSheetHeight(360);
    setSelectedId(null); setSelectedChildId(null); setSelectedCameraId(null);
    if (id.startsWith('issue-')) { setSelectedId(id.slice(6)); setActivePanel('issues'); }
    if (id.startsWith('child-')) { setSelectedChildId(id.slice(6)); setActivePanel('areas'); }
    if (id.startsWith('camera-')) { setSelectedCameraId(id.slice(7)); setActivePanel('cameras'); }
  }, []);
  const markersReady = useCallback(controls => { markerControls.current = controls; }, []);
  const areasReady = useCallback(controls => { areaControls.current = controls; }, []);
  const resetView = () => {
    setFocusTarget(null); setViewResetKey(value => value + 1); setSearchedViewport(null);
    updateFilters({ bounds: null });
  };
  const searchAddress = async event => {
    event.preventDefault();
    if (filters.search.trim().length < 3) return;
    const request = ++addressRequest.current;
    setAddressState({ results: null, loading: true, error: false });
    try {
      const response = await geoAPI.searchAddress(filters.search.trim(), location.id);
      if (request !== addressRequest.current) return;
      if (!response?.success) throw new Error('Address unavailable');
      setAddressState({ results: response.data || [], loading: false, error: false });
    } catch { if (request === addressRequest.current) setAddressState({ results: null, loading: false, error: true }); }
  };
  const showArea = child => {
    const bounds = mapGeometryBounds(normalizeMapBoundary(child.boundary_geojson));
    setFocusTarget(bounds ? { bounds } : hasMapPoint(child) ? { lat: Number(child.lat), lng: Number(child.lng), zoom: 13 } : null);
  };
  const hasMoved = viewport && JSON.stringify(viewport) !== searchedViewport;
  const total = data.key === queryKey ? data.total : 0;
  const filterClass = 'min-h-10 min-w-0 rounded-lg border border-brand-border bg-white px-2.5 text-xs font-medium text-charcoal focus:ring-2 focus:ring-copper/30';

  return (
    <section ref={explorerElement} aria-label={t('title')} className={`map-explorer overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm ${expanded ? 'fixed inset-2 z-[1500] flex flex-col sm:inset-5' : ''}`}>
      <header className="border-b border-brand-border px-4 py-3 sm:px-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-copper">{t('eyebrow')}</p>
            <h2 className="text-lg font-semibold text-charcoal">{t('title')}</h2>
            <nav aria-label={t('breadcrumbs')} className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500">
              {breadcrumb.map((crumb, index) => <span key={crumb.id} className="inline-flex items-center gap-1">
                {index > 0 && <ChevronRightIcon className="h-3 w-3" aria-hidden="true" />}
                {String(crumb.id) === String(location.id) ? <span aria-current="location" className="font-medium text-charcoal">{crumb.name_local || crumb.name}</span>
                  : <Link href={`/locations/${crumb.slug || crumb.id}`} className="hover:text-copper hover:underline">{crumb.name_local || crumb.name}</Link>}
              </span>)}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={resetView} className="map-control" aria-label={t('reset')} title={t('reset')}><ArrowPathIcon className="h-4 w-4" /></button>
            <button ref={expandButton} type="button" onClick={() => setExpanded(value => !value)} className="map-control" aria-pressed={expanded} aria-label={expanded ? t('collapse') : t('expand')} title={expanded ? t('collapse') : t('expand')}><ArrowsPointingOutIcon className="h-4 w-4" /></button>
            <button type="button" onClick={() => { onReportingChange?.(!reporting); setPage(1); setSheetHeight(400); }} className="ml-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-copper px-3 text-xs font-semibold text-white hover:bg-blue-700" aria-pressed={reporting}>
              {reporting ? <XMarkIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}<span className="hidden sm:inline">{reporting ? t('cancelReport') : t('report')}</span><span className="sr-only sm:hidden">{reporting ? t('cancelReport') : t('report')}</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:flex-row">
          <form onSubmit={searchAddress} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-brand-border bg-ivory/50 pl-3">
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
            <input type="search" aria-label={t('search')} placeholder={t('search')} value={filters.search} maxLength={200} onChange={event => updateFilters({ search: event.target.value })} className="min-h-11 min-w-0 flex-1 bg-transparent text-sm text-charcoal outline-none placeholder:text-gray-400" />
            <button type="submit" disabled={addressState.loading || filters.search.trim().length < 3} className="m-1 min-h-9 shrink-0 rounded-lg bg-white px-3 text-xs font-semibold text-copper shadow-sm disabled:opacity-40">{addressState.loading ? t('searching') : t('findAddress')}</button>
          </form>
          <div className="grid grid-cols-3 gap-2 lg:w-[360px]">
            <select aria-label={t('category')} value={filters.issueType} onChange={event => updateFilters({ issueType: event.target.value })} className={filterClass}><option value="">{t('allCategories')}</option>{MAP_ISSUE_TYPES.map(type => <option key={type.value} value={type.value}>{issueLabels[type.value]}</option>)}</select>
            <select aria-label={t('status')} value={filters.status} onChange={event => updateFilters({ status: event.target.value })} className={filterClass}><option value="">{t('allStatuses')}</option>{Object.keys(STATUS_CLASSES).map(status => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}</select>
            <select aria-label={t('date')} value={filters.days} onChange={event => updateFilters({ days: event.target.value })} className={filterClass}><option value="">{t('allDates')}</option>{[7, 30, 90, 365].map(days => <option key={days} value={days}>{t('lastDays', { days })}</option>)}</select>
          </div>
        </div>
        {(addressState.results !== null || addressState.error) && <div className="mt-2 rounded-lg border border-brand-border p-2" aria-live="polite">
          {addressState.error ? <p className="text-sm text-red-700">{t('addressError')}</p> : addressState.results.length ? addressState.results.map((result, index) => <button key={index} type="button" className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-ivory" onClick={() => {
            updateFilters({ search: '', bounds: null }); setFocusTarget({ lat: result.lat, lng: result.lng, zoom: 16 }); setSearchedViewport(null);
          }}><MapPinIcon className="h-4 w-4 shrink-0 text-copper" />{result.label}</button>) : <p className="text-sm text-gray-500">{t('noAddresses')}</p>}
          <p className="px-2 pt-1 text-[10px] text-gray-400">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a></p>
        </div>}
      </header>

      <div className={`map-explorer-body relative min-h-0 ${expanded ? 'flex-1' : 'h-[640px] md:h-[580px]'}`} style={{ '--sheet-height': `${sheetHeight}px` }}>
        <div className="map-explorer-canvas absolute inset-0 md:right-[360px]">
          <LocationMap location={location} childLocations={childLocations} mapIssues={issues} mapCameras={matchingCameras} summaryCounts={summaryCounts}
            pendingIssuePin={pendingIssuePin} selectedIssueId={selectedIssue?.id} selectedChildId={selectedChild?.id}
            selectedCameraId={selectedCamera?.id}
            onMarkerHover={highlight} onMarkerClick={selectMarker} onMarkersReady={markersReady} onAreaLayersReady={areasReady}
            onViewportChange={setViewport} focusTarget={focusTarget} viewResetKey={viewResetKey} tileMode={tileMode}
            onMapClick={reporting && isAuthenticated ? onMapClick : undefined} showFullscreenControl={false}
            issueLabels={issueLabels} mapLabel={t('mapLabel', { name: location.name_local || location.name })} className={`h-full w-full ${reporting ? 'map-picking' : ''}`} />
          <div className="pointer-events-none absolute inset-x-3 top-3 z-[450] flex flex-col items-center gap-2">
            {reporting && <p role="status" className="rounded-xl border border-copper/20 bg-white/95 px-4 py-2 text-center text-sm font-medium text-copper shadow-sm">{pendingIssuePin ? t('movePin') : t('pickPoint')}</p>}
            {!reporting && hasMoved && <button type="button" onClick={() => { updateFilters({ bounds: viewport }); setSearchedViewport(JSON.stringify(viewport)); }} className="pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-border bg-white px-4 text-xs font-semibold text-charcoal shadow-md"><MagnifyingGlassIcon className="h-4 w-4" />{t('searchArea')}</button>}
            {filters.bounds && <button type="button" onClick={() => { updateFilters({ bounds: null }); setSearchedViewport(null); }} className="pointer-events-auto rounded-full bg-white/95 px-3 py-1 text-xs text-copper shadow-sm">{t('wholeArea')} ×</button>}
          </div>
          <div className="map-layer-switch absolute bottom-6 left-3 z-[450] flex rounded-lg border border-brand-border bg-white/95 p-1 shadow-sm" aria-label={t('background')}>
            {['light', 'satellite'].map(mode => <button key={mode} type="button" aria-pressed={tileMode === mode} onClick={() => setTileMode(mode)} className={`min-h-8 rounded-md px-3 text-xs font-semibold ${tileMode === mode ? 'bg-charcoal text-white' : 'text-gray-600 hover:bg-ivory'}`}>{t(mode)}</button>)}
          </div>
        </div>

        <aside className="map-results absolute inset-x-0 bottom-0 z-[500] flex flex-col border-t border-brand-border bg-white md:inset-y-0 md:left-auto md:w-[360px] md:border-l md:border-t-0" style={{ '--sheet-height': `${sheetHeight}px` }} aria-label={reporting ? t('report') : t('results')}>
          <button type="button" className="flex h-7 shrink-0 touch-none items-center justify-center md:hidden" aria-label={t('resizeResults')} aria-expanded={sheetHeight > 120}
            onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); sheetDrag.current = { y: event.clientY, height: sheetHeight, moved: false }; }}
            onPointerMove={event => { if (!sheetDrag.current) return; const delta = sheetDrag.current.y - event.clientY; if (Math.abs(delta) > 5) sheetDrag.current.moved = true; setSheetHeight(Math.max(96, Math.min(480, sheetDrag.current.height + delta))); }}
            onPointerUp={() => { if (sheetDrag.current && !sheetDrag.current.moved) setSheetHeight(value => value > 120 ? 96 : 360); sheetDrag.current = null; }}
            onPointerCancel={() => { sheetDrag.current = null; }}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSheetHeight(value => value > 120 ? 96 : 360); } }}><span className="h-1 w-10 rounded-full bg-gray-300" /></button>
          {reporting ? <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="mb-4 flex items-center justify-between gap-2"><h3 className="font-semibold text-charcoal">{t('report')}</h3><button type="button" onClick={() => onReportingChange?.(false)} aria-label={t('cancelReport')} className="map-control"><XMarkIcon className="h-4 w-4" /></button></div>
            {pendingIssuePin || !isAuthenticated ? reportForm : <div className="rounded-xl border border-dashed border-copper/30 bg-ivory p-5 text-center"><MapPinIcon className="mx-auto mb-3 h-8 w-8 text-copper" /><p className="text-sm font-medium text-charcoal">{t('pickPoint')}</p><p className="mt-2 text-xs text-gray-500">{t('reportHint')}</p></div>}
          </div> : <>
            <div className="flex shrink-0 gap-1 border-b border-brand-border px-4 pb-2 pt-3" role="tablist" aria-label={t('results')}>
              {['issues', 'cameras', 'areas'].map(panel => <button key={panel} id={`map-tab-${panel}`} role="tab" aria-selected={activePanel === panel} aria-controls={`map-panel-${panel}`} onClick={() => { setActivePanel(panel); setSheetHeight(320); }} className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${activePanel === panel ? 'bg-ivory text-copper' : 'text-gray-500 hover:bg-gray-50'}`}>{t(panel)} <span className="ml-1 text-gray-400">{panel === 'issues' ? total : panel === 'cameras' ? matchingCameras.length : matchingChildren.length}</span></button>)}
            </div>
            <div ref={resultsPanel} role="tabpanel" id={`map-panel-${activePanel}`} aria-labelledby={`map-tab-${activePanel}`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-busy={activePanel === 'cameras' ? camerasLoading : loading && activePanel === 'issues'}>
              {activePanel === 'issues' ? <>
                <div className="flex items-center justify-between gap-2 px-4 py-3 text-[11px] text-gray-500"><span aria-live="polite">{loading ? t('loading') : t('resultCount', { count: total })}</span><span>{t('newest')}</span></div>
                {error && <div role="alert" className="mx-4 mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{t('loadError')} <button type="button" onClick={() => setRetryKey(value => value + 1)} className="font-semibold underline">{t('retry')}</button></div>}
                {!loading && !error && !issues.length && <div className="px-6 py-8 text-center"><MapPinIcon className="mx-auto mb-3 h-7 w-7 text-gray-300" /><h3 className="text-sm font-semibold text-charcoal">{t('empty')}</h3><p className="mt-2 text-xs text-gray-500">{t('emptyHint')}</p><button type="button" onClick={() => { setFilters({ search: '', issueType: '', status: '', days: '', bounds: null }); setPage(1); }} className="mt-3 text-xs font-semibold text-copper underline">{t('clearFilters')}</button></div>}
                {issues.map(issue => {
                  const selected = String(issue.id) === String(selectedId);
                  const markerId = `issue-${issue.id}`;
                  const hovered = hoveredId === markerId;
                  const date = new Date(issue.createdAt);
                  return <article key={issue.id} data-map-result={issue.id} className={`mx-3 mb-3 overflow-hidden rounded-xl border transition-colors ${selected || hovered ? 'border-copper/60 bg-ivory/60' : 'border-brand-border bg-white hover:border-copper/40'}`}>
                    <button type="button" aria-pressed={selected} onClick={() => selectMarker(markerId)} onMouseEnter={() => highlight(markerId)} onMouseLeave={() => unhighlight(markerId)} onFocus={() => highlight(markerId)} onBlur={() => unhighlight(markerId)} className="block w-full p-3.5 text-left">
                      <div className="mb-2 flex items-center gap-2"><span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ color: MAP_ISSUE_TYPE_COLORS[issue.mapIssueType] || MAP_ISSUE_TYPE_COLORS.other, backgroundColor: `${MAP_ISSUE_TYPE_COLORS[issue.mapIssueType] || MAP_ISSUE_TYPE_COLORS.other}12` }}><IssueIcon type={issue.mapIssueType} /></span><span className="text-[11px] font-semibold text-gray-500">{issueLabels[issue.mapIssueType] || issueLabels.other}</span></div>
                      <h3 className="text-sm font-semibold leading-snug text-charcoal">{issue.title}</h3>
                      <p className={`mt-2 text-xs leading-relaxed text-gray-500 ${selected ? '' : 'line-clamp-2'}`}>{issue.body}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLASSES[issue.status] || STATUS_CLASSES.open}`}>{t(`statuses.${issue.status || 'open'}`)}</span>{!Number.isNaN(date.getTime()) && <time dateTime={date.toISOString()} className="text-[10px] text-gray-400">{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date)}</time>}</div>
                    </button>
                    {selected && <div className="flex items-center justify-between gap-2 border-t border-brand-border px-3.5 py-2.5"><Link href={`/suggestions/${issue.id}`} className="text-xs font-semibold text-copper hover:underline">{t('openIssue')} →</Link><button type="button" onClick={() => setFocusTarget({ lat: Number(issue.mapLat), lng: Number(issue.mapLng), zoom: 16 })} className="min-h-8 text-xs font-medium text-gray-600 hover:text-copper">{t('showOnMap')}</button></div>}
                  </article>;
                })}
                {data.key === queryKey && page < data.totalPages && <button type="button" disabled={loading || error} onClick={() => setPage(value => value + 1)} className="mx-4 mb-4 min-h-10 w-[calc(100%-2rem)] rounded-lg border border-brand-border text-xs font-semibold text-copper disabled:opacity-50">{t('loadMore', { count: total - issues.length })}</button>}
              </> : activePanel === 'cameras' ? <div className="p-3">
                {camerasLoading && <p role="status" className="px-3 py-4 text-sm text-gray-500">{t('camerasLoading')}</p>}
                {cameraData.error && !camerasLoading && <div role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{t('camerasError')} <button type="button" onClick={() => setCameraRetryKey(value => value + 1)} className="font-semibold underline">{t('retry')}</button></div>}
                {!camerasLoading && !cameraData.error && !matchingCameras.length && <p className="px-3 py-8 text-center text-sm text-gray-500">{t('noCameras')}</p>}
                {matchingCameras.map(camera => {
                  const markerId = `camera-${camera.id}`;
                  const selected = String(camera.id) === String(selectedCameraId);
                  const url = safeCameraUrl(camera.url);
                  const hasPoint = hasMapPoint(camera.mapLocation);
                  return <article key={camera.id} data-map-result={camera.id} className={`mb-3 overflow-hidden rounded-xl border ${selected || hoveredId === markerId ? 'border-copper/60 bg-ivory/60' : 'border-brand-border'}`}>
                    <button type="button" aria-pressed={selected} onClick={() => selectMarker(markerId)} onMouseEnter={() => highlight(markerId)} onMouseLeave={() => unhighlight(markerId)} onFocus={() => highlight(markerId)} onBlur={() => unhighlight(markerId)} className="block w-full p-3.5 text-left">
                      <div className="mb-2 flex items-center justify-between gap-2"><VideoCameraIcon className="h-6 w-6 text-teal-700" aria-hidden="true" /><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${camera.isWorking === false ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-800'}`}>{cameraText(camera.isWorking === false ? 'status_unavailable' : 'status_available')}</span></div>
                      <h3 className="text-sm font-semibold text-charcoal">{camera.label}</h3>
                      <p className="mt-1 text-xs text-gray-500">{camera.sourceLocation?.name_local || camera.sourceLocation?.name}</p>
                      <p className="mt-2 text-[10px] text-gray-400">{cameraText(!hasPoint ? 'map_unavailable' : camera.mapLocationSource === 'camera' ? 'pin_source_exact' : 'pin_source_source')}</p>
                    </button>
                    <div className="flex items-center justify-between gap-2 border-t border-brand-border px-3.5 py-2.5">
                      {url && <a href={url} target="_blank" rel="noopener noreferrer" aria-label={cameraText('open_camera_new_tab_aria', { label: camera.label })} className="text-xs font-semibold text-copper hover:underline">{cameraText('open_camera')} ↗</a>}
                      {hasPoint && <button type="button" onClick={() => { selectMarker(markerId); setFocusTarget({ lat: Number(camera.mapLocation.lat), lng: Number(camera.mapLocation.lng), zoom: 16 }); }} className="min-h-8 text-xs font-medium text-gray-600 hover:text-copper">{t('showOnMap')}</button>}
                    </div>
                  </article>;
                })}
              </div> : <div className="p-3">
                {!matchingChildren.length && <p className="px-3 py-8 text-center text-sm text-gray-500">{t('noAreas')}</p>}
                {matchingChildren.map(child => <article key={child.id} data-map-result={child.id} className={`mb-2 rounded-xl border p-3 ${hoveredId === `child-${child.id}` || String(selectedChildId) === String(child.id) ? 'border-copper/60 bg-ivory' : 'border-brand-border'}`}>
                  <button type="button" className="w-full text-left text-sm font-semibold text-charcoal" onClick={() => { selectMarker(`child-${child.id}`); showArea(child); }} onMouseEnter={() => highlight(`child-${child.id}`)} onMouseLeave={() => unhighlight(`child-${child.id}`)} onFocus={() => highlight(`child-${child.id}`)} onBlur={() => unhighlight(`child-${child.id}`)}>{child.name_local || child.name}</button>
                  <Link href={`/locations/${child.slug || child.id}`} className="mt-2 inline-flex min-h-8 items-center text-xs font-semibold text-copper hover:underline">{t('exploreArea')} →</Link>
                </article>)}
              </div>}
            </div>
          </>}
        </aside>
      </div>
      <footer className="hidden shrink-0 items-center justify-between gap-3 border-t border-brand-border bg-ivory/40 px-5 py-2 text-[10px] text-gray-500 md:flex"><span>{t('footerHint')}</span><span>{location.name_local || location.name}</span></footer>
    </section>
  );
}
