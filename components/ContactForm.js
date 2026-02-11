'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import FormInput from '@/components/FormInput';
import LocationSelector from '@/components/LocationSelector';
import { messageAPI } from '@/lib/api';

export default function ContactForm({ 
  type = 'contact',
  showLocationSelector = false,
  onSuccess,
  submitButtonText = 'Αποστολή Μηνύματος'
}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type,
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email: user?.email || '',
    subject: '',
    message: '',
    locationId: null,
    metadata: {}
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await messageAPI.create(formData);
      if (response.success) {
        setSuccess(true);
        setFormData({
          type,
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
          email: user?.email || '',
          subject: '',
          message: '',
          locationId: null,
          metadata: {}
        });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Αποτυχία αποστολής μηνύματος');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">✗ {error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✓ Το μήνυμά σας εστάλη επιτυχώς!</p>
          <p className="text-green-700 text-sm mt-1">Θα επικοινωνήσουμε μαζί σας σύντομα.</p>
        </div>
      )}

      {!user && (
        <>
          <FormInput
            name="name"
            label="Όνομα"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Το όνομά σας"
          />

          <FormInput
            name="email"
            type="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="email@example.com"
          />
        </>
      )}

      <FormInput
        name="subject"
        label="Θέμα"
        value={formData.subject}
        onChange={handleChange}
        required
        maxLength={200}
        showCharCount
        placeholder="Θέμα μηνύματος"
      />

      {showLocationSelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Περιοχή (για αίτηση moderator) <span className="text-red-600" aria-label="required">*</span>
          </label>
          <LocationSelector
            value={formData.locationId}
            onChange={(locationId) => setFormData(prev => ({ ...prev, locationId }))}
            placeholder="Επιλέξτε την περιοχή που θέλετε να διαχειριστείτε"
          />
        </div>
      )}

      <FormInput
        name="message"
        type="textarea"
        label="Μήνυμα"
        rows={8}
        value={formData.message}
        onChange={handleChange}
        required
        maxLength={5000}
        showCharCount
        placeholder="Γράψτε το μήνυμά σας εδώ..."
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Αποστολή...' : submitButtonText}
      </button>
    </form>
  );
}
