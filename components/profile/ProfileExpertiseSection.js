'use client';

import { EXPERTISE_TAGS, getExpertiseTagLabel } from '@/lib/utils/professionTaxonomy';

/**
 * Expertise Area section: lets the user select up to 5 expertise tags.
 * Uses tag IDs internally; shows human-readable labels in the UI.
 *
 * @param {Object} props
 * @param {string[]} props.expertiseArea - currently selected tag IDs
 * @param {Function} props.onAdd - (tagId: string) => void
 * @param {Function} props.onRemove - (tagId: string) => void
 */
export default function ProfileExpertiseSection({ expertiseArea, onAdd, onRemove }) {
  const selected = expertiseArea || [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selected.map((tagId) => (
          <span key={tagId} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            {getExpertiseTagLabel(tagId)}
            <button
              type="button"
              onClick={() => onRemove(tagId)}
              className="ml-1 text-purple-600 hover:text-purple-900 font-bold leading-none"
              aria-label={`Remove ${getExpertiseTagLabel(tagId)}`}
            >&#x2715;</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {EXPERTISE_TAGS.filter((tag) => !selected.includes(tag.id)).map((tag) => (
          <button
            key={tag.id}
            type="button"
            disabled={selected.length >= 5}
            onClick={() => onAdd(tag.id)}
            className="inline-flex items-center px-3 py-1 rounded-full border border-purple-300 text-xs text-purple-700 hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
