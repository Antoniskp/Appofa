'use client';

import { useEffect, useState } from 'react';
import PolicyExplanation from '@/components/positions/PolicyExplanation';
import ArticleCard from '@/components/articles/ArticleCard';
import Link from 'next/link';
import { positionAPI } from '@/lib/api/positions';
import { buildAuthPath } from '@/lib/auth-redirect';
import { FeaturedLivePoll } from '@/components/layout/HomeHero';

const card = 'rounded-xl border border-gray-200 bg-white p-5 text-charcoal';
const label = 'mb-3 text-xs font-bold uppercase tracking-widest text-copper';
const button = 'inline-flex min-h-11 items-center rounded-lg border border-current px-4 text-sm font-semibold';

function PolicyVote({ user }) {
  const [round, setRound] = useState(0);
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    if (!user) return;
    let current = true;
    positionAPI.list({ pool: 'home', voteView: 'unanswered', sort: 'shuffle', seed: 1 + Math.floor(Math.random() * 2147483646) })
      .then(({ data }) => { if (current) setState({ policy: data.positions[0] }); })
      .catch(() => { if (current) setState({ loadError: true }); });
    return () => { current = false; };
  }, [user, round]);

  function next() {
    setState({ loading: true });
    setRound(n => n + 1);
  }
  async function vote(value) {
    setState({ policy, saving: true });
    try {
      await positionAPI.vote(policy.id, value);
      setState({ policy, revealed: true });
    } catch {
      setState({ policy, voteError: true });
    }
  }
  const { policy } = state;
  return <article id="policy-vote" className={card} aria-live="polite">
    <h2 className="text-xl font-bold">Συμφωνείς με τη θέση;</h2>
    <p className="my-4">Διάβασε μια πολιτική θέση και διάλεξε την απάντησή σου. Μετά θα δεις από ποιο κόμμα ή την ομάδα του Appofasi προέρχεται.</p>
    {!user ? <>
      <div className="flex flex-wrap gap-2">{[['/login', 'Σύνδεση'], ['/register', 'Εγγραφή']].map(([path, title]) =>
        <Link className={button} key={path} href={buildAuthPath(path, '/#policy-vote')}>{title}</Link>)}</div>
    </> : state.loading ? <p>Αναζήτηση θέσης…</p> : state.loadError ? <>
      <p>Η θέση δεν φορτώθηκε.</p><button className={button} onClick={next}>Δοκίμασε ξανά</button>
    </> : !policy ? <p>Δεν υπάρχουν άλλες θέσεις για να ψηφίσεις τώρα.</p> : <>
      <h3 className="text-lg font-bold">{policy.title}</h3>
      <p className="my-3 max-h-48 overflow-y-auto whitespace-pre-line">{policy.body}</p>
      {state.revealed ? <>
        <p className="mb-3">Η θέση αποδίδεται σε: <strong>{policy.position.organization.name}</strong></p>
        <button className={button} onClick={next}>Επόμενη θέση →</button>
      </> : <>
        <div className="flex flex-wrap gap-2">{[[1, 'Συμφωνώ'], [-1, 'Διαφωνώ'], [2, 'Δεν έχω αποφασίσει ακόμη']].map(([value, title]) =>
          <button disabled={state.saving} className={button} key={value} onClick={() => vote(value)}>{title}</button>)}</div>
        <PolicyExplanation key={policy.id} policy={policy} />
        {state.voteError && <p role="alert">Η ψήφος δεν καταχωρίστηκε. Δοκίμασε ξανά.</p>}
      </>}
    </>}
  </article>;
}

export default function ParticipationRow({ user, featuredPoll, featuredPollLoading, analysis }) {
  return <section aria-label="Συμμετοχή και επικαιρότητα" className={`app-container grid gap-4 py-6 ${analysis ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
    <PolicyVote key={user?.id || 'guest'} user={user?.id} />
    {featuredPoll || featuredPollLoading
      ? <div className="rounded-xl bg-slate-900 text-white"><FeaturedLivePoll poll={featuredPoll} loading={featuredPollLoading} user={user} /></div>
      : <article className={card}><p className={label}>Ψηφοφορίες</p><h2 className="mb-4 text-xl font-bold">Σε ποια θέματα θέλεις να ψηφίσεις;</h2><Link className={button} href="/polls">Δες τις ψηφοφορίες</Link></article>}
    {analysis && <div className="min-w-0">
      <h2 className={label}>Τελευταία ανάλυση</h2>
      <ArticleCard article={analysis} variant="grid" />
    </div>}
  </section>;
}
