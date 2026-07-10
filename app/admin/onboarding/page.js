'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';

const GOAL_LABELS = {
  moderator: 'Moderator',
  creator: 'Creator',
  independent: 'Independent',
  citizen: 'Citizen',
  _all: 'All goals',
};

const EVENT_LABELS = {
  registration: 'Registration',
  onboarding_viewed: 'Onboarding viewed',
  goal_selected: 'Goal selected',
  checklist_progress: 'Checklist progress',
  onboarding_dismissed: 'Dismissed',
  onboarding_resumed: 'Resumed',
  onboarding_completed: 'Completed',
  moderator_application_submitted: 'Moderator app. submitted',
  moderator_application_approved: 'Moderator app. approved',
  first_contribution_created: 'First contribution',
  candidate_registration_submitted: 'Candidate reg. submitted',
  candidate_registration_approved: 'Candidate reg. approved',
};

const GOAL_FILTER_OPTIONS = [
  { value: '', label: 'All goals' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'creator', label: 'Creator' },
  { value: 'independent', label: 'Independent' },
  { value: 'citizen', label: 'Citizen' },
];

// Default date range helper
function formatDateInput(date) {
  return date.toISOString().split('T')[0];
}

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return formatDateInput(d);
}

function FunnelTable({ byEventType = {}, goal }) {
  const events = Object.keys(EVENT_LABELS);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm" aria-label="Funnel event counts by goal">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-medium text-gray-600">Event</th>
            {!goal && Object.keys(GOAL_LABELS).map((g) => (
              <th key={g} scope="col" className="px-4 py-3 text-right font-medium text-gray-600">
                {GOAL_LABELS[g]}
              </th>
            ))}
            {goal && (
              <th scope="col" className="px-4 py-3 text-right font-medium text-gray-600">
                {GOAL_LABELS[goal] || goal}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {events.map((eventType) => {
            const row = byEventType[eventType] || {};
            return (
              <tr key={eventType} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-800">
                  {EVENT_LABELS[eventType] || eventType}
                </td>
                {!goal && Object.keys(GOAL_LABELS).map((g) => (
                  <td key={g} className="px-4 py-2 text-right text-gray-700 tabular-nums">
                    {row[g] ?? 0}
                  </td>
                ))}
                {goal && (
                  <td className="px-4 py-2 text-right text-gray-700 tabular-nums">
                    {row[goal] ?? row['_all'] ?? 0}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AbandonmentCard({ abandonment }) {
  if (!abandonment) return null;
  const { windowDays, viewedBeforeCutoff, completedViewers, abandonedCount, abandonmentRate } = abandonment;

  return (
    <div
      className="rounded-lg border border-orange-200 bg-orange-50 p-5 mb-6"
      role="region"
      aria-label="Abandonment metrics"
    >
      <h2 className="font-semibold text-orange-900 mb-3">
        Abandonment ({windowDays}-day window)
      </h2>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        {[
          { label: 'Viewed (before cutoff)', value: viewedBeforeCutoff },
          { label: 'Completed', value: completedViewers },
          { label: 'Abandoned', value: abandonedCount },
          { label: 'Rate', value: `${abandonmentRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-md bg-white p-3 border border-orange-100">
            <dt className="text-xs text-gray-500 mb-1">{label}</dt>
            <dd className="text-xl font-bold text-gray-900 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-gray-500 mt-3">
        Abandonment = users who viewed onboarding before the {windowDays}-day cutoff and have not yet completed it.
      </p>
    </div>
  );
}

function ConversionSummary({ byEventType }) {
  const viewed = (byEventType?.onboarding_viewed || {});
  const completed = (byEventType?.onboarding_completed || {});
  const allViewed = Object.values(viewed).reduce((s, v) => s + v, 0);
  const allCompleted = Object.values(completed).reduce((s, v) => s + v, 0);
  const rate = allViewed > 0 ? Math.round((allCompleted / allViewed) * 100) : 0;

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"
      role="region"
      aria-label="Overall conversion summary"
    >
      {[
        { label: 'Total viewed', value: allViewed },
        { label: 'Total completed', value: allCompleted },
        { label: 'Completion rate', value: `${rate}%` },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

function AdminOnboardingContent() {
  const today = formatDateInput(new Date());
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(today);
  const [goal, setGoal] = useState('');
  const [appliedParams, setAppliedParams] = useState({ from: defaultFrom(), to: today, goal: '' });

  const { data, loading, error, refetch } = useAsyncData(
    async () => {
      const res = await adminAPI.getOnboardingFunnel(appliedParams);
      if (res.success) return res.data;
      return null;
    },
    [appliedParams],
    { initialData: null }
  );

  const handleApply = (e) => {
    e.preventDefault();
    setAppliedParams({ from, to, goal });
  };

  return (
    <AdminLayout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Onboarding Funnel Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Aggregate, privacy-safe funnel metrics for the onboarding journey. No individual browsing history is exposed.
            </p>
          </div>

          {/* Filters */}
          <form onSubmit={handleApply} className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
            <div>
              <label htmlFor="from-date" className="block text-xs font-medium text-gray-700 mb-1">From</label>
              <input
                id="from-date"
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label htmlFor="to-date" className="block text-xs font-medium text-gray-700 mb-1">To</label>
              <input
                id="to-date"
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => setTo(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label htmlFor="goal-filter" className="block text-xs font-medium text-gray-700 mb-1">Goal</label>
              <select
                id="goal-filter"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {GOAL_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Apply
            </button>
          </form>

          {loading && <SkeletonLoader />}
          {error && <AlertMessage type="error" message="Failed to load funnel data." />}

          {data && !loading && (
            <>
              <ConversionSummary byEventType={data.byEventType} />
              <AbandonmentCard abandonment={data.abandonment} />

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">Events by Goal</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Unique users per event type, within selected date range</p>
                </div>
                <FunnelTable byEventType={data.byEventType} goal={appliedParams.goal} />
              </div>

              <p className="text-xs text-gray-400">
                Period: {data.from?.split('T')[0]} → {data.to?.split('T')[0]}.
                {appliedParams.goal && ` Filtered to goal: ${GOAL_LABELS[appliedParams.goal]}.`}
              </p>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminOnboardingPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminOnboardingContent />
    </ProtectedRoute>
  );
}
