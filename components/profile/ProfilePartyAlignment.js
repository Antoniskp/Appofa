'use client';

import { useEffect, useState } from 'react';
import { positionAPI } from '@/lib/api/positions';
import Card from '@/components/ui/Card';
import OrgAvatar from '@/components/organization/OrgAvatar';

async function getPartyAlignment(organization) {
  const votes = [];
  let page = 1;
  let pages = 1;

  do {
    const response = await positionAPI.list({ organizationId: organization.id, page });
    const data = response?.data || response;
    const positions = data?.positions || [];
    votes.push(...positions.filter((position) => position.myVote === 1 || position.myVote === -1));
    pages = data?.pagination?.pages || 0;
    page += 1;
  } while (page <= pages);

  const agreed = votes.filter((position) => position.myVote === 1).length;
  const disagreed = votes.length - agreed;
  return { ...organization, agreed, disagreed, answered: votes.length, score: votes.length ? Math.round((agreed / votes.length) * 100) : null };
}

export default function ProfilePartyAlignment() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    async function load() {
      try {
        const response = await positionAPI.metadata();
        const data = response?.data || response;
        const organizations = (data?.organizations || []).filter((organization) => organization.type === 'party');
        const alignment = await Promise.all(organizations.map(getPartyAlignment));
        if (current) setParties(alignment.filter((party) => party.answered).sort((a, b) => b.score - a.score || b.answered - a.answered || a.name.localeCompare(b.name)));
      } catch {
        if (current) setError(true);
      } finally {
        if (current) setLoading(false);
      }
    }
    load();
    return () => { current = false; };
  }, []);

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900">Party alignment</h2>
      <p className="mt-1 text-sm text-gray-600">Based on how you voted on each party’s published policy positions. Unsure and unanswered positions are excluded.</p>
      {loading ? <p className="mt-4 text-sm text-gray-500" aria-live="polite">Calculating your alignment…</p>
        : error ? <p className="mt-4 text-sm text-red-700" role="alert">Party alignment could not be loaded. Please try again later.</p>
          : parties.length === 0 ? <p className="mt-4 text-sm text-gray-500">Vote agree or disagree on party policies to see your alignment here.</p>
            : <ol className="mt-5 space-y-4">
              {parties.map((party, index) => (
                <li key={party.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-6 shrink-0 text-sm font-semibold text-gray-400">{index + 1}.</span>
                      {party.logo && <OrgAvatar org={party} size="h-8 w-8" />}
                      <h3 className="truncate font-semibold text-gray-900">{party.name}</h3>
                    </div>
                    <strong className="shrink-0 text-lg text-blue-700">{party.score}%</strong>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200" role="img" aria-label={`${party.score}% agreement`}>
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${party.score}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-gray-600">Agree: {party.agreed} · Disagree: {party.disagreed} · Policies answered: {party.answered}</p>
                </li>
              ))}
            </ol>}
    </Card>
  );
}
