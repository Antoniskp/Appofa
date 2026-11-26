'use client';

/**
 * Shared toolbar for list pages.
 *
 * Provides a consistent, responsive layout for pages that have a search input,
 * optional filters (FilterBar), and a primary action button.
 *
 * Layout contract:
 *   - Mobile   : search on its own row; filter toggle and action button share
 *                the row below so the list starts higher on the screen.
 *   - Desktop  : search grows to fill available width; filter toggle + action
 *                button are pinned side-by-side on the right (flex-shrink-0).
 *   - Open filters : FilterBar renders its expanded inputs *below* its toggle
 *                button (handled internally by FilterBar), so the action button
 *                always stays visible at the top-right — no horizontal reflow.
 *
 * Props:
 *   searchSlot  – ReactNode  – search input element
 *   filtersSlot – ReactNode  – FilterBar component (or null)
 *   actionsSlot – ReactNode  – primary action button(s) (or null/false)
 *   extraSlot   – ReactNode  – optional second row (CategoryPills, breadcrumbs…)
 *   className   – string     – additional classes for the outer wrapper
 */
export default function ListPageToolbar({
  searchSlot,
  filtersSlot,
  actionsSlot,
  extraSlot,
  className = '',
}) {
  const hasControls = filtersSlot || actionsSlot;

  return (
    <div className={`flex flex-col gap-3 mb-6 ${className}`}>
      {/* Primary toolbar row */}
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:flex-wrap md:items-start">
        {searchSlot && (
          <div className="flex-1 min-w-0 md:min-w-[240px]">{searchSlot}</div>
        )}
        {hasControls && (
          <div className="flex w-full min-w-0 flex-row items-start gap-2 md:w-auto md:flex-shrink-0 md:flex-wrap">
            {filtersSlot && <div className="min-w-0 flex-1 md:flex-none">{filtersSlot}</div>}
            {actionsSlot}
          </div>
        )}
      </div>

      {/* Optional extra row (CategoryPills, LocationFilterBreadcrumb, etc.) */}
      {extraSlot && <div>{extraSlot}</div>}
    </div>
  );
}
