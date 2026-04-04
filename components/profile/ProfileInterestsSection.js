'use client';

import { useMemo } from 'react';
import interestsData from '@/src/data/interests.json';

function resolveInterestLabel(entry) {
  const cat = interestsData.categories.find(c => c.id === entry.categoryId);
  if (!cat) return entry.categoryId;
  const interest = cat.interests.find(i => i.id === entry.interestId);
  if (!interest) return `${cat.label} › ${entry.interestId}`;
  if (entry.subInterestId) {
    const sub = interest.subInterests.find(s => s.id === entry.subInterestId);
    return `${cat.label} › ${interest.label}${sub ? ` › ${sub.label}` : ''}`;
  }
  return `${cat.label} › ${interest.label}`;
}

/**
 * Interests section: displays current interests and lets the user add/remove them.
 *
 * @param {Object} props
 * @param {Array} props.interests
 * @param {Object} props.picker - { categoryId, interestId, subInterestId }
 * @param {Function} props.onPickerChange
 * @param {Function} props.onAdd
 * @param {Function} props.onRemove
 */
export default function ProfileInterestsSection({ interests, picker, onPickerChange, onAdd, onRemove }) {
  const subInterests = useMemo(() => {
    if (!picker.categoryId || !picker.interestId) return [];
    const cat = interestsData.categories.find(c => c.id === picker.categoryId);
    const interest = cat?.interests.find(i => i.id === picker.interestId);
    return interest?.subInterests || [];
  }, [picker.categoryId, picker.interestId]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(interests || []).map((entry, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            {resolveInterestLabel(entry)}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="ml-1 text-green-600 hover:text-green-900 font-bold leading-none"
              aria-label="Remove interest"
            >✕</button>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select
          value={picker.categoryId}
          onChange={(e) => onPickerChange({ categoryId: e.target.value, interestId: '', subInterestId: '' })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— Category —</option>
          {interestsData.categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        <select
          value={picker.interestId}
          onChange={(e) => onPickerChange({ ...picker, interestId: e.target.value, subInterestId: '' })}
          disabled={!picker.categoryId}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">— Interest —</option>
          {picker.categoryId && (interestsData.categories.find(c => c.id === picker.categoryId)?.interests || []).map((i) => (
            <option key={i.id} value={i.id}>{i.label}</option>
          ))}
        </select>
        <select
          value={picker.subInterestId}
          onChange={(e) => onPickerChange({ ...picker, subInterestId: e.target.value })}
          disabled={!picker.interestId || !subInterests.length}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">— Sub-interest (optional) —</option>
          {subInterests.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <button
          type="button"
          disabled={(interests || []).length >= 10 || !picker.categoryId || !picker.interestId}
          onClick={onAdd}
          className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  );
}
