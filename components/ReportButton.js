'use client';

import { useState, useEffect, useRef } from 'react';
import { reportAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const CATEGORIES = [
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'privacy_violation', label: 'Privacy Violation' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'other', label: 'Other' },
];

export default function ReportButton({ contentType, contentId, label = 'Report' }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ category: '', message: '', reporterName: '', reporterEmail: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setSuccess(false);
    setError('');
    setFormData({ category: '', message: '', reporterName: '', reporterEmail: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) { setError('Please select a category.'); return; }
    if (!user && (!formData.reporterName || !formData.reporterEmail)) {
      setError('Name and email are required.'); return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await reportAPI.submit({
        contentType,
        contentId,
        category: formData.category,
        message: formData.message || undefined,
        reporterName: user ? undefined : formData.reporterName,
        reporterEmail: user ? undefined : formData.reporterEmail,
      });
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to submit report.');
      }
    } catch {
      setError('Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
        aria-label={`Report this ${contentType}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        {label}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 id="report-modal-title" className="text-lg font-bold text-gray-900">Report Content</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600" aria-label="Close report dialog">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {success ? (
              <div role="status" className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium">Report submitted</p>
                <p className="text-sm text-gray-500 mt-1">Thank you. Our team will review your report.</p>
                <button onClick={handleClose} className="mt-4 bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {error && (
                  <div role="alert" className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="report-category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="report-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    aria-required="true"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a reason...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="report-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Details (optional)
                  </label>
                  <textarea
                    id="report-message"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the issue..."
                  />
                </div>

                {!user && (
                  <>
                    <div className="mb-3">
                      <label htmlFor="report-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="report-name"
                        value={formData.reporterName}
                        onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                        aria-required="true"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="report-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="report-email"
                        value={formData.reporterEmail}
                        onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                        aria-required="true"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white font-medium py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
