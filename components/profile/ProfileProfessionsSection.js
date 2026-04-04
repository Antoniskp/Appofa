'use client';

import { useMemo } from 'react';
import professionsData from '@/src/data/professions.json';

function resolveProfessionLabel(entry) {
  const cat = professionsData.categories.find(c => c.id === entry.categoryId);
  if (!cat) return entry.categoryId;
  const prof = cat.professions.find(p => p.id === entry.professionId);
  if (!prof) return `${cat.label} › ${entry.professionId}`;
  if (entry.subProfessionId) {
    const sub = prof.subProfessions.find(s => s.id === entry.subProfessionId);
    return `${cat.label} › ${prof.label}${sub ? ` › ${sub.label}` : ''}`;
  }
  return `${cat.label} › ${prof.label}`;
}

/**
 * Professions section: displays current professions and lets the user add/remove them.
 *
 * @param {Object} props
 * @param {Array} props.professions
 * @param {Object} props.picker - { categoryId, professionId, subProfessionId }
 * @param {Function} props.onPickerChange
 * @param {Function} props.onAdd
 * @param {Function} props.onRemove
 */
export default function ProfileProfessionsSection({ professions, picker, onPickerChange, onAdd, onRemove }) {
  const subProfessions = useMemo(() => {
    if (!picker.categoryId || !picker.professionId) return [];
    const cat = professionsData.categories.find(c => c.id === picker.categoryId);
    const prof = cat?.professions.find(p => p.id === picker.professionId);
    return prof?.subProfessions || [];
  }, [picker.categoryId, picker.professionId]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(professions || []).map((entry, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {resolveProfessionLabel(entry)}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="ml-1 text-blue-600 hover:text-blue-900 font-bold leading-none"
              aria-label="Remove profession"
            >✕</button>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select
          value={picker.categoryId}
          onChange={(e) => onPickerChange({ categoryId: e.target.value, professionId: '', subProfessionId: '' })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— Category —</option>
          {professionsData.categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        <select
          value={picker.professionId}
          onChange={(e) => onPickerChange({ ...picker, professionId: e.target.value, subProfessionId: '' })}
          disabled={!picker.categoryId}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">— Profession —</option>
          {picker.categoryId && (professionsData.categories.find(c => c.id === picker.categoryId)?.professions || []).map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <select
          value={picker.subProfessionId}
          onChange={(e) => onPickerChange({ ...picker, subProfessionId: e.target.value })}
          disabled={!picker.professionId || !subProfessions.length}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">— Sub-profession (optional) —</option>
          {subProfessions.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <button
          type="button"
          disabled={(professions || []).length >= 5 || !picker.categoryId || !picker.professionId}
          onClick={onAdd}
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  );
}
