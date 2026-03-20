'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  MapPinIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpSolid,
  HandThumbDownIcon as HandThumbDownSolid,
} from '@heroicons/react/24/solid';
import { suggestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import Badge from '@/components/Badge';
import { useAsyncData } from '@/hooks/useAsyncData';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  idea: 'Ιδέα',
  problem: 'Πρόβλημα',
  location_suggestion: 'Τοποθεσία',
};

const TYPE_VARIANTS = {
  idea: 'primary',
  problem: 'warning',
  location_suggestion: 'success',
};

const STATUS_LABELS = {
  open: 'Ανοιχτό',
  under_review: 'Σε Εξέταση',
  implemented: 'Υλοποιήθηκε',
  rejected: 'Απορρίφθηκε',
};

const STATUS_VARIANTS = {
  open: 'info',
  under_review: 'warning',
  implemented: 'success',
  rejected: 'danger',
};

// ─── Vote Buttons Component ───────────────────────────────────────────────────

function VoteButtons({ score, myVote, onVote, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onVote(1)}
        disabled={disabled}
        title="Ψήφος υπέρ"
        className={`p-1.5 rounded-lg transition-colors ${
          myVote === 1
            ? 'bg-green-100 text-green-700'
            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {myVote === 1 ? (
          <HandThumbUpSolid className="h-5 w-5" />
        ) : (
          <HandThumbUpIcon className="h-5 w-5" />
        )}
      </button>

      <span
        className={`text-sm font-bold min-w-[2rem] text-center ${
          score > 0 ? 'text-green-600' : score < 0 ? 'text-red-500' : 'text-gray-500'
        }`}
      >
        {score > 0 ? `+${score}` : score}
      </span>

      <button
        onClick={() => onVote(-1)}
        disabled={disabled}
        title="Ψήφος κατά"
        className={`p-1.5 rounded-lg transition-colors ${
          myVote === -1
            ? 'bg-red-100 text-red-600'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {myVote === -1 ? (
          <HandThumbDownSolid className="h-5 w-5" />
        ) : (
          <HandThumbDownIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

// ─── Solution Card ────────────────────────────────────────────────────────────

function SolutionCard({ solution, user, onVote, votingId }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{solution.body}</p>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {solution.author && <span>@{solution.author.username}</span>}
          <span>{new Date(solution.createdAt).toLocaleDateString('el-GR')}</span>
        </div>
        <VoteButtons
          score={solution.score}
          myVote={solution.myVote}
          onVote={(val) => onVote(solution.id, val)}
          disabled={!user || votingId === `sol-${solution.id}`}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuggestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const suggestionId = parseInt(params.id, 10);

  const [suggestion, setSuggestion] = useState(null);
  const [votingId, setVotingId] = useState(null);
  const [solutionBody, setSolutionBody] = useState('');
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState('');

  const fetchSuggestion = useCallback(async () => {
    const res = await suggestionAPI.getById(suggestionId);
    if (res.success) return res.data;
    throw new Error(res.message || 'Σφάλμα φόρτωσης');
  }, [suggestionId]);

  const { loading, error } = useAsyncData(fetchSuggestion, [suggestionId], {
    onSuccess: (data) => setSuggestion(data),
  });

  // ── Vote on suggestion ─────────────────────────────────────────────────────
  const handleSuggestionVote = async (value) => {
    if (!user) {
      addToast('Πρέπει να συνδεθείτε για να ψηφίσετε.', { type: 'info' });
      return;
    }
    setVotingId('suggestion');
    try {
      const res = await suggestionAPI.voteSuggestion(suggestionId, value);
      if (res.success) {
        setSuggestion((prev) => ({
          ...prev,
          score: res.data.score,
          myVote: res.data.myVote,
        }));
      } else {
        addToast(res.message || 'Σφάλμα ψηφοφορίας.', { type: 'error' });
      }
    } catch (err) {
      addToast(err.message || 'Σφάλμα ψηφοφορίας.', { type: 'error' });
    } finally {
      setVotingId(null);
    }
  };

  // ── Vote on solution ───────────────────────────────────────────────────────
  const handleSolutionVote = async (solutionId, value) => {
    if (!user) {
      addToast('Πρέπει να συνδεθείτε για να ψηφίσετε.', { type: 'info' });
      return;
    }
    setVotingId(`sol-${solutionId}`);
    try {
      const res = await suggestionAPI.voteSolution(solutionId, value);
      if (res.success) {
        setSuggestion((prev) => ({
          ...prev,
          solutions: prev.solutions
            .map((s) =>
              s.id === solutionId
                ? { ...s, score: res.data.score, myVote: res.data.myVote }
                : s
            )
            .sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt)),
        }));
      } else {
        addToast(res.message || 'Σφάλμα ψηφοφορίας.', { type: 'error' });
      }
    } catch (err) {
      addToast(err.message || 'Σφάλμα ψηφοφορίας.', { type: 'error' });
    } finally {
      setVotingId(null);
    }
  };

  // ── Submit a new solution ──────────────────────────────────────────────────
  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    setSolutionError('');
    if (!solutionBody.trim() || solutionBody.trim().length < 10) {
      setSolutionError('Η λύση πρέπει να έχει τουλάχιστον 10 χαρακτήρες.');
      return;
    }
    setSubmittingSolution(true);
    try {
      const res = await suggestionAPI.createSolution(suggestionId, { body: solutionBody });
      if (res.success) {
        setSuggestion((prev) => ({
          ...prev,
          solutions: [res.data, ...(prev.solutions || [])],
        }));
        setSolutionBody('');
        addToast('Η λύση προστέθηκε!', { type: 'success' });
      } else {
        addToast(res.message || 'Σφάλμα υποβολής.', { type: 'error' });
      }
    } catch (err) {
      addToast(err.message || 'Σφάλμα υποβολής.', { type: 'error' });
    } finally {
      setSubmittingSolution(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-3xl">
          <SkeletonLoader count={3} type="card" />
        </div>
      </div>
    );
  }

  if (error || !suggestion) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="app-container max-w-3xl">
          <EmptyState
            title="Η πρόταση δεν βρέθηκε"
            description={error || 'Η πρόταση που ζητήσατε δεν υπάρχει.'}
            action={{ label: 'Πίσω στις Προτάσεις', href: '/suggestions' }}
          />
        </div>
      </div>
    );
  }

  const isOwner = user?.id === suggestion.authorId;
  const isPrivileged = user && ['admin', 'moderator'].includes(user.role);
  const canAddSolution =
    user && suggestion.status !== 'implemented' && suggestion.status !== 'rejected';

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container max-w-3xl">
        {/* Back */}
        <Link
          href="/suggestions"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Πίσω στις Προτάσεις
        </Link>

        {/* Suggestion Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant={TYPE_VARIANTS[suggestion.type] || 'default'}>
              {TYPE_LABELS[suggestion.type] || suggestion.type}
            </Badge>
            <Badge variant={STATUS_VARIANTS[suggestion.status] || 'default'}>
              {STATUS_LABELS[suggestion.status] || suggestion.status}
            </Badge>
            {suggestion.location && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <MapPinIcon className="h-3.5 w-3.5" />
                {suggestion.location.name}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">{suggestion.title}</h1>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{suggestion.body}</p>

          {/* Footer row */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {suggestion.author && (
                <span className="font-medium">@{suggestion.author.username}</span>
              )}
              <span>{new Date(suggestion.createdAt).toLocaleDateString('el-GR')}</span>
              {(isOwner || isPrivileged) && (
                <Link
                  href={`/suggestions/${suggestion.id}/edit`}
                  className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700"
                >
                  <PencilSquareIcon className="h-3.5 w-3.5" />
                  Επεξεργασία
                </Link>
              )}
            </div>

            <VoteButtons
              score={suggestion.score}
              myVote={suggestion.myVote}
              onVote={handleSuggestionVote}
              disabled={!user || votingId === 'suggestion'}
            />
          </div>

          {!user && (
            <p className="text-xs text-gray-400 mt-3 text-right">
              <Link href="/login" className="text-blue-500 hover:underline">
                Συνδεθείτε
              </Link>{' '}
              για να ψηφίσετε.
            </p>
          )}
        </div>

        {/* Solutions Section */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Προτεινόμενες Λύσεις{' '}
            <span className="text-gray-400 font-normal text-base">
              ({suggestion.solutions?.length || 0})
            </span>
          </h2>

          {/* Add Solution Form */}
          {canAddSolution ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Προτείνετε μια Λύση
              </h3>
              <form onSubmit={handleSubmitSolution}>
                <textarea
                  value={solutionBody}
                  onChange={(e) => {
                    setSolutionBody(e.target.value);
                    if (solutionError) setSolutionError('');
                  }}
                  rows={4}
                  placeholder="Περιγράψτε την πρότασή σας για λύση..."
                  maxLength={5000}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[100px] ${
                    solutionError ? 'border-red-400' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {solutionError && (
                  <p className="text-red-500 text-xs mt-1">{solutionError}</p>
                )}
                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={submittingSolution}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingSolution ? 'Υποβολή...' : 'Υποβολή Λύσης'}
                  </button>
                </div>
              </form>
            </div>
          ) : !user ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-sm text-gray-600 text-center">
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Συνδεθείτε
              </Link>{' '}
              για να προτείνετε λύση.
            </div>
          ) : null}

          {/* Solutions List */}
          {suggestion.solutions && suggestion.solutions.length > 0 ? (
            <div className="space-y-3">
              {suggestion.solutions.map((sol) => (
                <SolutionCard
                  key={sol.id}
                  solution={sol}
                  user={user}
                  onVote={handleSolutionVote}
                  votingId={votingId}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
              Δεν υπάρχουν λύσεις ακόμα. Γίνετε ο πρώτος που θα προτείνει!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
