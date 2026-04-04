'use client';

import { EXPERTISE_AREAS } from '@/lib/constants/expertiseAreas';

/**
 * Expertise Area section: lets the user select up to 5 expertise areas.
 *
 * @param {Object} props
 * @param {Array} props.expertiseArea - currently selected areas
 * @param {Function} props.onAdd - (area: string) => void
 * @param {Function} props.onRemove - (area: string) => void
 */
export default function ProfileExpertiseSection({ expertiseArea, onAdd, onRemove }) {
  const selected = expertiseArea || [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selected.map((area) => (
          <span key={area} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            {area}
            <button
              type="button"
              onClick={() => onRemove(area)}
              className="ml-1 text-purple-600 hover:text-purple-900 font-bold leading-none"
              aria-label={`Remove ${area}`}
            >✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {EXPERTISE_AREAS.filter((area) => !selected.includes(area)).map((area) => (
          <button
            key={area}
            type="button"
            disabled={selected.length >= 5}
            onClick={() => onAdd(area)}
            className="inline-flex items-center px-3 py-1 rounded-full border border-purple-300 text-xs text-purple-700 hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + {area}
          </button>
        ))}
      </div>
    </div>
  );
}
