import Link from 'next/link';
import PollOptionLogo from './PollOptionLogo';

const COLORS = ['#38bdf8', '#34d399', '#fb923c', '#a78bfa', '#f472b6', '#facc15', '#2dd4bf', '#f87171', '#818cf8', '#a3e635', '#e879f9', '#fbbf24', '#60a5fa', '#94a3b8', '#cbd5e1', '#a8a29e', '#71717a'];

export default function VotingIntentionSummary({ poll }) {
  const options = (poll.options || []).map((option, index) => ({ ...option, color: COLORS[index % COLORS.length] }));
  const total = options.reduce((sum, option) => sum + (option.voteCount || 0), 0);
  const active = poll.status === 'active' && (!poll.deadline || new Date(poll.deadline) > new Date());
  const visibleResults = poll.resultsVisibility === 'always' || (poll.resultsVisibility === 'after_vote' && Boolean(poll.userVote)) || (!active && poll.resultsVisibility === 'after_deadline');
  let offset = 0;
  const segments = options.filter(option => option.voteCount > 0).map(option => {
    const percentage = option.voteCount / total * 100;
    const segment = { ...option, percentage, offset };
    offset += percentage;
    return segment;
  });

  return (
    <div className="rounded-xl border border-white/25 bg-white/10 p-5 text-white shadow-xl backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-widest text-sand">Πρόθεση ψήφου</p>
      <h2 className="mt-2 text-xl font-bold leading-7">{poll.title}</h2>
      {visibleResults && (
        <>
          <div className="relative mx-auto my-5 h-44 w-44" role="img" aria-label={`Αποτελέσματα: ${total} ψήφοι. ${segments.map(option => `${option.text}: ${option.percentage.toFixed(1)}%`).join(', ')}`}>
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="15" />
              {segments.map(option => <circle key={option.id} cx="50" cy="50" r="40" fill="none" stroke={option.color} strokeWidth="15" pathLength="100" strokeDasharray={`${option.percentage} ${100 - option.percentage}`} strokeDashoffset={-option.offset} />)}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
              <strong className="text-3xl">{total.toLocaleString('el-GR')}</strong>
              <span className="text-xs text-white/70">{total === 1 ? 'ψήφος' : 'ψήφοι'}</span>
            </div>
          </div>
          {total === 0 ? <p className="mb-4 text-center text-sm text-white/75">Δεν έχουν καταχωριστεί ακόμη ψήφοι.</p> : (
            <details className="mb-4 rounded-lg border border-white/15 p-3">
              <summary className="cursor-pointer text-sm font-medium">Ανάλυση αποτελεσμάτων</summary>
              <ul className="mt-3 space-y-2">
                {segments.map(option => <li key={option.id} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
                  <PollOptionLogo poll={poll} option={option} />
                  <span className="min-w-0 flex-1">{option.text}</span>
                  <strong>{option.percentage.toFixed(1)}%</strong>
                </li>)}
              </ul>
            </details>
          )}
        </>
      )}
      <Link href={`/polls/${poll.id}`} className="mt-4 flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-bold text-gray-900 transition hover:bg-sand">
        {active ? (poll.userVote ? 'Αλλαγή ψήφου' : 'Ψήφισε με Google') : 'Δες τα αποτελέσματα'}
      </Link>
      <p className="mt-3 text-xs leading-5 text-white/65">Μία ψήφος ανά λογαριασμό Google. Ανοικτή διαδικτυακή ψηφοφορία, όχι αντιπροσωπευτική δημοσκόπηση.</p>
    </div>
  );
}
