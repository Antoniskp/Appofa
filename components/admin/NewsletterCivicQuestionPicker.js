'use client';

import { useState } from 'react';
import { civicQuestionAPI } from '@/lib/api';
import { buildFeaturedQuestionBlock, isEmailableParliamentQuestion } from '@/lib/constants/newsletterFollowups';

export default function NewsletterCivicQuestionPicker({ onInsert, locale, disabled = false }) {
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await civicQuestionAPI.getAll({ sourceType: 'parliament', status: 'open', sortBy: 'newest', search, limit: 50 });
      if (!response.success) throw new Error(response.message || 'Could not load parliament questions.');
      const available = (response.data || []).filter(isEmailableParliamentQuestion);
      setQuestions(available);
      setSelected(available[0]?.id ? String(available[0].id) : '');
      setLoaded(true);
    } catch (err) {
      setError(err.message || 'Could not load parliament questions.');
    } finally {
      setLoading(false);
    }
  };

  const insert = () => {
    try {
      const question = questions.find((item) => String(item.id) === selected);
      if (question) onInsert(buildFeaturedQuestionBlock(question, locale));
    } catch (err) { setError(err.message); }
  };

  return <fieldset disabled={disabled || loading} className="rounded-lg border border-violet-100 bg-violet-50 p-4 space-y-3 disabled:opacity-60">
    <legend className="text-sm font-semibold">Feature a parliament question (optional)</legend>
    <p className="text-xs text-gray-600">Browse recent open public questions. The saved card links to the question and its source context. Participation is advisory.</p>
    <div className="flex gap-2">
      <input aria-label="Search parliament questions for email" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); load(); } }} placeholder="Search by title or topic" className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      <button type="button" onClick={load} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">{loading ? 'Loading…' : 'Find questions'}</button>
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {loaded && !questions.length && <p className="text-sm text-gray-600">No open public parliament questions match. Try another search.</p>}
    {questions.length > 0 && <>
      <select aria-label="Featured parliament question" value={selected} onChange={(event) => setSelected(event.target.value)} className="block w-full rounded-lg border border-gray-300 p-2 text-sm">
        {questions.map((question) => <option key={question.id} value={question.id}>{question.title}</option>)}
      </select>
      <button type="button" onClick={insert} disabled={!selected} className="rounded-lg bg-violet-700 px-3 py-2 text-sm text-white disabled:opacity-60">Insert question card</button>
    </>}
  </fieldset>;
}
