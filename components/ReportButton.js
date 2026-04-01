'use client';

import { useState } from 'react';
import { reportAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Modal from '@/components/Modal';

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

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Report Content"
        size="sm"
        footer={
          !success && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="report-form"
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </>
          )
        }
      >
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
          <form id="report-form" onSubmit={handleSubmit} noValidate>
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
          </form>
        )}
      </Modal>
    </>
  );
}
