'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { XMarkIcon, UserCircleIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';
import positionsData from '@/config/governmentPositions.json';

const ALL_POSITIONS = positionsData.positions;

function buildPicksMap(formation) {
  const map = {};
  (formation?.picks || []).forEach((p) => {
    if (p.positionSlug) map[p.positionSlug] = p;
  });
  return map;
}

function PickCell({ pick, highlight }) {
  const hasPick = pick && (pick.candidateUserId || pick.personName);
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
        highlight === 'match'
          ? 'bg-green-50 border border-green-200'
          : highlight === 'diff'
          ? 'bg-red-50 border border-red-200'
          : 'bg-gray-50 border border-transparent'
      }`}
    >
      {hasPick ? (
        <>
          {pick.photo || pick.avatar ? (
            <img src={pick.photo || pick.avatar} alt={pick.personName} className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <UserCircleIcon className="h-4 w-4 text-blue-400" />
            </div>
          )}
          <span className="truncate font-medium text-gray-800">{pick.personName}</span>
        </>
      ) : (
        <span className="text-gray-300 italic">—</span>
      )}
    </div>
  );
}

function DonutChart({ percent }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const stroke = circumference * (1 - percent / 100);
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="rotate-[-90deg]">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke={percent >= 70 ? '#22c55e' : percent >= 40 ? '#f59e0b' : '#ef4444'}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={stroke}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

/**
 * FormationComparison — side-by-side comparison of two formations.
 *
 * Props:
 *   formationA  – pre-selected formation object (or null)
 *   publicFormations – list of public formation objects to pick from
 *   myFormations     – list of user's own formations
 *   onClose()        – close handler
 */
export default function FormationComparison({ formationA = null, publicFormations = [], myFormations = [], onClose }) {
  const [leftId, setLeftId] = useState(formationA?.id || '');
  const [rightId, setRightId] = useState('');
  const [leftFormation, setLeftFormation] = useState(formationA || null);
  const [rightFormation, setRightFormation] = useState(null);
  const [loadingLeft, setLoadingLeft] = useState(false);
  const [loadingRight, setLoadingRight] = useState(false);

  const allOptions = [
    ...myFormations.map((f) => ({ ...f, _group: 'Δικές μου' })),
    ...publicFormations.filter((f) => !myFormations.some((m) => m.id === f.id)).map((f) => ({ ...f, _group: 'Δημόσιες' })),
  ];

  // Build a Map for O(1) lookup — keep as a ref so the callback always sees the latest value
  const optionsMapRef = useRef(new Map());
  optionsMapRef.current = new Map(allOptions.map((f) => [String(f.id), f]));

  const loadFormation = useCallback(async (id, side) => {
    if (!id) {
      if (side === 'left') { setLeftFormation(null); setLeftId(''); }
      else { setRightFormation(null); setRightId(''); }
      return;
    }

    // Check cache in optionsMapRef first (O(1) lookup)
    const cached = optionsMapRef.current.get(String(id));
    if (cached?.picks) {
      if (side === 'left') { setLeftFormation(cached); setLeftId(id); }
      else { setRightFormation(cached); setRightId(id); }
      return;
    }

    if (side === 'left') setLoadingLeft(true); else setLoadingRight(true);
    try {
      const res = await dreamTeamAPI.getFormation(id);
      if (res?.success) {
        if (side === 'left') { setLeftFormation(res.data); setLeftId(id); }
        else { setRightFormation(res.data); setRightId(id); }
      }
    } catch {
      // Non-critical
    } finally {
      if (side === 'left') setLoadingLeft(false); else setLoadingRight(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-populate if formationA is provided
  useEffect(() => {
    if (formationA && !leftFormation) {
      setLeftFormation(formationA);
      setLeftId(String(formationA.id));
    }
  }, [formationA, leftFormation]);

  // Compute comparison
  const leftMap = buildPicksMap(leftFormation);
  const rightMap = buildPicksMap(rightFormation);

  let matchCount = 0;
  ALL_POSITIONS.forEach((pos) => {
    const l = leftMap[pos.slug];
    const r = rightMap[pos.slug];
    const lKey = l?.candidateUserId || l?.personName || null;
    const rKey = r?.candidateUserId || r?.personName || null;
    if (lKey && rKey && lKey === rKey) matchCount++;
  });

  const totalFilled = ALL_POSITIONS.filter((pos) => {
    const l = leftMap[pos.slug];
    const r = rightMap[pos.slug];
    return (l?.candidateUserId || l?.personName) || (r?.candidateUserId || r?.personName);
  }).length;

  const matchPercent = totalFilled > 0 ? Math.round((matchCount / totalFilled) * 100) : 0;
  const bothSelected = !!leftFormation && !!rightFormation;

  const optionsByGroup = allOptions.reduce((acc, f) => {
    if (!acc[f._group]) acc[f._group] = [];
    acc[f._group].push(f);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-5 w-5 text-indigo-500" />
            ⚖️ Σύγκριση Συνθέσεων
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Κλείσιμο"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Left selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Σύνθεση Α</label>
              <select
                value={leftId}
                onChange={(e) => loadFormation(e.target.value, 'left')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={loadingLeft}
              >
                <option value="">— Επιλέξτε σύνθεση —</option>
                {Object.entries(optionsByGroup).map(([group, items]) => (
                  <optgroup key={group} label={group}>
                    {items.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Right selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Σύνθεση Β</label>
              <select
                value={rightId}
                onChange={(e) => loadFormation(e.target.value, 'right')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={loadingRight}
              >
                <option value="">— Επιλέξτε σύνθεση —</option>
                {Object.entries(optionsByGroup).map(([group, items]) => (
                  <optgroup key={group} label={group}>
                    {items.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Match summary */}
          {bothSelected && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-blue-100 p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-2xl font-extrabold text-gray-900">
                  {matchCount}/{totalFilled} θέσεις
                  <span className="text-base font-normal text-gray-500 ml-2">συμφωνούν</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-1" />Πράσινο = συμφωνία
                  <span className="inline-block w-3 h-3 rounded-full bg-red-400 ml-3 mr-1" />Κόκκινο = διαφορά
                </p>
              </div>
              <div className="relative flex items-center justify-center">
                <DonutChart percent={matchPercent} />
                <span className="absolute text-xl font-extrabold text-gray-800 rotate-[90deg] translate-y-0.5">
                  {matchPercent}%
                </span>
              </div>
            </div>
          )}

          {/* Comparison table */}
          {(leftFormation || rightFormation) && (
            <div className="overflow-x-auto">
              {/* Column headers */}
              <div className="grid grid-cols-[140px_1fr_1fr] gap-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div className="px-3">Θέση</div>
                <div className="px-3 text-blue-600 truncate">{leftFormation?.name || 'Σύνθεση Α'}</div>
                <div className="px-3 text-indigo-600 truncate">{rightFormation?.name || 'Σύνθεση Β'}</div>
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {ALL_POSITIONS.map((pos) => {
                  const l = leftMap[pos.slug];
                  const r = rightMap[pos.slug];
                  const lKey = l?.candidateUserId || l?.personName || null;
                  const rKey = r?.candidateUserId || r?.personName || null;
                  const isMatch = lKey && rKey && lKey === rKey;
                  const isDiff = lKey && rKey && lKey !== rKey;

                  return (
                    <div key={pos.slug} className="grid grid-cols-[140px_1fr_1fr] gap-2 items-center">
                      <div className="flex items-center gap-1.5 px-3 py-1">
                        <span className="text-base flex-shrink-0">{pos.icon}</span>
                        <span className="text-xs text-gray-600 leading-tight line-clamp-2">{pos.title}</span>
                      </div>
                      <PickCell pick={l} highlight={isMatch ? 'match' : isDiff ? 'diff' : null} />
                      <PickCell pick={r} highlight={isMatch ? 'match' : isDiff ? 'diff' : null} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!leftFormation && !rightFormation && (
            <div className="text-center py-12 text-gray-400">
              <ArrowsRightLeftIcon className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Επιλέξτε δύο συνθέσεις για σύγκριση</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
