'use client';

import { useState } from 'react';
import { authAPI } from '@/lib/api';

export default function NewsletterRecipientPicker({ value, onChange, disabled = false }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const individual = value.recipientMode === 'individual';

  const find = async () => {
    if (loading || disabled) return;
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.getAdminUsers({ search: search.trim(), placeholder: 'false', page: 1, limit: 10 });
      if (!response.success) throw new Error(response.message || 'Could not find users.');
      setUsers(response.data?.users || []);
      setLoaded(true);
    } catch (err) { setError(err.message || 'Could not find users.'); }
    finally { setLoading(false); }
  };

  const selected = users.find((user) => user.id === Number(value.recipientUserId));
  return <fieldset disabled={disabled} className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3">
    <label className="block text-sm font-medium">Send to
      <select value={individual ? 'individual' : 'audience'} onChange={(event) => onChange({ recipientMode: event.target.value, recipientUserId: null })} className="mt-1 block w-full rounded-lg border border-gray-300 p-2">
        <option value="audience">An audience</option>
        <option value="individual">One registered user</option>
      </select>
    </label>
    {individual && <>
      <p className="text-xs text-gray-600">Choose one user. Saving creates a draft; send yourself a test before delivery. The user’s email preferences and reminder eligibility still apply.</p>
      <div className="flex gap-2">
        <input aria-label="Find email recipient" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); find(); } }} placeholder="Name, username or email" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button type="button" onClick={find} disabled={loading} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-60">{loading ? 'Searching…' : 'Find users'}</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {loaded && !users.length && <p className="text-sm text-gray-600">No registered users match. Try another name or email.</p>}
      <ul className="space-y-2">{users.map((user) => <li key={user.id}>
        <button type="button" aria-pressed={user.id === Number(value.recipientUserId)} onClick={() => onChange({ recipientUserId: user.id })} className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm aria-pressed:border-blue-600">
          <span className="block font-semibold">{user.username}</span><span className="break-all text-gray-600">{user.email}</span>
        </button>
      </li>)}</ul>
      <p role="status" className="text-sm font-medium text-blue-800">{value.recipientUserId ? `Selected: ${selected ? `${selected.username} · ${selected.email}` : `user #${value.recipientUserId}`}. Only this user can receive this draft.` : 'Select a user to continue. No recipient is selected.'}</p>
    </>}
  </fieldset>;
}
