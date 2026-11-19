'use client';

import { useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';

export function MapExplorerToolbar({ label, placeholder = label, clearLabel, query, onQueryChange, onReset,
  searchResultsId, onSearchFocus, onDismiss, children }) {
  const t = useTranslations('homeMap');
  const input = useRef(null);

  return <div className="relative z-[600] grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-b border-brand-border p-3 sm:px-4">
    <div className="relative min-w-0" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) onDismiss?.();
    }} onKeyDown={event => {
      if (event.key === 'Escape' && searchResultsId) {
        event.preventDefault();
        input.current?.focus();
        onDismiss?.();
      }
    }}>
      <div className="flex items-center gap-2 rounded-xl border border-brand-border bg-ivory/50 px-3 focus-within:border-copper focus-within:ring-1 focus-within:ring-copper">
        <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-copper" aria-hidden="true" />
        <input ref={input} type="search" value={query} maxLength={100} onFocus={onSearchFocus} onChange={event => onQueryChange(event.target.value)}
          aria-label={label} aria-controls={searchResultsId} placeholder={placeholder}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none [&::-webkit-search-cancel-button]:hidden" />
        {query && <button type="button" onClick={() => {
          onQueryChange('');
          input.current?.focus();
        }} aria-label={clearLabel} className="-mr-3 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-gray-600 hover:text-copper">
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>}
      </div>
      {children}
    </div>
    <button type="button" onClick={onReset} className="min-h-11 rounded-xl border border-brand-border px-3 text-xs font-semibold text-charcoal hover:bg-ivory">
      {t('wholeCountry')}
    </button>
  </div>;
}

export function MapExplorerLoading() {
  const t = useTranslations('homeMap');
  return <div role="status" className="flex h-full items-center justify-center text-sm text-gray-600">{t('mapLoading')}</div>;
}

export function MapExplorerLayout({ map, hint, tileMode, onTileModeChange, resultsLabel, resultsRef, loading,
  sheetOpen, setSheetOpen, footer, children }) {
  const t = useTranslations('homeMap');

  return <>
    <div className="md:grid md:h-[560px] md:grid-cols-[minmax(0,1fr)_340px]">
      <div className="relative h-[320px] min-w-0 bg-ivory md:h-full">
        {map}
        <div className="pointer-events-none absolute left-14 right-28 top-3 z-[450] flex justify-center">
          <span className="rounded-xl border border-brand-border bg-white/95 px-3 py-2 text-center text-[11px] font-medium text-charcoal shadow-sm">{hint}</span>
        </div>
        <div className="absolute bottom-7 left-3 z-[450] flex gap-1 rounded-lg border border-brand-border bg-white/95 p-1 shadow-sm" role="group" aria-label={t('background')}>
          {['light', 'satellite'].map(mode => <button key={mode} type="button" aria-pressed={tileMode === mode} onClick={() => onTileModeChange(mode)}
            className={`min-h-9 rounded-md px-3 text-xs font-semibold ${tileMode === mode ? 'bg-charcoal text-white' : 'text-gray-600 hover:bg-ivory'}`}>{t(mode)}</button>)}
        </div>
      </div>
      <aside className="flex min-h-0 min-w-0 flex-col border-t border-brand-border md:border-l md:border-t-0" aria-label={resultsLabel}>
        <button type="button" onClick={() => setSheetOpen?.(!sheetOpen)} aria-expanded={sheetOpen} aria-controls="home-map-results"
          className="flex min-h-11 items-center justify-center gap-2 text-xs font-semibold text-gray-600 md:hidden">
          <span className="h-1 w-8 rounded-full bg-gray-300" aria-hidden="true" />{t(sheetOpen ? 'hideResults' : 'showResults')}
        </button>
        <div id="home-map-results" ref={resultsRef} className={`${sheetOpen ? 'block' : 'hidden'} h-80 overflow-y-auto overscroll-contain md:block md:h-full`} aria-busy={loading}>
          {children}
        </div>
      </aside>
    </div>
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-brand-border bg-ivory/30 px-4 py-2 text-xs text-gray-600">
      {footer}
    </div>
  </>;
}
