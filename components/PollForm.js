'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import AlertMessage from '@/components/AlertMessage';
import FormInput from '@/components/FormInput';
import FormSelect from '@/components/FormSelect';
import CascadingLocationSelector from '@/components/CascadingLocationSelector';
import Tooltip from '@/components/Tooltip';

/**
 * Unified poll form for create and edit modes
 * @param {Object} poll - Existing poll data (for edit mode)
 * @param {Function} onSubmit - Submit handler
 * @param {Function} onCancel - Cancel handler
 * @param {boolean} isSubmitting - Loading state
 * @param {string} submitError - Error message
 * @param {string} mode - 'create' or 'edit'
 */
export default function PollForm({
  poll = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = '',
  mode = 'create'
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'simple',
    visibility: 'public',
    resultsVisibility: 'after_vote',
    allowUserContributions: false,
    allowUnauthenticatedVotes: false,
    deadline: '',
    locationId: null,
  });

  const [options, setOptions] = useState([
    { text: '', photoUrl: '', linkUrl: '', displayText: '', answerType: 'text' },
    { text: '', photoUrl: '', linkUrl: '', displayText: '', answerType: 'text' },
  ]);

  // Initialize form data from poll prop (edit mode)
  useEffect(() => {
    if (poll) {
      setFormData({
        title: poll.title || '',
        description: poll.description || '',
        type: poll.type || 'simple',
        visibility: poll.visibility || 'public',
        resultsVisibility: poll.resultsVisibility || 'after_vote',
        allowUserContributions: Boolean(poll.allowUserContributions),
        allowUnauthenticatedVotes: Boolean(poll.allowUnauthenticatedVotes),
        deadline: poll.deadline ? new Date(poll.deadline).toISOString().slice(0, 16) : '',
        locationId: poll.locationId || null,
      });

      if (poll.options && poll.options.length > 0) {
        setOptions(poll.options.map(opt => ({
          text: opt.text || '',
          photoUrl: opt.photoUrl || '',
          linkUrl: opt.linkUrl || '',
          displayText: opt.displayText || '',
          answerType: opt.answerType || 'text',
        })));
      }
    }
  }, [poll]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleOptionChange = (index, field, value) => {
    setOptions(prev => {
      const newOptions = [...prev];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return newOptions;
    });
  };

  const handleAddOption = () => {
    setOptions(prev => [...prev, {
      text: '',
      photoUrl: '',
      linkUrl: '',
      displayText: '',
      answerType: 'text'
    }]);
  };

  const handleRemoveOption = (index) => {
    // Allow removing all options if user contributions are enabled
    const minOptions = formData.allowUserContributions ? 0 : 2;
    if (options.length > minOptions) {
      setOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty options
    const validOptions = options.filter(opt => opt.text.trim() !== '');
    
    // Require at least 2 options unless user contributions are allowed
    const minOptions = formData.allowUserContributions ? 0 : 2;
    if (validOptions.length < minOptions) {
      const optionWord = minOptions === 1 ? 'επιλογή' : 'επιλογές';
      alert(`Πρέπει να προσθέσετε τουλάχιστον ${minOptions} ${optionWord}`);
      return;
    }
    
    const payload = {
      ...formData,
      options: validOptions,
      deadline: formData.deadline || null,
    };
    
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AlertMessage className="mb-6" message={submitError} />

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Βασικές Πληροφορίες</h3>
        
        <FormInput
          name="title"
          label="Τίτλος"
          value={formData.title}
          onChange={handleInputChange}
          required
          maxLength={200}
          showCharCount
          placeholder="Εισαγάγετε τον τίτλο της δημοσκόπησης"
          helpText="Ένας σαφής, περιγραφικός τίτλος για τη δημοσκόπηση"
        />

        <FormInput
          name="description"
          type="textarea"
          label="Περιγραφή"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          maxLength={1000}
          showCharCount
          placeholder="Προσθέστε μια περιγραφή (προαιρετικό)"
        />
      </div>

      {/* Poll Type and Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Ρυθμίσεις Δημοσκόπησης</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Τύπος Δημοσκόπησης
              </label>
              <Tooltip content="Απλή: Απλές επιλογές κειμένου. Σύνθετη: Επιλογές με εικόνες και συνδέσμους.">
                <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
              </Tooltip>
            </div>
            <FormSelect
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              options={[
                { value: 'simple', label: 'Απλή' },
                { value: 'complex', label: 'Σύνθετη' },
              ]}
            />
          </div>

          <FormSelect
            name="visibility"
            label="Ορατότητα"
            value={formData.visibility}
            onChange={handleInputChange}
            required
            options={[
              { value: 'public', label: 'Δημόσια' },
              { value: 'locals_only', label: 'Μόνο Τοπικοί' },
              { value: 'private', label: 'Μόνο Συνδεδεμένοι' },
            ]}
          />

          <FormSelect
            name="resultsVisibility"
            label="Εμφάνιση Αποτελεσμάτων"
            value={formData.resultsVisibility}
            onChange={handleInputChange}
            required
            options={[
              { value: 'after_vote', label: 'Μετά την Ψηφοφορία' },
              { value: 'after_deadline', label: 'Μετά την Προθεσμία' },
              { value: 'always', label: 'Πάντα' },
            ]}
          />

          <FormInput
            name="deadline"
            type="datetime-local"
            label="Προθεσμία (Προαιρετικό)"
            value={formData.deadline}
            onChange={handleInputChange}
            helpText="Η δημοσκόπηση θα κλείσει αυτόματα σε αυτή την ημερομηνία"
          />
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="allowUserContributions"
              checked={formData.allowUserContributions}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Επιτρέπεται η προσθήκη επιλογών από χρήστες
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="allowUnauthenticatedVotes"
              checked={formData.allowUnauthenticatedVotes}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Επιτρέπεται ψηφοφορία χωρίς σύνδεση
            </span>
          </label>
        </div>

        {formData.visibility === 'locals_only' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Τοποθεσία
            </label>
            <CascadingLocationSelector
              value={formData.locationId}
              onChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}
              placeholder="Επιλέξτε τοποθεσία"
              allowClear={true}
            />
          </div>
        )}
      </div>

      {/* Poll Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Επιλογές Δημοσκόπησης</h3>
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Προσθήκη Επιλογής
          </button>
        </div>

        <div className="space-y-4">
          {options.map((option, index) => (
            <div key={index} className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">Επιλογή {index + 1}</h4>
                {(options.length > 2 || (formData.allowUserContributions && options.length > 0)) && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              <FormInput
                name={`option-text-${index}`}
                label="Κείμενο"
                value={option.text}
                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                required
                placeholder="Εισαγάγετε το κείμενο της επιλογής"
              />

              {formData.type === 'complex' && (
                <>
                  <FormInput
                    name={`option-displayText-${index}`}
                    label="Περιγραφή (Προαιρετικό)"
                    value={option.displayText}
                    onChange={(e) => handleOptionChange(index, 'displayText', e.target.value)}
                    placeholder="Πρόσθετες πληροφορίες"
                  />

                  <FormInput
                    name={`option-photoUrl-${index}`}
                    label="URL Εικόνας (Προαιρετικό)"
                    value={option.photoUrl}
                    onChange={(e) => handleOptionChange(index, 'photoUrl', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />

                  <FormInput
                    name={`option-linkUrl-${index}`}
                    label="URL Συνδέσμου (Προαιρετικό)"
                    value={option.linkUrl}
                    onChange={(e) => handleOptionChange(index, 'linkUrl', e.target.value)}
                    placeholder="https://example.com/more-info"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
        >
          {isSubmitting
            ? (mode === 'edit' ? 'Αποθήκευση...' : 'Δημιουργία...')
            : (mode === 'edit' ? 'Αποθήκευση Αλλαγών' : 'Δημιουργία Δημοσκόπησης')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-medium"
        >
          Ακύρωση
        </button>
      </div>
    </form>
  );
}
