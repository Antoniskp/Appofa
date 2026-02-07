/**
 * Poll session management for unauthenticated users
 */

/**
 * Generate and retrieve session ID for unauthenticated poll voting
 */
export const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  
  let sessionId = localStorage.getItem('poll_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('poll_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Clear session ID (for logout or reset)
 */
export const clearSessionId = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('poll_session_id');
  }
};

/**
 * Check if user has voted on a poll (stored in localStorage)
 */
export const hasVotedOnPoll = (pollId) => {
  if (typeof window === 'undefined') return false;
  
  const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
  return votedPolls[pollId] !== undefined;
};

/**
 * Mark poll as voted
 */
export const markPollAsVoted = (pollId, voteData) => {
  if (typeof window === 'undefined') return;
  
  const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
  votedPolls[pollId] = {
    votedAt: new Date().toISOString(),
    ...voteData
  };
  localStorage.setItem('voted_polls', JSON.stringify(votedPolls));
};

/**
 * Get user's vote for a specific poll
 */
export const getUserVote = (pollId) => {
  if (typeof window === 'undefined') return null;
  
  const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '{}');
  return votedPolls[pollId] || null;
};
