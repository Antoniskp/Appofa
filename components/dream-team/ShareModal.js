'use client';

import GenericShareModal from '@/components/ui/ShareModal';

const SHARE_TEXT = 'Δες την ονειρεμένη κυβέρνησή μου στο Appofa! 🏛️';

/**
 * ShareModal — sharing modal for a formation.
 * Thin wrapper around the generic ShareModal component.
 *
 * Props:
 *   formation  – formation object (must have shareSlug or id, and name)
 *   onClose()  – called when modal should be closed
 *   showToast  – optional toast function
 */
export default function ShareModal({ formation, onClose, showToast }) {
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/dream-team/f/${formation.shareSlug || formation.id}`
      : `/dream-team/f/${formation.shareSlug || formation.id}`;

  return (
    <GenericShareModal
      url={shareUrl}
      title={formation.name}
      shareText={SHARE_TEXT}
      onClose={onClose}
      showToast={showToast}
    />
  );
}
