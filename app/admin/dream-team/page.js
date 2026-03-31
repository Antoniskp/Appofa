'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI';
import { apiRequest } from '@/lib/api/client';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/SkeletonLoader';

const CATEGORY_LABELS = {
  president: '👑 Πρόεδρος',
  prime_minister: '🏛️ Πρωθυπουργός',
  minister: '⚖️ Υπουργός / Άλλο',
};

// ─── Inline editable text ────────────────────────────────────────────────────
function InlineEdit({ value, onSave, placeholder = '—', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  const save = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          className="border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={save} className="text-green-600 hover:text-green-700"><CheckIcon className="h-4 w-4" /></button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-4 w-4" /></button>
      </span>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value || ''); setEditing(true); }}
      className={`text-left hover:underline decoration-dashed text-gray-700 ${className}`}
      title="Κλικ για επεξεργασία"
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </button>
  );
}

// ─── Person search dropdown ───────────────────────────────────────────────────
function PersonSearch({ onSelect, placeholder = 'Αναζητήστε προφίλ...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const ref = useRef(null);

  const search = useCallback((q) => {
    clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await apiRequest(`/api/persons?search=${encodeURIComponent(q)}&limit=8`);
        const profiles = res?.data?.profiles || [];
        setResults(profiles);
        setOpen(profiles.length > 0);
      } catch { setResults([]); }
    }, 300);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((p) => (
            <li
              key={p.id}
              onClick={() => { onSelect(p); setQuery(`${p.firstName} ${p.lastName}`); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
            >
              {p.photo
                ? <img src={p.photo} alt="" className="h-7 w-7 rounded-full object-cover" />
                : <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center"><UserCircleIcon className="h-4 w-4 text-gray-400" /></div>}
              <span className="font-medium">{p.firstName} {p.lastName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Suggestions panel for one position ──────────────────────────────────────
function SuggestionsPanel({ position, onRefresh }) {
  const [newName, setNewName] = useState('');
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await dreamTeamAPI.adminCreateSuggestion({ positionId: position.id, name: newName.trim(), reason: newReason.trim() || null, order: position.aiSuggestions?.length || 0 });
      setNewName(''); setNewReason(''); setAdding(false);
      onRefresh();
    } catch (err) { alert(err.message || 'Σφάλμα αποθήκευσης'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Διαγραφή πρότασης;')) return;
    try {
      await dreamTeamAPI.adminDeleteSuggestion(id);
      onRefresh();
    } catch (err) { alert(err.message || 'Σφάλμα διαγραφής'); }
  };

  const handleUpdateName = async (suggestion, name) => {
    if (!name) return;
    try { await dreamTeamAPI.adminUpdateSuggestion(suggestion.id, { name }); onRefresh(); }
    catch (err) { alert(err.message || 'Σφάλμα αποθήκευσης'); }
  };

  const handleUpdateReason = async (suggestion, reason) => {
    try { await dreamTeamAPI.adminUpdateSuggestion(suggestion.id, { reason: reason || null }); onRefresh(); }
    catch (err) { alert(err.message || 'Σφάλμα αποθήκευσης'); }
  };

  const suggestions = position.aiSuggestions || [];

  return (
    <div>
      {suggestions.length === 0 && !adding && (
        <p className="text-sm text-gray-400 italic mb-2">Καμία πρόταση ακόμα.</p>
      )}
      {suggestions.map((s) => (
        <div key={s.id} className="flex items-start gap-2 py-1 group">
          <div className="flex-1 min-w-0">
            <InlineEdit value={s.name} onSave={(v) => handleUpdateName(s, v)} className="text-sm font-medium" />
            <InlineEdit value={s.reason} onSave={(v) => handleUpdateReason(s, v)} placeholder="Λόγος..." className="text-xs text-gray-500 block" />
          </div>
          <button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity flex-shrink-0">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="mt-2 space-y-1 border-t pt-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Όνομα προσώπου *" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Λόγος (προαιρετικό)" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !newName.trim()} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
              <CheckIcon className="h-3.5 w-3.5" /> Αποθήκευση
            </button>
            <button onClick={() => { setAdding(false); setNewName(''); setNewReason(''); }} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border rounded">
              Ακύρωση
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
          <PlusIcon className="h-3.5 w-3.5" /> Προσθήκη πρότασης
        </button>
      )}
    </div>
  );
}

// ─── Current holder panel for one position ───────────────────────────────────
function HolderPanel({ position, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [holderName, setHolderName] = useState('');
  const [since, setSince] = useState('');
  const [useProfile, setUseProfile] = useState(true);

  const activeHolder = (position.currentHolders || []).find((h) => h.isActive);
  const allHolders = position.currentHolders || [];

  const handleAdd = async () => {
    const personId = useProfile ? selectedPerson?.id : null;
    const name = useProfile ? null : holderName.trim();
    if (!personId && !name) return;
    setSaving(true);
    try {
      await dreamTeamAPI.adminCreateHolder({ positionId: position.id, personId, holderName: name, since: since || null });
      setAdding(false); setSelectedPerson(null); setHolderName(''); setSince('');
      onRefresh();
    } catch (err) { alert(err.message || 'Σφάλμα αποθήκευσης'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Διαγραφή κατόχου;')) return;
    try { await dreamTeamAPI.adminDeleteHolder(id); onRefresh(); }
    catch (err) { alert(err.message || 'Σφάλμα διαγραφής'); }
  };

  const holderDisplayName = (h) => {
    if (h.person) return `${h.person.firstName} ${h.person.lastName}`;
    return h.holderName || '—';
  };

  return (
    <div>
      {allHolders.length === 0 && !adding && (
        <p className="text-sm text-gray-400 italic mb-2">Κανένας κάτοχος ακόμα.</p>
      )}
      {allHolders.map((h) => (
        <div key={h.id} className="flex items-center gap-2 py-1 group">
          {h.person?.photo
            ? <img src={h.person.photo} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
            : <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="h-4 w-4 text-gray-400" /></div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{holderDisplayName(h)}</p>
            {h.since && <p className="text-xs text-gray-400">από {new Date(h.since).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
          </div>
          {h.isActive && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex-shrink-0">Ενεργός</span>}
          <button onClick={() => handleDelete(h.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity flex-shrink-0">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="mt-2 border-t pt-2 space-y-2">
          <div className="flex gap-3 text-xs">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={useProfile} onChange={() => setUseProfile(true)} /> Από προφίλ
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={!useProfile} onChange={() => setUseProfile(false)} /> Χειροκίνητα
            </label>
          </div>
          {useProfile
            ? <PersonSearch onSelect={setSelectedPerson} placeholder="Αναζητήστε δημόσιο προφίλ..." />
            : <input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Όνομα κατόχου *" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />}
          <input type="date" value={since} onChange={(e) => setSince(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || (useProfile ? !selectedPerson : !holderName.trim())} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
              <CheckIcon className="h-3.5 w-3.5" /> Αποθήκευση
            </button>
            <button onClick={() => { setAdding(false); setSelectedPerson(null); setHolderName(''); setSince(''); }} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border rounded">
              Ακύρωση
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
          <PlusIcon className="h-3.5 w-3.5" />
          {activeHolder ? 'Αλλαγή κατόχου' : 'Προσθήκη κατόχου'}
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminDreamTeamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState({});

  const { data: positions, loading, error, refetch } = useAsyncData(
    async () => {
      const res = await dreamTeamAPI.adminGetPositions();
      return res?.data || [];
    },
    [],
    { initialData: [] }
  );

  if (!authLoading && user && !['admin', 'moderator'].includes(user.role)) {
    router.replace('/');
    return null;
  }

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));
  const getTab = (id) => activeTab[id] || 'holders';
  const setTab = (id, tab) => setActiveTab((prev) => ({ ...prev, [id]: tab }));

  const grouped = {
    president: positions.filter((p) => p.category === 'president'),
    prime_minister: positions.filter((p) => p.category === 'prime_minister'),
    minister: positions.filter((p) => p.category === 'minister'),
  };

  const renderGroup = (key, label) => {
    const group = grouped[key];
    if (!group.length) return null;
    return (
      <section key={key}>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</h2>
        <div className="space-y-2">
          {group.map((pos) => {
            const isOpen = expandedId === pos.id;
            const tab = getTab(pos.id);
            const activeHolder = (pos.currentHolders || []).find((h) => h.isActive);
            const holderName = activeHolder?.person
              ? `${activeHolder.person.firstName} ${activeHolder.person.lastName}`
              : activeHolder?.holderName;
            const suggCount = (pos.aiSuggestions || []).length;

            return (
              <div key={pos.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => toggleExpand(pos.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="flex-1 font-medium text-gray-800 text-sm">{pos.title}</span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {holderName
                      ? <span className="text-green-600">✓ {holderName}</span>
                      : <span className="text-amber-500">Χωρίς κάτοχο</span>}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {suggCount} {suggCount === 1 ? 'πρόταση' : 'προτάσεις'}
                  </span>
                  <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {/* Tabs */}
                    <div className="flex gap-1 mb-4 border-b border-gray-200">
                      {[
                        { id: 'holders', label: '🏛️ Τρέχων Κάτοχος' },
                        { id: 'suggestions', label: '🤖 Προτάσεις AI' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTab(pos.id, t.id)}
                          className={`px-3 py-2 text-xs font-medium rounded-t transition-colors -mb-px border-b-2 ${
                            tab === t.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {tab === 'holders' && (
                      <HolderPanel position={pos} onRefresh={refetch} />
                    )}
                    {tab === 'suggestions' && (
                      <SuggestionsPanel position={pos} onRefresh={refetch} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dream Team — Διαχείριση</h1>
            <p className="text-sm text-gray-500 mt-1">Ορίστε τρέχοντες κατόχους θέσεων και προτάσεις AI ανά θέση.</p>
          </div>
        </div>

        {loading && <SkeletonLoader count={5} type="card" />}
        {error && <p className="text-red-500 text-sm">Αποτυχία φόρτωσης δεδομένων.</p>}

        {!loading && (
          <div className="space-y-8">
            {renderGroup('president', '👑 Πρόεδρος Δημοκρατίας')}
            {renderGroup('minister', '⚖️ Πρόεδρος Βουλής / Υπουργοί')}
            {renderGroup('prime_minister', '🏛️ Πρωθυπουργός')}
          </div>
        )}
      </div>
    </div>
  );
}
