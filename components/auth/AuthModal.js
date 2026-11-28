'use client';

import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import { getCurrentRelativePath } from '@/lib/auth-redirect';
import QuickSignIn from './QuickSignIn';

/**
 * Sign-in / sign-up over the current page, so people never lose their place.
 * Google sign-in leaves the page and comes back to it; email-code sign-in stays here.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {(result: { isNewUser: boolean, claimedVotes: number }) => void} onSuccess
 * @param {string} title
 * @param {string} description
 */
export default function AuthModal({ isOpen, onClose, onSuccess, title, description }) {
  const t = useTranslations('auth');
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t('quick_title')} size="sm">
      <div className="space-y-4">
        <p className="text-sm leading-6 text-gray-700">{description || t('quick_subtitle')}</p>
        <QuickSignIn onSuccess={onSuccess} returnTo={getCurrentRelativePath()} autoFocus />
      </div>
    </Modal>
  );
}
