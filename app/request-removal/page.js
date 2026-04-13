'use client';

import { useState, useEffect } from 'react';
import { personRemovalRequestAPI, personAPI } from '@/lib/api';

export default function RequestRemovalPage() {
  const [persons, setPersons] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    requesterName: '',
    requesterEmail: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    personAPI.getAll({ limit: 500 }).then((res) => {
      if (res.success) setPersons(res.data?.profiles || []);
    });
  }, []);

  const validate = () => {
    const errors = {};
    if (!formData.userId) errors.userId = 'Please select a person.';
    if (!formData.requesterName.trim()) errors.requesterName = 'Full name is required.';
    if (!formData.requesterEmail.trim()) errors.requesterEmail = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.requesterEmail)) errors.requesterEmail = 'Invalid email address.';
    if (!formData.message.trim()) errors.message = 'Please provide a reason.';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setLoading(true);
    setError('');
    try {
      const res = await personRemovalRequestAPI.submit({
        ...formData,
        userId: parseInt(formData.userId),
      });
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted</h2>
          <p className="text-gray-600">
            Your removal request has been received. Our team will review it and contact you at the provided email address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Profile Removal</h1>
          <p className="text-gray-600 mb-6">
            If you are a public person listed on this platform and wish to be removed, please fill out the form below.
          </p>

          {error && (
            <div role="alert" className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                Your Profile <span className="text-red-500">*</span>
              </label>
              <select
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                aria-required="true"
                aria-invalid={!!fieldErrors.userId}
                aria-describedby={fieldErrors.userId ? 'person-error' : undefined}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.userId ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select a person...</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstNameNative} {p.lastNameNative}
                  </option>
                ))}
              </select>
              {fieldErrors.userId && (
                <p id="person-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.userId}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="requesterName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="requesterName"
                name="requesterName"
                value={formData.requesterName}
                onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                aria-required="true"
                aria-invalid={!!fieldErrors.requesterName}
                aria-describedby={fieldErrors.requesterName ? 'name-error' : undefined}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.requesterName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Your full name"
              />
              {fieldErrors.requesterName && (
                <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.requesterName}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="requesterEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="requesterEmail"
                name="requesterEmail"
                value={formData.requesterEmail}
                onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                aria-required="true"
                aria-invalid={!!fieldErrors.requesterEmail}
                aria-describedby={fieldErrors.requesterEmail ? 'email-error' : undefined}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.requesterEmail ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="your@email.com"
              />
              {fieldErrors.requesterEmail && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.requesterEmail}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Removal <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                aria-required="true"
                aria-invalid={!!fieldErrors.message}
                aria-describedby={fieldErrors.message ? 'message-error' : undefined}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.message ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Please explain why you want to be removed from the platform..."
              />
              {fieldErrors.message && (
                <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">{fieldErrors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Removal Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
