/**
 * Remembers a poll choice made before signing in, so it can be submitted
 * automatically afterwards — including after the round trip to Google.
 * Kept in sessionStorage: it survives navigation in this tab only and expires
 * after 30 minutes, so a stale choice is never cast by surprise later.
 */

const STORAGE_KEY = 'appofa_pending_vote';
const MAX_AGE_MS = 30 * 60 * 1000;

export function savePendingVote({ pollId, optionId, identityVisibility = 'anonymous' }) {
  if (typeof window === 'undefined' || !pollId || !optionId) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      pollId: String(pollId),
      optionId: Number(optionId),
      identityVisibility,
      savedAt: Date.now(),
    }));
  } catch {
    // Storage blocked: the person can still vote again after signing in.
  }
}

export function clearPendingVote() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Returns and removes the pending vote for this poll, or null.
 */
export function takePendingVote(pollId) {
  if (typeof window === 'undefined' || !pollId) return null;
  let pending = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
  if (!pending || pending.pollId !== String(pollId)) return null;
  clearPendingVote();
  if (!Number.isInteger(pending.optionId) || Date.now() - Number(pending.savedAt) > MAX_AGE_MS) return null;
  return pending;
}
