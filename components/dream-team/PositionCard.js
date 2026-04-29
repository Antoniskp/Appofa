'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import positionTypesData from '@/config/governmentPositionTypes.json';
import positionsData from '@/config/governmentPositions.json';
// Country-specific icon maps — add a new import here when adding a new country config.
// (Dynamic fs.readdirSync is not available in Next.js client components.)
import cyPositionsData from '@/config/countries/CY.json';
import PersonSearch from './PersonSearch';

const positionTypesMap = positionTypesData.reduce((acc, pt) => {
  acc[pt.key] = pt;
  return acc;
}, {});

// Build icon map from GR positions and all supported country configs.
// CY slugs (cy-ypoyrgos-*) are not in governmentPositions.json (GR-only) so they
// would otherwise fall back to the generic ⚖️ minister icon.
const positionIconMap = [
  ...positionsData.positions,
  ...cyPositionsData.positions,
].reduce((acc, p) => {
  if (p.icon) acc[p.slug] = p.icon;
  return acc;
}, {});

const DEFAULT_META = { labelGr: 'Θέση', color: 'bg-indigo-100 text-indigo-700', icon: '⚖️' };

function PersonAvatar({ photo, name, avatarColor, size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base',
  };
  if (photo) {
    return (
      <img
        src={photo}
        alt={name || ''}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  const initial = (name?.trim() || '').charAt(0).toUpperCase() || '?';
  const bg = avatarColor || '#6b7280';
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white`}
      style={{ backgroundColor: bg }}
      aria-label={name || ''}
    >
      {initial}
    </div>
  );
}

export default function PositionCard({ position, myVote, onVote, onDeleteVote, loading, nationalityFilter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const prevMyVoteRef = useRef(null);

  const currentHolder = position.currentHolders?.[0] || null;
  const votes = position.votes || [];
  const totalVotes = votes.reduce((sum, v) => sum + parseInt(v.voteCount, 10), 0);
  const topVotes = votes.slice(0, 5);

  const meta = positionTypesMap[position.positionTypeKey] || DEFAULT_META;
  const icon = positionIconMap[position.slug] || meta.icon;

  // Restore selected person from myVote using joined data when available.
  // When myVote transitions from truthy → null (vote deleted), clear search state.
  useEffect(() => {
    if (myVote) {
      let name;
      let id;
      if (myVote.candidateUser) {
        name = (`${myVote.candidateUser.firstNameNative || ''} ${myVote.candidateUser.lastNameNative || ''}`.trim()) || myVote.candidateUser.username;
        id = myVote.candidateUserId;
      } else {
        name = myVote.personName || '';
        id = myVote.candidateUserId;
      }
      if (id) {
        setSelectedPerson({ id, name, type: 'user' });
        setSearchQuery(name);
      }
    } else if (prevMyVoteRef.current != null && !myVote) {
      // myVote just became null (vote was deleted) — reset search state
      setSelectedPerson(null);
      setSearchQuery('');
    }
    prevMyVoteRef.current = myVote;
  }, [myVote]);

  const handleSelectPerson = useCallback((person) => {
    const name = (`${person.firstNameNative || ''} ${person.lastNameNative || ''}`.trim()) || person.username;
    setSelectedPerson({ id: person.id, name, type: 'user' });
    setSearchQuery(name);
  }, []);

  const isVoteChanged = selectedPerson && selectedPerson.id !== myVote?.candidateUserId;

  const handleVoteClick = () => {
    if (onVote && selectedPerson && isVoteChanged) {
      onVote(position.id, selectedPerson.id);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{icon}</span>
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
                photo={currentHolder.holderPhoto || currentHolder.person?.photo || currentHolder.user?.photo || currentHolder.user?.avatar || null}
                name={currentHolder.person
                  ? `${currentHolder.person.firstNameNative} ${currentHolder.person.lastNameNative}`
                  : currentHolder.user
                    ? ((`${currentHolder.user.firstNameNative || ''} ${currentHolder.user.lastNameNative || ''}`.trim()) || currentHolder.user.username)
                    : '—'}
                avatarColor={currentHolder.holderAvatarColor || currentHolder.user?.avatarColor || null}
              />
              <div>
                <p className="font-semibold text-gray-800 text-sm">
                  {currentHolder.person
                    ? `${currentHolder.person.firstNameNative} ${currentHolder.person.lastNameNative}`
                    : currentHolder.user
                      ? ((`${currentHolder.user.firstNameNative || ''} ${currentHolder.user.lastNameNative || ''}`.trim()) || currentHolder.user.username)
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

          <div className="relative">
            {onVote ? (
              <>
                <PersonSearch
                  onSelect={handleSelectPerson}
                  showTopSuggestions={true}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Αναζητήστε πρόσωπο..."
                  nationality={nationalityFilter}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSelectedPerson(null);
                      setSearchQuery('');
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors z-10"
                    aria-label="Καθαρισμός αναζήτησης"
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <>
                <span id={`locked-vote-hint-${position.id}`} className="sr-only">
                  Η αναζήτηση είναι κλειδωμένη. Συνδεθείτε για να ψηφίσετε.
                </span>
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  disabled
                  placeholder="Συνδεθείτε για να ψηφίσετε"
                  aria-describedby={`locked-vote-hint-${position.id}`}
                  aria-label="Κλειδωμένη αναζήτηση. Συνδεθείτε για να ψηφίσετε"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </>
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
                const isMyVote = v.candidateUserId && v.candidateUserId === myVote?.candidateUserId;
                const photo = v.candidateUser?.photo || v.candidateUser?.avatar || null;
                return (
                  <div key={`${v.candidateUserId}-${idx}`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5 flex-1 mr-2 min-w-0">
                        {photo && (
                          <img src={photo} alt="" className="h-5 w-5 rounded-full object-cover flex-shrink-0" />
                        )}
                        <span className={`font-medium truncate ${isMyVote ? 'text-blue-600' : 'text-gray-700'}`}>
                          {isMyVote && <span className="mr-1">✓</span>}
                          {v.personName}
                        </span>
                      </div>
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
                      ? `${currentHolder.person.firstNameNative} ${currentHolder.person.lastNameNative}`
                      : currentHolder.user
                        ? ((`${currentHolder.user.firstNameNative || ''} ${currentHolder.user.lastNameNative || ''}`.trim()) || currentHolder.user.username)
                        : '—')
                  : '—'}
              </p>
            </div>
            <div className="p-3 bg-purple-50">
              <p className="text-purple-400 mb-1">🤖 AI</p>
              <p className="font-semibold text-purple-700 text-xs leading-tight">
                {position.aiSuggestions?.[0]?.person
                  ? `${position.aiSuggestions[0].person.firstNameNative} ${position.aiSuggestions[0].person.lastNameNative}`
                  : position.aiSuggestions?.[0]?.user
                    ? ((`${position.aiSuggestions[0].user.firstNameNative || ''} ${position.aiSuggestions[0].user.lastNameNative || ''}`.trim()) || position.aiSuggestions[0].user.username)
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
        {onVote && (
          <button
            onClick={handleVoteClick}
            disabled={!onVote || !selectedPerson || !isVoteChanged || loading}
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
        )}

        {myVote && !isVoteChanged && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
            <CheckCircleSolid className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm text-green-700 font-medium">{myVote.personName}</span>
          </div>
        )}

        {myVote && onDeleteVote && !isVoteChanged && (
          <button
            onClick={() => onDeleteVote(position.id)}
            disabled={loading}
            className="w-full mt-2 text-xs text-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
            aria-label={`Διαγραφή ψήφου για ${position.title}`}
          >
            🗑 Διαγραφή ψήφου
          </button>
        )}
      </div>
    </div>
  );
}
