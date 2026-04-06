'use client';

import { UserCircleIcon } from '@heroicons/react/24/outline';
import { TrophyIcon } from '@heroicons/react/24/solid';
import positionsData from '@/config/governmentPositions.json';

const positionIconMap = positionsData.positions.reduce((acc, p) => {
  if (p.icon) acc[p.slug] = p.icon;
  return acc;
}, {});

const CATEGORY_META = {
  head_of_state: { label: 'Πρόεδρος', color: 'border-purple-300 bg-purple-50', badge: 'bg-purple-100 text-purple-700', icon: '👑' },
  parliament_speaker: { label: 'Πρόεδρος Βουλής', color: 'border-green-300 bg-green-50', badge: 'bg-green-100 text-green-700', icon: '🏛️' },
  prime_minister: { label: 'Πρωθυπουργός', color: 'border-blue-300 bg-blue-50', badge: 'bg-blue-100 text-blue-700', icon: '🏛️' },
  minister: { label: 'Υπουργός', color: 'border-indigo-200 bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700', icon: '⚖️' },
};

function WinnerCard({ item }) {
  const meta = CATEGORY_META[item.position?.positionTypeKey] || CATEGORY_META.minister;
  const icon = positionIconMap[item.position?.slug] || meta.icon;
  const winner = item.winner;
  const currentHolder = item.position?.currentHolders?.[0] || null;
  const currentHolderName = currentHolder
    ? (currentHolder.person
        ? `${currentHolder.person.firstNameNative} ${currentHolder.person.lastNameNative}`
        : currentHolder.holderName)
    : null;
  const aiSuggestion = item.position?.aiSuggestions?.[0]?.name || null;

  return (
    <div className={`rounded-2xl border-2 ${meta.color} p-5 flex flex-col items-center text-center gap-3 transition-shadow hover:shadow-md`}>
      {/* Photo */}
      <div className="relative">
        {winner?.photo || winner?.avatar ? (
          <img
            src={winner.photo || winner.avatar}
            alt={winner.personName}
            className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-md">
            <UserCircleIcon className="h-10 w-10 text-gray-400" />
          </div>
        )}
        {winner && (
          <div className="absolute -top-2 -right-2 bg-amber-400 rounded-full p-1 shadow">
            <TrophyIcon className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Position */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
          {icon} {item.position?.title || '—'}
        </p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.badge}`}>
          {meta.label}
        </span>
      </div>

      {/* Winner name */}
      {winner ? (
        <div>
          <p className="font-bold text-gray-900 text-base">{winner.personName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {winner.voteCount.toLocaleString('el-GR')} ψήφοι · {winner.percentage}%
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">Καμία ψήφος ακόμα</p>
      )}

      {/* Comparison row */}
      <div className="w-full grid grid-cols-3 divide-x divide-gray-200 border border-gray-200 rounded-xl overflow-hidden text-center text-xs mt-1">
        <div className="p-2 bg-gray-50">
          <p className="text-gray-400 mb-0.5">🏛️ Σήμερα</p>
          <p className="font-semibold text-gray-700 leading-tight">{currentHolderName || '—'}</p>
        </div>
        <div className="p-2 bg-purple-50">
          <p className="text-purple-400 mb-0.5">🤖 AI</p>
          <p className="font-semibold text-purple-700 leading-tight">{aiSuggestion || '—'}</p>
        </div>
        <div className="p-2 bg-blue-50">
          <p className="text-blue-400 mb-0.5">🗳️ Χρήστες</p>
          <p className="font-semibold text-blue-700 leading-tight">{winner?.personName || '—'}</p>
        </div>
      </div>
    </div>
  );
}

export default function DreamTeamResults({ results = [] }) {
  if (!results.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <span className="text-4xl mb-4 block">🏛️</span>
        <p className="text-lg font-medium">Δεν υπάρχουν αποτελέσματα ακόμα</p>
        <p className="text-sm mt-1">Ψηφίστε για να δείτε την ιδανική κυβέρνηση</p>
      </div>
    );
  }

  const presidents = results.filter((r) => r.position?.positionTypeKey === 'head_of_state');
  const speakers = results.filter((r) => r.position?.positionTypeKey === 'parliament_speaker');
  const primeMinisters = results.filter((r) => r.position?.positionTypeKey === 'prime_minister');
  const ministers = results.filter((r) => r.position?.positionTypeKey === 'minister');

  const topPositions = [...presidents, ...speakers, ...primeMinisters];

  return (
    <div className="space-y-8">
      {/* Top 3 positions side by side */}
      {topPositions.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>🏛️</span> Ανώτατες Θέσεις
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topPositions.map((item) => (
              <WinnerCard key={`${item.position?.positionTypeKey}-${item.position?.id}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Ministers */}
      {ministers.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span>⚖️</span> Υπουργικό Συμβούλιο
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ministers.map((item) => (
              <WinnerCard key={item.position?.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
