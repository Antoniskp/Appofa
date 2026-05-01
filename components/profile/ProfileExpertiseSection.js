'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { EXPERTISE_TAGS, getExpertiseTagLabel } from '@/lib/utils/professionTaxonomy';

/**
 * Expertise Area section: lets the user select up to 5 expertise tags.
 * Uses tag IDs internally; shows human-readable labels in the UI.
 * Includes a search input to filter the full tag list.
 *
 * @param {Object} props
 * @param {string[]} props.expertiseArea - currently selected tag IDs
 * @param {Function} props.onAdd - (tagId: string) => void
 * @param {Function} props.onRemove - (tagId: string) => void
 */
export default function ProfileExpertiseSection({ expertiseArea, onAdd, onRemove }) {
  const t = useTranslations('profile');
  const [search, setSearch] = useState('');

  const selected = expertiseArea || [];
  const atMax = selected.length >= 5;

  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EXPERTISE_TAGS.filter(
      (tag) => !selected.includes(tag.id) && (!q || tag.label.toLowerCase().includes(q))
    );
  }, [search, selected]);

  return (
    <div className="space-y-3">
      {/* Selected tags */}
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

      {/* Search input */}
      {!atMax && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search_expertise_placeholder')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}

      {/* Filtered tag buttons */}
      {!atMax && (
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {filteredTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                onAdd(tag.id);
                setSearch('');
              }}
              className="inline-flex items-center px-3 py-1 rounded-full border border-purple-300 text-xs text-purple-700 hover:bg-purple-50 transition"
            >
              + {tag.label}
            </button>
          ))}
          {filteredTags.length === 0 && search.trim() && (
            <p className="text-xs text-gray-400 py-1">{/* no results */}</p>
          )}
        </div>
      )}
    </div>
  );
}
