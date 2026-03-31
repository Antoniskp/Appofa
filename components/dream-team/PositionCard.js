'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircleIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { apiRequest } from '@/lib/api/client.js';
import positionTypesData from '@/config/governmentPositionTypes.json';

const positionTypesMap = positionTypesData.reduce((acc, pt) => {
  acc[pt.key] = pt;
  return acc;
}, {});

const DEFAULT_META = { labelGr: 'Θέση', color: 'bg-indigo-100 text-indigo-700', icon: '⚖️' };

function PersonAvatar({ photo, name, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-sm', md: 'h-12 w-12 text-base', lg: 'h-16 w-16 text-xl' };
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${sizes[size]} rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0`}>
      <UserCircleIcon className="h-5 w-5 text-gray-400" />
    </div>
  );
}

export default function PositionCard({ position, myVote, onVote, loading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const searchTimer = useRef(null);
  const dropdownRef = useRef(null);

  const currentHolder = position.currentHolders?.[0] || null;
  const votes = position.votes || [];
  const totalVotes = votes.reduce((sum, v) => sum + parseInt(v.voteCount, 10), 0);
  const topVotes = votes.slice(0, 5);

  const meta = positionTypesMap[position.positionTypeKey] || DEFAULT_META;

  // Set initial selected person from myVote
  useEffect(() => {
    if (myVote) {
      setSelectedPerson({ id: myVote.personId, name: myVote.personName });
    }
  }, [myVote]);

  // Debounced person search
  const handleSearchChange = useCallback((e) => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(searchTimer.current);

    if (!q.trim()) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiRequest(`/api/persons?search=${encodeURIComponent(q)}&limit=10`);
        const profiles = res?.data?.profiles || [];
        setSearchResults(profiles);
        setDropdownOpen(profiles.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const handleSelectPerson = useCallback((person) => {
    const name = `${person.firstName} ${person.lastName}`.trim();
    setSelectedPerson({ id: person.id, name });
    setSearchQuery(name);
    setDropdownOpen(false);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isVoteChanged = selectedPerson && selectedPerson.id !== myVote?.personId;

  const handleVoteClick = () => {
    if (selectedPerson && isVoteChanged) {
      onVote(position.id, selectedPerson.id);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{position.title}</h3>
            <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mt-1 ${meta.color}`}>
              {meta.labelGr}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Holder */}
        {currentHolder && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Σήμερα στη θέση
            </p>
            <div className="flex items-center gap-3">
              <PersonAvatar
                photo={currentHolder.person?.photo}
                name={currentHolder.person
                  ? `${currentHolder.person.firstName} ${currentHolder.person.lastName}`
                  : '—'}
              />
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {currentHolder.person
                    ? `${currentHolder.person.firstName} ${currentHolder.person.lastName}`
                    : '—'}
                </p>
                {currentHolder.since && (
                  <p className="text-xs text-gray-400">
                    από {new Date(currentHolder.since).toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vote Picker */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Η ψήφος μου
          </p>

          {myVote && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-green-50 rounded-lg border border-green-200">
              <CheckCircleSolid className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700 font-medium">{myVote.personName}</span>
            </div>
          )}

          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchResults.length > 0 && setDropdownOpen(true)}
                placeholder="Αναζητήστε πρόσωπο..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label={`Αναζήτηση προσώπου για ${position.title}`}
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
                role="combobox"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {dropdownOpen && searchResults.length > 0 && (
              <ul
                role="listbox"
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                {searchResults.map((person) => (
                  <li
                    key={person.id}
                    role="option"
                    aria-selected={selectedPerson?.id === person.id}
                    onClick={() => handleSelectPerson(person)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectPerson(person)}
                    tabIndex={0}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <PersonAvatar
                      photo={person.photo}
                      name={`${person.firstName} ${person.lastName}`}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {person.firstName} {person.lastName}
                      </p>
                      {person.bio && (
                        <p className="text-xs text-gray-400 truncate">{person.bio}</p>
                      )}
                    </div>
                    {selectedPerson?.id === person.id && (
                      <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Vote Results */}
        {topVotes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Αποτελέσματα · {totalVotes.toLocaleString('el-GR')} ψήφοι
            </p>
            <div className="space-y-2">
              {topVotes.map((v, idx) => {
                const count = parseInt(v.voteCount, 10);
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const isMyVote = v.personId === myVote?.personId;
                return (
                  <div key={`${v.personId}-${idx}`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium truncate flex-1 mr-2 ${isMyVote ? 'text-blue-600' : 'text-gray-700'}`}>
                        {isMyVote && <span className="mr-1">✓</span>}
                        {v.personName}
                      </span>
                      <span className="text-gray-500 flex-shrink-0">{pct}% ({count})</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isMyVote ? 'bg-blue-500' : 'bg-indigo-400'}`}
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Σύγκριση
          </p>
          <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-center text-xs">
            <div className="p-3 bg-gray-50">
              <p className="text-gray-400 mb-1">🏛️ Σήμερα</p>
              <p className="font-semibold text-gray-700 text-xs leading-tight">
                {currentHolder
                  ? (currentHolder.person
                      ? `${currentHolder.person.firstName} ${currentHolder.person.lastName}`
                      : '—')
                  : '—'}
              </p>
            </div>
            <div className="p-3 bg-purple-50">
              <p className="text-purple-400 mb-1">🤖 AI</p>
              <p className="font-semibold text-purple-700 text-xs leading-tight">
                {position.aiSuggestions?.[0]?.person
                  ? `${position.aiSuggestions[0].person.firstName} ${position.aiSuggestions[0].person.lastName}`
                  : '—'}
              </p>
            </div>
            <div className="p-3 bg-blue-50">
              <p className="text-blue-400 mb-1">🗳️ Χρήστες</p>
              <p className="font-semibold text-blue-700 text-xs leading-tight">
                {votes[0]?.personName || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Vote Button */}
        <button
          onClick={handleVoteClick}
          disabled={!selectedPerson || !isVoteChanged || loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Ψηφίστε για ${position.title}`}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Καταχώρηση...
            </>
          ) : myVote && !isVoteChanged ? (
            <>
              <CheckCircleSolid className="h-4 w-4" />
              Έχετε ψηφίσει
            </>
          ) : (
            'Ψηφίστε'
          )}
        </button>
      </div>
    </div>
  );
}
