'use client';

import { useState } from 'react';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid, HandThumbDownIcon as HandThumbDownSolid } from '@heroicons/react/24/solid';
import { suggestionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const VOTE_LABELS = {
  idea:                { up: 'Συμφωνώ',         down: 'Διαφωνώ'             },
  problem:             { up: 'Είναι πρόβλημα',   down: 'Δεν είναι πρόβλημα' },
  problem_request:     { up: 'Το έχω κι εγώ',    down: 'Δεν αφορά'           },
  location_suggestion: { up: 'Καλή τοποθεσία',   down: 'Κακή τοποθεσία'      },
};

/**
 * Inline upvote/downvote buttons for a suggestion card.
 *
 * @param {number}   suggestionId   - ID of the suggestion to vote on
 * @param {string}   type           - Suggestion type (idea, problem, …)
 * @param {number}   initialUpvotes - Initial upvote count from the API
 * @param {number}   initialDownvotes - Initial downvote count from the API
 * @param {number|null} initialMyVote - Current user's existing vote (1, -1, or null)
 */
export default function InlineSuggestionVote({
  suggestionId,
  type,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialMyVote = null,
}) {
  const { user } = useAuth();
  const [upvotes, setUpvotes]     = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [myVote, setMyVote]       = useState(initialMyVote);
  const [isVoting, setIsVoting]   = useState(false);

  const labels = VOTE_LABELS[type] || VOTE_LABELS.idea;

  const handleVote = async (e, value) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || isVoting) return;

    const prevUpvotes   = upvotes;
    const prevDownvotes = downvotes;
    const prevMyVote    = myVote;

    // Toggling the same vote removes it
    const newMyVote = prevMyVote === value ? null : value;

    // Optimistic update
    let newUp   = upvotes;
    let newDown = downvotes;
    if (prevMyVote === 1)  newUp--;
    if (prevMyVote === -1) newDown--;
    if (newMyVote === 1)   newUp++;
    if (newMyVote === -1)  newDown++;

    setMyVote(newMyVote);
    setUpvotes(newUp);
    setDownvotes(newDown);
    setIsVoting(true);

    try {
      const res = await suggestionAPI.voteSuggestion(suggestionId, value);
      if (res.success) {
        setUpvotes(res.data.upvotes);
        setDownvotes(res.data.downvotes);
        setMyVote(res.data.myVote ?? null);
      } else {
        // Rollback on failure
        setMyVote(prevMyVote);
        setUpvotes(prevUpvotes);
        setDownvotes(prevDownvotes);
      }
    } catch {
      // Rollback on error
      setMyVote(prevMyVote);
      setUpvotes(prevUpvotes);
      setDownvotes(prevDownvotes);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Upvote */}
      <button
        type="button"
        onClick={(e) => handleVote(e, 1)}
        disabled={!user || isVoting}
        title={user ? labels.up : 'Συνδεθείτε για να ψηφίσετε'}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          myVote === 1
            ? 'bg-green-100 text-green-700'
            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
        }`}
      >
        {myVote === 1
          ? <HandThumbUpSolid className="h-4 w-4" />
          : <HandThumbUpIcon  className="h-4 w-4" />}
        <span>{upvotes}</span>
      </button>

      {/* Downvote */}
      <button
        type="button"
        onClick={(e) => handleVote(e, -1)}
        disabled={!user || isVoting}
        title={user ? labels.down : 'Συνδεθείτε για να ψηφίσετε'}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          myVote === -1
            ? 'bg-red-100 text-red-600'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
        }`}
      >
        {myVote === -1
          ? <HandThumbDownSolid className="h-4 w-4" />
          : <HandThumbDownIcon  className="h-4 w-4" />}
        <span>{downvotes}</span>
      </button>
    </div>
  );
}
