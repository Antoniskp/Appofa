import Link from 'next/link';
import { getEmbedOpenPath } from '@/lib/utils/embed';

const TYPE_META = {
  polls: {
    badge: 'Δημοσκόπηση',
    accentClass: 'bg-blue-100 text-blue-700 border-blue-200',
    actionLabel: 'Άνοιγμα δημοσκόπησης',
  },
  suggestions: {
    badge: 'Πρόταση',
    accentClass: 'bg-amber-100 text-amber-800 border-amber-200',
    actionLabel: 'Άνοιγμα πρότασης',
  },
  'civic-questions': {
    badge: 'Civic Question',
    accentClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    actionLabel: 'Άνοιγμα civic question',
  },
};

const SUGGESTION_TYPE_LABELS = {
  idea: 'Ιδέα',
  problem: 'Πρόβλημα',
  problem_request: 'Ερώτημα κοινότητας',
  location_suggestion: 'Τοποθεσία',
};

const CIVIC_SOURCE_LABELS = {
  parliament: 'Κοινοβούλιο',
  european_commission: 'Ευρωπαϊκή Επιτροπή',
  municipal_council: 'Δημοτικό συμβούλιο',
  regional_council: 'Περιφερειακό συμβούλιο',
  other: 'Άλλο',
};

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('el-GR');
}

function truncate(value, max = 260) {
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}…`;
}

function StatPill({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function ResultBar({ label, value, percentage, toneClass }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{percentage}% · {value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function PollEmbedBody({ entity }) {
  const options = Array.isArray(entity.options) ? entity.options : [];
  const totalVotes = options.reduce((sum, option) => sum + (option.voteCount || 0), 0);
  const canShowResults = entity.resultsVisibility === 'always'
    || (entity.resultsVisibility === 'after_deadline'
      && (entity.status === 'closed'
        || (entity.deadline && new Date(entity.deadline) <= new Date())));

  return (
    <div className="space-y-4">
      {entity.description && (
        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{truncate(entity.description)}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatPill label="Κατάσταση" value={entity.status === 'active' ? 'Ενεργή' : 'Κλειστή'} />
        <StatPill label="Ορατότητα" value={entity.visibility === 'public' ? 'Δημόσια' : entity.visibility} />
        <StatPill label="Σύνολο ψήφων" value={totalVotes} />
      </div>

      {canShowResults ? (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Αποτελέσματα</div>
          {options.length > 0 ? options.map((option) => {
            const voteCount = option.voteCount || 0;
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            return (
              <ResultBar
                key={option.id}
                label={option.text}
                value={voteCount}
                percentage={percentage}
                toneClass="bg-blue-600"
              />
            );
          }) : (
            <p className="text-sm text-gray-600">Δεν υπάρχουν διαθέσιμες επιλογές.</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Τα αποτελέσματα εμφανίζονται μόνο όταν το επιτρέπει η δημοσκόπηση. Ανοίξτε την πλήρη σελίδα για ψήφο ή επιπλέον στοιχεία.
        </div>
      )}
    </div>
  );
}

function SuggestionEmbedBody({ entity }) {
  const upvotes = entity.upvotes ?? 0;
  const downvotes = entity.downvotes ?? 0;
  const totalVotes = upvotes + downvotes;
  const upPct = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;
  const downPct = totalVotes > 0 ? Math.round((downvotes / totalVotes) * 100) : 0;

  return (
    <div className="space-y-4">
      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{truncate(entity.body)}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatPill label="Τύπος" value={SUGGESTION_TYPE_LABELS[entity.type] || entity.type} />
        <StatPill label="Κατάσταση" value={entity.status || 'open'} />
        <StatPill label="Σκορ" value={(entity.score ?? (upvotes - downvotes))} />
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900">Αντιδράσεις</div>
        <ResultBar label="Θετικές" value={upvotes} percentage={upPct} toneClass="bg-green-600" />
        <ResultBar label="Αρνητικές" value={downvotes} percentage={downPct} toneClass="bg-red-600" />
      </div>
    </div>
  );
}

function CivicQuestionEmbedBody({ entity }) {
  const counts = entity.voteCounts || {};
  const percentages = entity.percentages || {};
  const totalVotes = entity.totalVotes ?? 0;
  const rows = [
    { key: 'agree', label: 'Συμφωνώ', className: 'bg-green-600' },
    { key: 'disagree', label: 'Διαφωνώ', className: 'bg-red-600' },
    { key: 'present', label: 'Παρών', className: 'bg-slate-600' },
  ];

  return (
    <div className="space-y-4">
      {entity.simplified && (
        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{truncate(entity.simplified)}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatPill label="Πηγή" value={CIVIC_SOURCE_LABELS[entity.sourceType] || entity.sourceType} />
        <StatPill label="Κατάσταση" value={entity.status || 'open'} />
        <StatPill label="Σύνολο ψήφων" value={totalVotes} />
      </div>

      {entity.canViewResults ? (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900">Αποτελέσματα</div>
          {rows.map((row) => (
            <ResultBar
              key={row.key}
              label={row.label}
              value={counts[row.key] || 0}
              percentage={percentages[row.key] || 0}
              toneClass={row.className}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Τα αποτελέσματα δεν είναι ακόμη διαθέσιμα για δημόσια ενσωμάτωση.
        </div>
      )}
    </div>
  );
}

export default function EntityEmbedView({ entityType, entity }) {
  const meta = TYPE_META[entityType];
  const openPath = getEmbedOpenPath(entityType, entity);

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-4">
      <article className="mx-auto w-full max-w-3xl overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-lg shadow-gray-200/80">
        <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.accentClass}`}>
                {meta.badge}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Appofasi embed</span>
            </div>
            <Link
              href={openPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
            >
              {meta.actionLabel}
            </Link>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="space-y-2">
            <h1 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">{entity.title}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {entity.location?.name && <span>📍 {entity.location.name}</span>}
              {entity.createdAt && <span>🗓 {formatDate(entity.createdAt)}</span>}
              {entity.deadline && <span>⏳ {formatDate(entity.deadline)}</span>}
            </div>
          </div>

          {entityType === 'polls' && <PollEmbedBody entity={entity} />}
          {entityType === 'suggestions' && <SuggestionEmbedBody entity={entity} />}
          {entityType === 'civic-questions' && <CivicQuestionEmbedBody entity={entity} />}
        </div>
      </article>
    </div>
  );
}
