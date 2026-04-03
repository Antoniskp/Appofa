'use client';

import { useEffect, useRef, useState } from 'react';
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Generic ShareModal — reusable sharing modal for any content.
 *
 * Props:
 *   url         – the URL to share (required)
 *   title       – the content title to display in the modal header
 *   shareText   – text to include when sharing on social networks
 *   onClose()   – called when modal should be closed
 *   showToast   – optional toast function; if omitted, copy feedback is shown inline only
 */
export default function ShareModal({ url, title, shareText, onClose, showToast }) {
  const overlayRef = useRef(null);
  const firstFocusRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedText = shareText
    ? encodeURIComponent(`${shareText}\n${shareUrl}`)
    : encodeURIComponent(shareUrl);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedShareText = encodeURIComponent(shareText || '');

  // Focus trap and Escape to close
  useEffect(() => {
    firstFocusRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const focusable = overlayRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      if (showToast) showToast('Ο σύνδεσμος αντιγράφηκε!');
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      if (showToast) showToast('Αδυναμία αντιγραφής', 'error');
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Κοινοποίηση"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        {/* Close button */}
        <button
          ref={firstFocusRef}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Κλείσιμο"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="text-lg font-bold text-gray-900 mb-1">Κοινοποίηση</h2>
        {title && <p className="text-sm text-gray-500 mb-5 truncate">{title}</p>}

        {/* Copy link */}
        <div className="flex gap-2 mb-5">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-600 truncate focus:outline-none"
            onClick={(e) => e.target.select()}
          />
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex-shrink-0 ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                Αντιγράφηκε!
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-4 w-4" />
                Αντιγραφή
              </>
            )}
          </button>
        </div>

        {/* Social share buttons */}
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Κοινοποίηση σε</p>
        <div className="flex gap-2 mb-6">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </a>

          {/* Twitter/X */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white bg-black transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.745l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X / Twitter
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1877F2' }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </a>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">QR Code</p>
          <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
            <QRCodeSVG value={shareUrl} size={140} level="M" />
          </div>
          <p className="text-xs text-gray-400">Σκανάρετε για γρήγορη πρόσβαση</p>
        </div>
      </div>
    </div>
  );
}
