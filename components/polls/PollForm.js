'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlusIcon, TrashIcon, InformationCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import AlertMessage from '@/components/ui/AlertMessage';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import CascadingLocationSelector from '@/components/ui/CascadingLocationSelector';
import TagInput from '@/components/ui/TagInput';
import Tooltip from '@/components/ui/Tooltip';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { tagAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';

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
  onDelete,
  isSubmitting = false,
  submitError = '',
  mode = 'create'
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [],
    type: 'simple',
    binaryStyle: 'yes_no',
    visibility: 'public',
    resultsVisibility: 'after_vote',
    allowUserContributions: false,
    allowUnauthenticatedVotes: false,
    deadline: '',
    locationId: null,
    hideCreator: false,
    commentsEnabled: true,
    commentsLocked: false,
    useCustomColors: false,
    binaryColors: ['#16a34a', '#dc2626'],
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [options, setOptions] = useState([
    { text: '', photoUrl: '', linkUrl: '', displayText: '', answerType: 'custom', color: '#3b82f6' },
    { text: '', photoUrl: '', linkUrl: '', displayText: '', answerType: 'custom', color: '#10b981' },
  ]);

  const [imageErrors, setImageErrors] = useState({});
  const [tagSuggestions, setTagSuggestions] = useState([]);

  // Initialize form data from poll prop (edit mode)
  useEffect(() => {
    if (poll) {
      setFormData({
        title: poll.title || '',
        description: poll.description || '',
        category: poll.category || '',
        tags: Array.isArray(poll.tags) ? poll.tags : [],
        type: poll.type || 'simple',
        binaryStyle: 'yes_no',
        visibility: poll.visibility || 'public',
        resultsVisibility: poll.resultsVisibility || 'after_vote',
        allowUserContributions: Boolean(poll.allowUserContributions),
        allowUnauthenticatedVotes: Boolean(poll.allowUnauthenticatedVotes),
        deadline: poll.deadline ? new Date(poll.deadline).toISOString().slice(0, 16) : '',
        locationId: poll.locationId || null,
        hideCreator: Boolean(poll.hideCreator),
        commentsEnabled: poll.commentsEnabled !== false,
        commentsLocked: Boolean(poll.commentsLocked),
        useCustomColors: Boolean(poll.useCustomColors),
        binaryColors: poll.useCustomColors && poll.options && poll.options.length >= 2
          ? [poll.options[0].color || '#16a34a', poll.options[1].color || '#dc2626']
          : ['#16a34a', '#dc2626'],
      });

      if (poll.options && poll.options.length > 0) {
        setOptions(poll.options.map(opt => ({
          id: opt.id,
          text: opt.text || '',
          photoUrl: opt.photoUrl || '',
          linkUrl: opt.linkUrl || '',
          displayText: opt.displayText || '',
          answerType: opt.answerType || 'custom',
          color: opt.color || '#3b82f6',
        })));
      }
    }
  }, [poll]);

  // Fetch existing tag suggestions for autocomplete
  useEffect(() => {
    tagAPI.getSuggestions()
      .then((data) => {
        if (data?.tags) setTagSuggestions(data.tags.map((t) => t.name || t));
      })
      .catch(() => {});
  }, []);

  const DEFAULT_PALETTE = ['#3b82f6', '#10b981', '#fb923c', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#ef4444'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'useCustomColors' && type === 'checkbox' && checked) {
      // Pre-fill colours with smart defaults when first enabling
      setOptions(prev => prev.map((opt, i) => ({
        ...opt,
        color: opt.color || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
      })));
      setFormData((prev) => ({
        ...prev,
        useCustomColors: true,
        binaryColors: [prev.binaryColors[0] || '#16a34a', prev.binaryColors[1] || '#dc2626'],
      }));
      return;
    }
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
    const nextColor = DEFAULT_PALETTE[options.length % DEFAULT_PALETTE.length];
    setOptions(prev => [...prev, {
      text: '',
      photoUrl: '',
      linkUrl: '',
      displayText: '',
      answerType: 'custom',
      color: nextColor,
    }]);
  };

  const handleRemoveOption = (index) => {
    // Allow removing all options if user contributions are enabled
    const minOptions = formData.allowUserContributions ? 0 : 2;
    if (options.length > minOptions) {
      setOptions(prev => prev.filter((_, i) => i !== index));
      // Reindex error states after removal
      setImageErrors(prev => {
        const newErrors = {};
        Object.keys(prev).forEach(key => {
          const keyIndex = parseInt(key);
          if (keyIndex < index) {
            // Keep errors for options before the removed one
            newErrors[keyIndex] = prev[keyIndex];
          } else if (keyIndex > index) {
            // Shift down errors for options after the removed one
            newErrors[keyIndex - 1] = prev[keyIndex];
          }
          // Skip the removed index
        });
        return newErrors;
      });
    }
  };

  const clearImageError = (index) => {
    setImageErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  const handleImageLoad = (index) => {
    clearImageError(index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Binary polls have auto-created options — skip options validation
    const validOptions = formData.type === 'binary'
      ? []
      : options.filter(opt => opt.text.trim() !== '');

    if (formData.type !== 'binary') {
      // Require at least 2 options unless user contributions are allowed
      const minOptions = formData.allowUserContributions ? 0 : 2;
      if (validOptions.length < minOptions) {
        // Greek grammar: 0 and 2+ use plural 'επιλογές'
        alert(`Πρέπει να προσθέσετε τουλάχιστον ${minOptions} επιλογές`);
        return;
      }
    }
    
    const payload = {
      ...formData,
      options: validOptions,
      deadline: formData.deadline || null,
      binaryColors: formData.useCustomColors ? formData.binaryColors : undefined,
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

        <FormSelect
          name="category"
          label="Κατηγορία (Προαιρετικό)"
          value={formData.category}
          onChange={handleInputChange}
          options={articleCategories.pollCategories || []}
          placeholder="Επιλέξτε κατηγορία..."
        />

        <TagInput
          label="Tags"
          value={formData.tags}
          onChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
          suggestions={tagSuggestions}
          placeholder="e.g. programming, education"
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
                { value: 'binary', label: 'Δυαδική (Ναι/Όχι)' },
              ]}
            />
          </div>

          {formData.type === 'binary' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Στυλ Δυαδικής Δημοσκόπησης
              </label>
              <FormSelect
                name="binaryStyle"
                value={formData.binaryStyle}
                onChange={handleInputChange}
                options={[
                  { value: 'yes_no', label: 'Ναι / Όχι' },
                  { value: 'agree_disagree', label: 'Συμφωνώ / Διαφωνώ' },
                ]}
              />
            </div>
          )}

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

          <label className="flex items-center">
            <input
              type="checkbox"
              name="hideCreator"
              checked={formData.hideCreator}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Απόκρυψη δημιουργού
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="commentsEnabled"
              checked={formData.commentsEnabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Ενεργοποίηση σχολίων
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="commentsLocked"
              checked={formData.commentsLocked}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Κλείδωμα σχολίων (δεν επιτρέπονται νέα σχόλια)
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              name="useCustomColors"
              checked={formData.useCustomColors}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Χρήση Προσαρμοσμένων Χρωμάτων
            </span>
          </label>
        </div>

        {/* Binary colour pickers */}
        {formData.type === 'binary' && formData.useCustomColors && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Χρώματα Δυαδικών Επιλογών</h4>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.binaryColors[0]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    binaryColors: [e.target.value, prev.binaryColors[1]]
                  }))}
                  className="h-8 w-10 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-700">
                  {formData.binaryStyle === 'agree_disagree' ? 'Συμφωνώ' : 'Ναι'}
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.binaryColors[1]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    binaryColors: [prev.binaryColors[0], e.target.value]
                  }))}
                  className="h-8 w-10 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-700">
                  {formData.binaryStyle === 'agree_disagree' ? 'Διαφωνώ' : 'Όχι'}
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Τοποθεσία (Προαιρετικό)
          </label>
          <CascadingLocationSelector
            value={formData.locationId}
            onChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}
            placeholder="Επιλέξτε τοποθεσία"
            allowClear={true}
          />
          <p className="mt-1 text-sm text-gray-500">
            Η δημοσκόπηση θα εμφανίζεται στη σελίδα της επιλεγμένης τοποθεσίας
          </p>
        </div>
      </div>

      {/* Poll Options — hidden for binary polls (options are auto-created) */}
      {formData.type !== 'binary' && (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Επιλογές Δημοσκόπησης</h3>

        <div className="space-y-4">
          {options.map((option, index) => {
            // Show delete button if number of options exceeds minimum required
            const minOptions = formData.allowUserContributions ? 0 : 2;
            const canDeleteOption = options.length > minOptions;
            
            return (
              <div key={index} className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {formData.useCustomColors && (
                      <input
                        type="color"
                        value={option.color || '#3b82f6'}
                        onChange={(e) => handleOptionChange(index, 'color', e.target.value)}
                        className="h-7 w-9 rounded border border-gray-300 cursor-pointer p-0.5"
                        title="Χρώμα επιλογής"
                      />
                    )}
                    <h4 className="font-medium text-gray-900">Επιλογή {index + 1}</h4>
                  </div>
                  {canDeleteOption && (
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Εικόνας (Προαιρετικό)
                    </label>
                    <div className="flex items-start gap-3">
                      {/* Image preview thumbnail */}
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 border border-gray-300 rounded-md overflow-hidden flex items-center justify-center">
                        {option.photoUrl && !imageErrors[index] ? (
                          <Image
                            src={option.photoUrl}
                            alt={`Preview ${index + 1}`}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                            onError={() => handleImageError(index)}
                            onLoad={() => handleImageLoad(index)}
                          />
                        ) : option.photoUrl && imageErrors[index] ? (
                          <PhotoIcon className="h-8 w-8 text-gray-400" />
                        ) : (
                          <PhotoIcon className="h-8 w-8 text-gray-300" />
                        )}
                      </div>
                      
                      {/* URL input */}
                      <div className="flex-1">
                        <input
                          type="url"
                          name={`option-photoUrl-${index}`}
                          value={option.photoUrl}
                          onChange={(e) => handleOptionChange(index, 'photoUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com/image.png"
                        />
                        {option.photoUrl && imageErrors[index] && (
                          <p className="mt-1 text-xs text-red-600">
                            Δεν ήταν δυνατή η φόρτωση της εικόνας
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Υποστηρίζονται: JPG, JPEG, PNG, WebP, GIF, AVIF
                        </p>
                      </div>
                    </div>
                  </div>

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
          );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Προσθήκη Επιλογής
          </button>
        </div>
      </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-4 items-center">
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
        {onDelete && (
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="ml-auto flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
          >
            <TrashIcon className="h-4 w-4" />
            Διαγραφή
          </button>
        )}
      </div>

      {onDelete && (
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          title="Διαγραφή Δημοσκόπησης"
          message="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη δημοσκόπηση; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
          confirmText="Διαγραφή"
          cancelText="Ακύρωση"
          destructive
          onConfirm={onDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}
    </form>
  );
}
