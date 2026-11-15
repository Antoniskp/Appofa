'use client';

import { useState } from 'react';
import { pollAPI } from '@/lib/api';
import { buildFeaturedPollBlock } from '@/lib/constants/newsletterFollowups';

export default function NewsletterPollPicker({ onInsert, locale, disabled = false }) {
  const [polls, setPolls] = useState([]);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await pollAPI.getAll({ status: 'active', visibility: 'public', sort: 'popular', search, limit: 30 });
      if (!response.success) throw new Error(response.message || 'Could not load polls.');
      const available = (response.data?.polls || []).filter((poll) => poll.voteRestriction !== 'locals_only' && (!poll.deadline || new Date(poll.deadline) > new Date()));
      setPolls(available);
      setSelected(available[0]?.id ? String(available[0].id) : '');
      setLoaded(true);
    } catch (err) {
      setError(err.message || 'Could not load polls.');
    } finally {
      setLoading(false);
    }
  };

  const insert = () => {
    try {
      const poll = polls.find((item) => String(item.id) === selected);
      if (poll) onInsert(buildFeaturedPollBlock(poll, locale));
    } catch (err) { setError(err.message); }
  };

  return <fieldset disabled={disabled || loading} className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-3 disabled:opacity-60">
    <legend className="text-sm font-semibold">Feature a popular poll (optional)</legend>
    <p className="text-xs text-gray-600">Choose a public poll, ordered by participation. Its card is saved in the email so you can edit and test the exact message.</p>
    <div className="flex gap-2">
      <input aria-label="Search polls for email" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or topic" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      <button type="button" onClick={load} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">{loading ? 'Loading…' : 'Find polls'}</button>
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {loaded && !polls.length && <p className="text-sm text-gray-600">No open public polls match. Try another search.</p>}
    {polls.length > 0 && <>
      <select aria-label="Featured poll" value={selected} onChange={(event) => setSelected(event.target.value)} className="block w-full rounded-lg border border-gray-300 p-2 text-sm">
        {polls.map((poll) => <option key={poll.id} value={poll.id}>{poll.title} · {poll.totalVotes || 0} votes</option>)}
      </select>
      <button type="button" onClick={insert} disabled={!selected} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-60">Insert poll card</button>
    </>}
  </fieldset>;
}
