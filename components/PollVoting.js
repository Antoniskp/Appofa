'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircleIcon, LinkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { pollAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import AlertMessage from '@/components/AlertMessage';

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
      {success && <AlertMessage message={success} type="success" />}
      
      {/* Show message and add option UI if poll allows user contributions */}
      {poll.allowUserContributions && poll.options.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4" role="status">
          <p className="text-blue-800 mb-2">
            Αυτή η δημοσκόπηση επιτρέπει σε χρήστες να προσθέσουν επιλογές. Προσθέστε την πρώτη επιλογή για να ξεκινήσετε!
          </p>
        </div>
      )}
      
      {/* Add Option Form */}
      {poll.allowUserContributions && user && (
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
                    <input
                      type="url"
                      value={newOptionPhotoUrl}
                      onChange={(e) => setNewOptionPhotoUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
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
      
      {/* Show options and voting button only if there are options */}
      {poll.options.length > 0 && (
        <>
          {poll.type === 'simple' ? (
            // Simple poll - radio buttons
            <div className="space-y-3">
              {poll.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                    selectedOptionId === option.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="poll-option"
                    value={option.id}
                    checked={selectedOptionId === option.id}
                    onChange={() => setSelectedOptionId(option.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-900 font-medium">{option.text}</span>
                  {selectedOptionId === option.id && (
                    <CheckCircleIcon className="h-5 w-5 text-blue-600 ml-auto" />
                  )}
                </label>
              ))}
            </div>
          ) : (
            // Complex poll - cards with images/links
            <ComplexPollOptions 
              options={poll.options}
              selectedOptionId={selectedOptionId}
              setSelectedOptionId={setSelectedOptionId}
            />
          )}
          
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
        </>
      )}
    </div>
  );
}

/**
 * Complex poll option component with image handling
 */
function ComplexPollOptions({ options, selectedOptionId, setSelectedOptionId }) {
  const [imageErrors, setImageErrors] = useState({});
  
  const handleImageError = (optionId) => {
    setImageErrors(prev => ({ ...prev, [optionId]: true }));
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((option) => (
        <div
          key={option.id}
          onClick={() => setSelectedOptionId(option.id)}
          className={`border rounded-lg overflow-hidden cursor-pointer transition ${
            selectedOptionId === option.id
              ? 'border-blue-600 ring-2 ring-blue-600'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          {option.photoUrl && !imageErrors[option.id] ? (
            <div className="relative h-48 bg-gray-100">
              <Image
                src={option.photoUrl}
                alt={option.text}
                fill
                className="object-cover"
                onError={() => handleImageError(option.id)}
              />
            </div>
          ) : option.photoUrl ? (
            <div className="flex items-center justify-center h-48 bg-gray-100">
              <PhotoIcon className="h-12 w-12 text-gray-400" />
            </div>
          ) : null}
          
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">{option.text}</h4>
                
                {option.displayText && (
                  <p className="text-sm text-gray-600 mb-2">{option.displayText}</p>
                )}
                
                {option.linkUrl && (
                  <a
                    href={option.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LinkIcon className="h-4 w-4" />
                    Περισσότερες πληροφορίες
                  </a>
                )}
              </div>
              
              {selectedOptionId === option.id && (
                <CheckCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
