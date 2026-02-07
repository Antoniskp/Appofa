'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import { CheckCircleIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

/**
 * Interactive voting interface for polls
 * @param {Object} poll - Poll object with questionType and options
 * @param {Function} onVote - Callback function when vote is submitted
 * @param {Object} userVote - Existing user vote if already voted
 * @param {boolean} isLoading - Loading state for vote submission
 */
export default function VoteInterface({ poll, onVote, userVote, isLoading }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [rankedOptions, setRankedOptions] = useState([]);
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const isOpen = poll.status === 'open' || poll.status === 'active';
  const questionType = poll.questionType || 'single-choice';

  useEffect(() => {
    // Initialize ranked options for ranked-choice polls
    if (questionType === 'ranked-choice' && poll.options) {
      setRankedOptions(poll.options.map(opt => ({ ...opt, rank: null })));
    }

    // Check if user has already voted
    if (userVote) {
      setHasVoted(true);
      if (questionType === 'single-choice' && userVote.optionId) {
        setSelectedOption(userVote.optionId);
      } else if (questionType === 'free-text' && userVote.freeTextResponse) {
        setFreeTextAnswer(userVote.freeTextResponse);
      }
    }
  }, [poll, userVote, questionType]);

  const handleSubmit = () => {
    if (!isOpen) return;

    let voteData = {};

    if (questionType === 'single-choice') {
      if (!selectedOption) {
        alert('Παρακαλώ επιλέξτε μία επιλογή');
        return;
      }
      voteData = { optionId: selectedOption };
    } else if (questionType === 'ranked-choice') {
      // Get ranked options (only those with assigned ranks)
      const ranked = rankedOptions
        .filter(opt => opt.rank !== null)
        .sort((a, b) => a.rank - b.rank)
        .map(opt => opt.id);
      
      if (ranked.length === 0) {
        alert('Παρακαλώ κατατάξτε τουλάχιστον μία επιλογή');
        return;
      }
      voteData = { optionIds: ranked };
    } else if (questionType === 'free-text') {
      if (!freeTextAnswer.trim()) {
        alert('Παρακαλώ εισάγετε μία απάντηση');
        return;
      }
      voteData = { freeTextResponse: freeTextAnswer.trim() };
    }

    onVote(voteData);
  };

  const handleRankChange = (optionId, rank) => {
    setRankedOptions(prev => 
      prev.map(opt => 
        opt.id === optionId ? { ...opt, rank: rank || null } : opt
      )
    );
  };

  const moveOptionUp = (index) => {
    if (index === 0) return;
    const newOptions = [...rankedOptions];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    // Update ranks
    const updatedOptions = newOptions.map((opt, idx) => ({ ...opt, rank: idx + 1 }));
    setRankedOptions(updatedOptions);
  };

  const moveOptionDown = (index) => {
    if (index === rankedOptions.length - 1) return;
    const newOptions = [...rankedOptions];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    // Update ranks
    const updatedOptions = newOptions.map((opt, idx) => ({ ...opt, rank: idx + 1 }));
    setRankedOptions(updatedOptions);
  };

  // If poll is closed
  if (!isOpen) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <CheckCircleIcon className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
        <p className="text-lg font-medium text-yellow-800">
          Αυτή η ψηφοφορία είναι κλειστή
        </p>
        <p className="text-sm text-yellow-700 mt-2">
          Δεν μπορείτε πλέον να ψηφίσετε
        </p>
      </div>
    );
  }

  // If user already voted
  if (hasVoted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <p className="text-lg font-medium text-green-800">
          Έχετε ήδη ψηφίσει σε αυτή την ψηφοφορία
        </p>
        <p className="text-sm text-green-700 mt-2">
          Ευχαριστούμε για τη συμμετοχή σας!
        </p>
      </div>
    );
  }

  // Single Choice Interface
  if (questionType === 'single-choice') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Επιλέξτε μία απάντηση</h2>
        <div className="space-y-3 mb-6">
          {poll.options?.map((option) => (
            <label
              key={option.id}
              className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 ${
                selectedOption === option.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="poll-option"
                value={option.id}
                checked={selectedOption === option.id}
                onChange={() => setSelectedOption(option.id)}
                className="mt-1"
              />
              <div className="flex-grow">
                <p className="font-medium text-gray-900">
                  {option.optionText || option.displayName}
                </p>
                {poll.pollType === 'complex' && option.imageUrl && (
                  <img
                    src={option.imageUrl}
                    alt={option.optionText || option.displayName}
                    className="mt-2 h-24 w-24 object-cover rounded"
                  />
                )}
                {poll.pollType === 'complex' && option.linkUrl && (
                  <a
                    href={option.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Περισσότερες πληροφορίες →
                  </a>
                )}
              </div>
            </label>
          ))}
        </div>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!selectedOption || isLoading}
          className="w-full"
        >
          Υποβολή Ψήφου
        </Button>
      </div>
    );
  }

  // Ranked Choice Interface
  if (questionType === 'ranked-choice') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-2">Κατατάξτε τις επιλογές</h2>
        <p className="text-sm text-gray-600 mb-4">
          Χρησιμοποιήστε τα βέλη για να αναδιατάξετε ή εισάγετε αριθμούς κατάταξης
        </p>
        
        <div className="space-y-3 mb-6">
          {rankedOptions.map((option, index) => (
            <div
              key={option.id}
              className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-white"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveOptionUp(index)}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUpIcon className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => moveOptionDown(index)}
                  disabled={index === rankedOptions.length - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDownIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 font-bold rounded">
                {index + 1}
              </div>
              <div className="flex-grow">
                <p className="font-medium text-gray-900">
                  {option.optionText || option.displayName}
                </p>
              </div>
              <input
                type="number"
                min="1"
                max={rankedOptions.length}
                value={index + 1}
                onChange={(e) => {
                  const newRank = parseInt(e.target.value);
                  if (newRank >= 1 && newRank <= rankedOptions.length && newRank !== index + 1) {
                    const newOptions = [...rankedOptions];
                    const [movedItem] = newOptions.splice(index, 1);
                    newOptions.splice(newRank - 1, 0, movedItem);
                    const updatedOptions = newOptions.map((opt, idx) => ({ ...opt, rank: idx + 1 }));
                    setRankedOptions(updatedOptions);
                  }
                }}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              />
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          className="w-full"
        >
          Υποβολή Κατάταξης
        </Button>
      </div>
    );
  }

  // Free Text Interface
  if (questionType === 'free-text') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Εισάγετε την απάντησή σας</h2>
        <textarea
          value={freeTextAnswer}
          onChange={(e) => setFreeTextAnswer(e.target.value)}
          placeholder="Πληκτρολογήστε την απάντησή σας εδώ..."
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
          disabled={isLoading}
        />
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!freeTextAnswer.trim() || isLoading}
          className="w-full"
        >
          Υποβολή Απάντησης
        </Button>
      </div>
    );
  }

  return null;
}
