export const CLOSING_SOON_MS = 72 * 60 * 60 * 1000;

export function getCivicQuestionLifecycleStatus(civicQuestion, nowTs = Date.now()) {
  if (!civicQuestion) return 'closed';

  if (civicQuestion.status === 'archived') return 'archived';

  const hasDeadline = Boolean(civicQuestion.deadline);
  const deadlineTs = hasDeadline ? new Date(civicQuestion.deadline).getTime() : null;
  const deadlinePassed = hasDeadline && Number.isFinite(deadlineTs) && deadlineTs <= nowTs;

  if (civicQuestion.status === 'closed' || deadlinePassed) return 'closed';

  if (civicQuestion.status === 'open' && hasDeadline && Number.isFinite(deadlineTs) && deadlineTs - nowTs <= CLOSING_SOON_MS) {
    return 'closing_soon';
  }

  return 'open';
}

export function getCivicQuestionStatusBadgeVariant(status) {
  switch (status) {
    case 'open':
      return 'success';
    case 'closing_soon':
      return 'warning';
    case 'archived':
      return 'danger';
    default:
      return 'default';
  }
}
