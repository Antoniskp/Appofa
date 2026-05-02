'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { EXPERTISE_TAG_GROUPS, getExpertiseTagLabel } from '@/lib/utils/professionTaxonomy';

/**
 * Expertise Area section: lets the user select up to 5 expertise tags.
 * Uses tag IDs internally; shows human-readable labels in the UI.
 * Tags are grouped by domain and displayed in a collapsible accordion.
 * Categories that contain selected tags are auto-expanded.
 *
 * @param {Object} props
 * @param {string[]} props.expertiseArea - currently selected tag IDs
 * @param {Function} props.onAdd - (tagId: string) => void
 * @param {Function} props.onRemove - (tagId: string) => void
 */
export default function ProfileExpertiseSection({ expertiseArea, onAdd, onRemove }) {
  const t = useTranslations('profile');
  const selected = expertiseArea || [];
  const atMax = selected.length >= 5;

  // Track which groups are manually opened
  const [openGroups, setOpenGroups] = useState(new Set());

  // Auto-open groups that contain selected tags whenever selection changes
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      for (const { domain, tags } of EXPERTISE_TAG_GROUPS) {
        if (tags.some((tag) => selected.includes(tag.id))) {
          next.add(domain.id);
        }
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.join(',')]);

  const toggleGroup = (domainId) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selected.length > 0 && (
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
      )}

      {/* Grouped accordion (hidden when at max) */}
      {!atMax && (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden">
          {EXPERTISE_TAG_GROUPS.map(({ domain, tags }) => {
            const isOpen = openGroups.has(domain.id);
            const selectedInGroup = tags.filter((tag) => selected.includes(tag.id)).length;
            const availableTags = tags.filter((tag) => !selected.includes(tag.id));

            return (
              <div key={domain.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(domain.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</span>
                    {domain.label}
                  </span>
                  {selectedInGroup > 0 && (
                    <span className="text-xs text-purple-600 font-semibold ml-2">{selectedInGroup} ✓</span>
                  )}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5 bg-gray-50">
                    {availableTags.length > 0 ? (
                      availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => onAdd(tag.id)}
                          className="inline-flex items-center px-2.5 py-1 rounded-full border border-purple-300 text-xs text-purple-700 hover:bg-purple-50 transition"
                        >
                          + {tag.label}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 py-0.5">{t('all_selected_in_group')}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {atMax && (
        <p className="text-xs text-gray-500 italic">{t('expertise_max_reached')}</p>
      )}
    </div>
  );
}
