'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircleIcon, LinkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { pollAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import AlertMessage from '@/components/ui/AlertMessage';

/**
 * Poll voting interface component
 * @param {Object} poll - Poll object with options and settings
 * @param {Function} onVoteSuccess - Callback after successful vote
 */
export default function PollVoting({ poll, onVoteSuccess }) {
  const { user } = useAuth();
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  
  // State for adding new options
  const [showAddOption, setShowAddOption] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const [newOptionPhotoUrl, setNewOptionPhotoUrl] = useState('');
  const [newOptionLinkUrl, setNewOptionLinkUrl] = useState('');
  const [newOptionDisplayText, setNewOptionDisplayText] = useState('');
  const [newOptionImageError, setNewOptionImageError] = useState(false);
  
  useEffect(() => {
    // Check if user has already voted
    if (poll.userVote) {
      setHasVoted(true);
      setUserVote(poll.userVote);
      setSelectedOptionId(poll.userVote.optionId);
    }
  }, [poll]);
  
  const isPollActive = poll.status === 'active' && (!poll.deadline || new Date(poll.deadline) > new Date());
  const canVote = isPollActive && (user || poll.allowUnauthenticatedVotes);
  
  const resetAddOptionForm = () => {
    setNewOptionText('');
    setNewOptionPhotoUrl('');
    setNewOptionLinkUrl('');
    setNewOptionDisplayText('');
    setShowAddOption(false);
    setNewOptionImageError(false);
  };

  const handleAddOption = async () => {
    if (!newOptionText.trim()) {
      setError('Παρακαλώ εισάγετε κείμενο για την επιλογή');
      return;
    }
    
    setIsAddingOption(true);
    setError('');
    setSuccess('');
    
    try {
      const optionData = poll.type === 'simple' 
        ? { text: newOptionText }
        : {
            text: newOptionText,
            photoUrl: newOptionPhotoUrl || null,
            linkUrl: newOptionLinkUrl || null,
            displayText: newOptionDisplayText || null,
            answerType: 'custom'
          };
      
      const response = await pollAPI.addOption(poll.id, optionData);
      if (response.success) {
        setSuccess('Η επιλογή προστέθηκε επιτυχώς!');
        resetAddOptionForm();
        
        // Refresh poll data to show the new option
        if (onVoteSuccess) {
          onVoteSuccess();
        }
      }
    } catch (err) {
      setError(err.message || 'Σφάλμα κατά την προσθήκη της επιλογής');
    } finally {
      setIsAddingOption(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedOptionId) {
      setError('Παρακαλώ επιλέξτε μια επιλογή');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await pollAPI.vote(poll.id, selectedOptionId);
      if (response.success) {
        setSuccess(hasVoted ? 'Η ψήφος σας ενημερώθηκε επιτυχώς!' : 'Η ψήφος σας καταχωρήθηκε επιτυχώς!');
        setHasVoted(true);
        setUserVote({ optionId: selectedOptionId });
        
        // Call success callback to refresh poll data
        if (onVoteSuccess) {
          setTimeout(() => onVoteSuccess(), 1000);
        }
      }
    } catch (err) {
      setError(err.message || 'Σφάλμα κατά την υποβολή της ψήφου');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!canVote) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">
          {!isPollActive
            ? 'Αυτή η δημοσκόπηση έχει κλείσει ή έληξε.'
            : !user && !poll.allowUnauthenticatedVotes
            ? 'Πρέπει να συνδεθείτε για να ψηφίσετε.'
            : 'Δεν μπορείτε να ψηφίσετε σε αυτή τη δημοσκόπηση.'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {error && <AlertMessage message={error} />}
      {success && <AlertMessage message={success} tone="success" />}
      
      {/* Show message if poll allows user contributions but has no options */}
      {poll.allowUserContributions && poll.options.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4" role="status">
          <p className="text-blue-800 mb-2">
            Αυτή η δημοσκόπηση επιτρέπει σε χρήστες να προσθέσουν επιλογές. Προσθέστε την πρώτη επιλογή για να ξεκινήσετε!
          </p>
        </div>
      )}
      
      {/* Show options and voting button only if there are options */}
      {poll.options.length > 0 && (
        <>
          {poll.type === 'binary' ? (
            // Binary poll — two prominent buttons, submit on click
            <BinaryPollOptions
              options={poll.options}
              selectedOptionId={selectedOptionId}
              isSubmitting={isSubmitting}
              hasVoted={hasVoted}
              useCustomColors={poll.useCustomColors}
              onSelect={async (optionId) => {
                setSelectedOptionId(optionId);
                setIsSubmitting(true);
                setError('');
                setSuccess('');
                try {
                  const response = await pollAPI.vote(poll.id, optionId);
                  if (response.success) {
                    setSuccess(hasVoted ? 'Η ψήφος σας ενημερώθηκε επιτυχώς!' : 'Η ψήφος σας καταχωρήθηκε επιτυχώς!');
                    setHasVoted(true);
                    setUserVote({ optionId });
                    if (onVoteSuccess) {
                      setTimeout(() => onVoteSuccess(), 1000);
                    }
                  }
                } catch (err) {
                  setError(err.message || 'Σφάλμα κατά την υποβολή της ψήφου');
                } finally {
                  setIsSubmitting(false);
                }
              }}
            />
          ) : poll.type === 'simple' ? (
            // Simple poll - radio buttons
            <div className="space-y-3">
              {poll.options.map((option) => {
                const color = (poll.useCustomColors && option.color) ? option.color : null;
                const isSelected = selectedOptionId === option.id;
                const labelClassName = `flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  !color
                    ? isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`;
                const labelStyle = (color && isSelected)
                  ? { borderColor: color, backgroundColor: hexWithLowOpacity(color) }
                  : undefined;
                const checkIconClassName = color
                  ? 'h-5 w-5 ml-auto'
                  : 'h-5 w-5 text-blue-600 ml-auto';
                return (
                  <label
                    key={option.id}
                    className={labelClassName}
                    style={labelStyle}
                  >
                    <input
                      type="radio"
                      name="poll-option"
                      value={option.id}
                      checked={isSelected}
                      onChange={() => setSelectedOptionId(option.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      style={color ? { accentColor: color } : undefined}
                    />
                    <span className="ml-3 text-gray-900 font-medium">{option.text}</span>
                    {isSelected && (
                      <CheckCircleIcon
                        className={checkIconClassName}
                        style={color ? { color } : undefined}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            // Complex poll - cards with images/links
            <ComplexPollOptions 
              options={poll.options}
              selectedOptionId={selectedOptionId}
              setSelectedOptionId={setSelectedOptionId}
              useCustomColors={poll.useCustomColors}
            />
          )}
          
          {poll.type !== 'binary' && (
          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleSubmitVote}
              disabled={isSubmitting || !selectedOptionId}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Υποβολή...' : hasVoted ? 'Ενημέρωση Ψήφου' : 'Υποβολή Ψήφου'}
            </button>
            
            {hasVoted && (
              <p className="text-sm text-gray-600">
                Έχετε ήδη ψηφίσει. Μπορείτε να αλλάξετε την ψήφο σας.
              </p>
            )}
          </div>
          )}
        </>
      )}
      
      {/* Add Option Form — hidden for binary polls */}
      {poll.allowUserContributions && user && poll.type !== 'binary' && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {!showAddOption ? (
            <button
              onClick={() => setShowAddOption(true)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              + Προσθήκη Νέας Επιλογής
            </button>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Προσθήκη Νέας Επιλογής</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Κείμενο Επιλογής *
                </label>
                <input
                  type="text"
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Εισάγετε το κείμενο της επιλογής"
                />
              </div>
              
              {poll.type === 'complex' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Περιγραφή
                    </label>
                    <input
                      type="text"
                      value={newOptionDisplayText}
                      onChange={(e) => setNewOptionDisplayText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Προαιρετική περιγραφή"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Φωτογραφίας
                    </label>
                    <div className="flex items-start gap-3">
                      {/* Image preview thumbnail */}
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 border border-gray-300 rounded-md overflow-hidden flex items-center justify-center">
                        {newOptionPhotoUrl && !newOptionImageError ? (
                          <Image
                            src={newOptionPhotoUrl}
                            alt="Preview"
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                            onError={() => setNewOptionImageError(true)}
                            onLoad={() => setNewOptionImageError(false)}
                          />
                        ) : newOptionPhotoUrl && newOptionImageError ? (
                          <PhotoIcon className="h-8 w-8 text-gray-400" />
                        ) : (
                          <PhotoIcon className="h-8 w-8 text-gray-300" />
                        )}
                      </div>
                      
                      {/* URL input */}
                      <div className="flex-1">
                        <input
                          type="url"
                          value={newOptionPhotoUrl}
                          onChange={(e) => setNewOptionPhotoUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://example.com/image.png"
                        />
                        {newOptionPhotoUrl && newOptionImageError && (
                          <p className="mt-1 text-xs text-red-600">
                            Δεν ήταν δυνατή η φόρτωση της εικόνας
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Υποστηρίζονται: JPG, JPEG, PNG, WebP, GIF, AVIF
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Συνδέσμου
                    </label>
                    <input
                      type="url"
                      value={newOptionLinkUrl}
                      onChange={(e) => setNewOptionLinkUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={handleAddOption}
                  disabled={isAddingOption || !newOptionText.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isAddingOption ? 'Προσθήκη...' : 'Προσθήκη Επιλογής'}
                </button>
                <button
                  onClick={resetAddOptionForm}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm font-medium"
                >
                  Ακύρωση
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Returns an inline background colour for a selection highlight, with ~9% opacity.
 * Accepts a 6-digit hex string (e.g. '#3b82f6') and returns an 8-digit hex string.
 */
function hexWithLowOpacity(hex) {
  return hex + '18';
}

/**
 * Binary poll voting component — two large side-by-side buttons.
 * Submits the vote immediately on click (single-click vote).
 */
function BinaryPollOptions({ options, selectedOptionId, isSubmitting, hasVoted, onSelect, useCustomColors }) {
  if (!options || options.length < 2) return null;
  const [yesOpt, noOpt] = [options[0], options[1]];

  const btnBase =
    'flex-1 flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 text-lg font-bold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed';

  const yesColor = (useCustomColors && yesOpt.color) ? yesOpt.color : null;
  const noColor = (useCustomColors && noOpt.color) ? noOpt.color : null;

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => onSelect(yesOpt.id)}
        className={`${btnBase} ${
          !yesColor
            ? selectedOptionId === yesOpt.id
              ? 'bg-green-500 border-green-500 text-white shadow-lg focus:ring-green-300'
              : 'bg-white border-green-500 text-green-600 hover:bg-green-50 focus:ring-green-300'
            : ''
        }`}
        style={yesColor ? (
          selectedOptionId === yesOpt.id
            ? { backgroundColor: yesColor, borderColor: yesColor, color: '#fff' }
            : { backgroundColor: '#fff', borderColor: yesColor, color: yesColor }
        ) : undefined}
      >
        {selectedOptionId === yesOpt.id && <CheckCircleIcon className="h-7 w-7" />}
        {yesOpt.text}
      </button>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => onSelect(noOpt.id)}
        className={`${btnBase} ${
          !noColor
            ? selectedOptionId === noOpt.id
              ? 'bg-red-500 border-red-500 text-white shadow-lg focus:ring-red-300'
              : 'bg-white border-red-500 text-red-600 hover:bg-red-50 focus:ring-red-300'
            : ''
        }`}
        style={noColor ? (
          selectedOptionId === noOpt.id
            ? { backgroundColor: noColor, borderColor: noColor, color: '#fff' }
            : { backgroundColor: '#fff', borderColor: noColor, color: noColor }
        ) : undefined}
      >
        {selectedOptionId === noOpt.id && <CheckCircleIcon className="h-7 w-7" />}
        {noOpt.text}
      </button>
    </div>
  );
}

/**
 * Complex poll option component with image handling.
 * Renders options as a vertical list with a small thumbnail and text in a row.
 */
function ComplexPollOptions({ options, selectedOptionId, setSelectedOptionId, useCustomColors }) {
  const [imageErrors, setImageErrors] = useState({});
  
  const handleImageError = (optionId) => {
    setImageErrors(prev => ({ ...prev, [optionId]: true }));
  };
  
  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => {
        const color = (useCustomColors && option.color) ? option.color : null;
        const isSelected = selectedOptionId === option.id;
        const cardClassName = `flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition ${
          !color
            ? isSelected
              ? 'border-blue-600 ring-2 ring-blue-600 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            : 'border-gray-300 hover:bg-gray-50'
        }`;
        const cardStyle = (color && isSelected)
          ? { borderColor: color, backgroundColor: hexWithLowOpacity(color), boxShadow: `0 0 0 2px ${color}` }
          : undefined;
        const checkIconClassName = color
          ? 'h-6 w-6 flex-shrink-0'
          : 'h-6 w-6 text-blue-600 flex-shrink-0';
        return (
          <div
            key={option.id}
            onClick={() => setSelectedOptionId(option.id)}
            className={cardClassName}
            style={cardStyle}
          >
            {/* Thumbnail */}
            {option.photoUrl ? (
              !imageErrors[option.id] ? (
                <div className="relative flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={option.photoUrl}
                    alt={option.text}
                    fill
                    className="object-cover"
                    onError={() => handleImageError(option.id)}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                  <PhotoIcon className="h-7 w-7 text-gray-400" />
                </div>
              )
            ) : null}

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{option.text}</h4>

              {option.displayText && (
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{option.displayText}</p>
              )}

              {option.linkUrl && (
                <a
                  href={option.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LinkIcon className="h-4 w-4 flex-shrink-0" />
                  Περισσότερες πληροφορίες
                </a>
              )}
            </div>

            {/* Selection indicator */}
            {isSelected && (
              <CheckCircleIcon
                className={checkIconClassName}
                style={color ? { color } : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
