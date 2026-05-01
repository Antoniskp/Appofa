'use client';

import { useMemo } from 'react';
import {
  DOMAINS,
  getProfession,
  getSpecializations,
  getSubspecializations,
  resolveProfessionLabel,
} from '@/lib/utils/professionTaxonomy';

/**
 * Professions section: displays current professions and lets the user add/remove them.
 * Supports the canonical v2 taxonomy: domain → profession → specialization → subspecialization.
 *
 * @param {Object} props
 * @param {Array} props.professions - array of canonical {domainId, professionId, specializationId?, subspecializationId?}
 * @param {Object} props.picker - { domainId, professionId, specializationId, subspecializationId }
 * @param {Function} props.onPickerChange
 * @param {Function} props.onAdd
 * @param {Function} props.onRemove
 */
export default function ProfileProfessionsSection({ professions, picker, onPickerChange, onAdd, onRemove }) {
  const specializations = useMemo(
    () => getSpecializations(picker.domainId, picker.professionId),
    [picker.domainId, picker.professionId]
  );

  const subspecializations = useMemo(
    () => getSubspecializations(picker.domainId, picker.professionId, picker.specializationId),
    [picker.domainId, picker.professionId, picker.specializationId]
  );

  const professionList = useMemo(() => {
    if (!picker.domainId) return [];
    const domain = DOMAINS.find((d) => d.id === picker.domainId);
    return domain ? domain.professions : [];
  }, [picker.domainId]);

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
            >&#x2715;</button>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Domain */}
        <select
          value={picker.domainId}
          onChange={(e) => onPickerChange({ domainId: e.target.value, professionId: '', specializationId: '', subspecializationId: '' })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">— Domain —</option>
          {DOMAINS.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
        {/* Profession */}
        <select
          value={picker.professionId}
          onChange={(e) => onPickerChange({ ...picker, professionId: e.target.value, specializationId: '', subspecializationId: '' })}
          disabled={!picker.domainId}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">— Profession —</option>
          {professionList.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        {/* Specialization */}
        <select
          value={picker.specializationId}
          onChange={(e) => onPickerChange({ ...picker, specializationId: e.target.value, subspecializationId: '' })}
          disabled={!picker.professionId || !specializations.length}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">— Specialization (optional) —</option>
          {specializations.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {/* Subspecialization */}
        <select
          value={picker.subspecializationId}
          onChange={(e) => onPickerChange({ ...picker, subspecializationId: e.target.value })}
          disabled={!picker.specializationId || !subspecializations.length}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">— Sub-specialization (optional) —</option>
          {subspecializations.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
      <div>
        <button
          type="button"
          disabled={(professions || []).length >= 5 || !picker.domainId || !picker.professionId}
          onClick={onAdd}
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  );
}
