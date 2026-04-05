'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI';
import { useAuth } from '@/lib/auth-context';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import PersonSearch from '@/components/dream-team/PersonSearch';
import positionTypesData from '@/config/governmentPositionTypes.json';
import positionsData from '@/config/governmentPositions.json';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDialog } from '@/components/ui/Modal';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminLayout from '@/components/admin/AdminLayout';

const positionTypesMap = positionTypesData.reduce((acc, pt) => {
  acc[pt.key] = pt;
  return acc;
}, {});

const positionIconMap = positionsData.positions.reduce((acc, p) => {
  if (p.icon) acc[p.slug] = p.icon;
  return acc;
}, {});

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

// ─── Suggestions panel for one position ──────────────────────────────────────
function SuggestionsPanel({ position, onRefresh }) {
  const { addToast } = useToast();
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const handleAdd = async () => {
    if (!selectedPerson) return;
    setSaving(true);
    try {
      const isUser = selectedPerson.type === 'user';
      await dreamTeamAPI.adminCreateSuggestion({
        positionId: position.id,
        ...(isUser ? { userId: selectedPerson.id } : { personId: selectedPerson.id }),
        reason: newReason.trim() || null,
        order: position.aiSuggestions?.length || 0,
      });
      setSelectedPerson(null); setNewReason(''); setAdding(false);
      onRefresh();
      addToast('Η πρόταση προστέθηκε επιτυχώς!', { type: 'success' });
    } catch (err) { addToast(err.message || 'Σφάλμα αποθήκευσης', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await dreamTeamAPI.adminDeleteSuggestion(id);
      onRefresh();
      addToast('Η πρόταση διαγράφηκε επιτυχώς!', { type: 'success' });
    } catch (err) { addToast(err.message || 'Σφάλμα διαγραφής', { type: 'error' }); }
  };

  const handleUpdateReason = async (suggestion, reason) => {
    try {
      await dreamTeamAPI.adminUpdateSuggestion(suggestion.id, { reason: reason || null });
      onRefresh();
      addToast('Ο λόγος ενημερώθηκε επιτυχώς!', { type: 'success' });
    }
    catch (err) { addToast(err.message || 'Σφάλμα αποθήκευσης', { type: 'error' }); }
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
            <p className="text-sm font-medium text-gray-800 truncate">
              {s.person
                ? `${s.person.firstName} ${s.person.lastName}`
                : s.user
                  ? ((`${s.user.firstName || ''} ${s.user.lastName || ''}`.trim()) || s.user.username)
                  : '—'}
            </p>
            <InlineEdit value={s.reason} onSave={(v) => handleUpdateReason(s, v)} placeholder="Λόγος..." className="text-xs text-gray-500 block" />
          </div>
          <button onClick={() => { setDeleteTargetId(s.id); setDeleteDialogOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity flex-shrink-0">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="mt-2 space-y-1 border-t pt-2">
          <PersonSearch onSelect={setSelectedPerson} includeUsers={true} placeholder="Αναζητήστε δημόσιο προφίλ ή χρήστη *" />
          {selectedPerson && (
            <p className="text-xs text-green-600">✓ {selectedPerson.type === 'user' ? ((`${selectedPerson.firstName || ''} ${selectedPerson.lastName || ''}`.trim()) || selectedPerson.username) : `${selectedPerson.firstName} ${selectedPerson.lastName}`}</p>
          )}
          <input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Λόγος (προαιρετικό)" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !selectedPerson} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
              <CheckIcon className="h-3.5 w-3.5" /> Αποθήκευση
            </button>
            <button onClick={() => { setAdding(false); setSelectedPerson(null); setNewReason(''); }} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border rounded">
              Ακύρωση
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
          <PlusIcon className="h-3.5 w-3.5" /> Προσθήκη πρότασης
        </button>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTargetId(null); }}
        onConfirm={() => handleDelete(deleteTargetId)}
        title="Διαγραφή πρότασης"
        message="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την πρόταση;"
        confirmText="Διαγραφή"
        cancelText="Ακύρωση"
        variant="danger"
      />
    </div>
  );
}

// ─── Current holder panel for one position ───────────────────────────────────
function HolderPanel({ position, onRefresh }) {
  const { addToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [since, setSince] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const activeHolder = (position.currentHolders || []).find((h) => h.isActive);
  const allHolders = position.currentHolders || [];

  const handleAdd = async () => {
    if (!selectedPerson) return;
    setSaving(true);
    try {
      const isUser = selectedPerson.type === 'user';
      await dreamTeamAPI.adminCreateHolder({
        positionId: position.id,
        ...(isUser ? { userId: selectedPerson.id } : { personId: selectedPerson.id }),
        since: since || null,
      });
      setAdding(false); setSelectedPerson(null); setSince('');
      onRefresh();
      addToast('Ο κάτοχος προστέθηκε επιτυχώς!', { type: 'success' });
    } catch (err) { addToast(err.message || 'Σφάλμα αποθήκευσης', { type: 'error' }); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await dreamTeamAPI.adminDeleteHolder(id); onRefresh(); addToast('Ο κάτοχος διαγράφηκε επιτυχώς!', { type: 'success' }); }
    catch (err) { addToast(err.message || 'Σφάλμα διαγραφής', { type: 'error' }); }
  };

  const holderDisplayName = (h) => {
    if (h.person) return `${h.person.firstName} ${h.person.lastName}`;
    if (h.user) return ((`${h.user.firstName || ''} ${h.user.lastName || ''}`.trim()) || h.user.username);
    return '—';
  };

  return (
    <div>
      {allHolders.length === 0 && !adding && (
        <p className="text-sm text-gray-400 italic mb-2">Κανένας κάτοχος ακόμα.</p>
      )}
      {allHolders.map((h) => (
        <div key={h.id} className="flex items-center gap-2 py-1 group">
          {h.person?.photo || h.user?.avatar
            ? <img src={h.person?.photo || h.user?.avatar} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
            : <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="h-4 w-4 text-gray-400" /></div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{holderDisplayName(h)}</p>
            {h.since && <p className="text-xs text-gray-400">από {new Date(h.since).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
          </div>
          {h.isActive && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex-shrink-0">Ενεργός</span>}
          <button onClick={() => { setDeleteTargetId(h.id); setDeleteDialogOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity flex-shrink-0">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="mt-2 border-t pt-2 space-y-2">
          <PersonSearch onSelect={setSelectedPerson} includeUsers={true} placeholder="Αναζητήστε δημόσιο προφίλ ή χρήστη *" />
          {selectedPerson && (
            <p className="text-xs text-green-600">✓ {selectedPerson.type === 'user' ? ((`${selectedPerson.firstName || ''} ${selectedPerson.lastName || ''}`.trim()) || selectedPerson.username) : `${selectedPerson.firstName} ${selectedPerson.lastName}`}</p>
          )}
          <input type="date" value={since} onChange={(e) => setSince(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !selectedPerson} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
              <CheckIcon className="h-3.5 w-3.5" /> Αποθήκευση
            </button>
            <button onClick={() => { setAdding(false); setSelectedPerson(null); setSince(''); }} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 border rounded">
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

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTargetId(null); }}
        onConfirm={() => handleDelete(deleteTargetId)}
        title="Διαγραφή κατόχου"
        message="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον κάτοχο;"
        confirmText="Διαγραφή"
        cancelText="Ακύρωση"
        variant="danger"
      />
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

  // Group by scope, then by positionTypeKey within scope
  const scopeOrder = ['national', 'regional', 'municipal'];
  const scopeLabels = { national: '🏛️ Εθνικές Θέσεις', regional: '🗺️ Περιφερειακές Θέσεις', municipal: '🏙️ Δημοτικές Θέσεις' };

  const grouped = scopeOrder.reduce((acc, scope) => {
    acc[scope] = positions.filter((p) => p.scope === scope);
    return acc;
  }, {});

  const renderGroup = (scope) => {
    const group = grouped[scope];
    if (!group || !group.length) return null;
    const label = scopeLabels[scope];
    return (
      <section key={scope}>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</h2>
        <div className="space-y-2">
          {group.map((pos) => {
            const isOpen = expandedId === pos.id;
            const tab = getTab(pos.id);
            const activeHolder = (pos.currentHolders || []).find((h) => h.isActive);
            const holderName = activeHolder?.person
              ? `${activeHolder.person.firstName} ${activeHolder.person.lastName}`
              : activeHolder?.user
                ? ((`${activeHolder.user.firstName || ''} ${activeHolder.user.lastName || ''}`.trim()) || activeHolder.user.username)
                : null;
            const suggCount = (pos.aiSuggestions || []).length;
            const ptMeta = positionTypesMap[pos.positionTypeKey];
            const posIcon = positionIconMap[pos.slug] || (ptMeta && ptMeta.icon);

            return (
              <div key={pos.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => toggleExpand(pos.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {posIcon && <span className="text-base flex-shrink-0" aria-hidden="true">{posIcon}</span>}
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
    <AdminLayout>
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-4xl">
        <AdminHeader
          title="Dream Team — Διαχείριση"
          subtitle="Ορίστε τρέχοντες κατόχους θέσεων και προτάσεις AI ανά θέση."
        />

        {loading && <SkeletonLoader count={5} type="card" />}
        {error && <p className="text-red-500 text-sm">Αποτυχία φόρτωσης δεδομένων.</p>}

        {!loading && (
          <div className="space-y-8">
            {scopeOrder.map((scope) => renderGroup(scope))}
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
