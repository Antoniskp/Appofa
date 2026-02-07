'use client';

import { useState, useEffect } from 'react';
import FormInput from '@/components/FormInput';
import FormSelect from '@/components/FormSelect';
import Button from '@/components/Button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * Reusable poll form for create/edit
 * @param {Object} initialData - Initial form data for editing
 * @param {Function} onSubmit - Form submission handler
 * @param {boolean} isLoading - Loading state
 * @param {string} submitLabel - Label for submit button
 */
export default function PollForm({ 
  initialData = null, 
  onSubmit, 
  isLoading = false,
  submitLabel = 'Δημιουργία Ψηφοφορίας'
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pollType: 'simple',
    questionType: 'single-choice',
    allowUnauthenticatedVoting: true,
    allowUserAddOptions: false,
    options: [
      { optionText: '', imageUrl: '', linkUrl: '', displayName: '' },
      { optionText: '', imageUrl: '', linkUrl: '', displayName: '' }
    ]
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        pollType: initialData.pollType || 'simple',
        questionType: initialData.questionType || 'single-choice',
        allowUnauthenticatedVoting: initialData.allowUnauthenticatedVoting ?? true,
        allowUserAddOptions: initialData.allowUserAddOptions ?? false,
        options: initialData.options || [
          { optionText: '', imageUrl: '', linkUrl: '', displayName: '' },
          { optionText: '', imageUrl: '', linkUrl: '', displayName: '' }
        ]
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { optionText: '', imageUrl: '', linkUrl: '', displayName: '' }]
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) {
      alert('Πρέπει να έχετε τουλάχιστον 2 επιλογές');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const validate = () => {
    const newErrors = {};

    // Title is required
    if (!formData.title?.trim()) {
      newErrors.title = 'Ο τίτλος είναι υποχρεωτικός';
    }

    // Options validation only for non-free-text types
    if (formData.questionType !== 'free-text') {
      // At least 2 options required
      if (formData.options.length < 2) {
        newErrors.options = 'Πρέπει να έχετε τουλάχιστον 2 επιλογές';
      }

      // Check that all options have required fields
      const hasEmptyOptions = formData.options.some(opt => {
        if (formData.pollType === 'simple') {
          return !opt.optionText?.trim();
        } else {
          return !opt.optionText?.trim() && !opt.displayName?.trim();
        }
      });

      if (hasEmptyOptions) {
        newErrors.options = 'Όλες οι επιλογές πρέπει να έχουν κείμενο';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      // Only process options for question types that need them
      options: formData.questionType === 'free-text' 
        ? [] 
        : formData.options.map(opt => {
            if (formData.pollType === 'simple') {
              return { optionText: opt.optionText.trim() };
            } else {
              return {
                optionText: opt.optionText.trim(),
                imageUrl: opt.imageUrl?.trim() || null,
                linkUrl: opt.linkUrl?.trim() || null,
                displayName: opt.displayName?.trim() || opt.optionText.trim()
              };
            }
          })
    };

    onSubmit(submitData);
  };

  const isComplexPoll = formData.pollType === 'complex';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <FormInput
        label="Τίτλος"
        name="title"
        type="text"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors.title}
        required
        placeholder="Εισάγετε τον τίτλο της ψηφοφορίας"
        maxLength={200}
        showCharCount
      />

      {/* Description */}
      <FormInput
        label="Περιγραφή"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Προσθέστε μια περιγραφή (προαιρετικό)"
        rows={4}
        maxLength={1000}
        showCharCount
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Poll Type */}
        <FormSelect
          label="Τύπος Ψηφοφορίας"
          name="pollType"
          value={formData.pollType}
          onChange={(e) => handleChange('pollType', e.target.value)}
          options={[
            { value: 'simple', label: 'Απλή (μόνο κείμενο)' },
            { value: 'complex', label: 'Σύνθετη (με εικόνες και links)' }
          ]}
          required
          helpText="Απλή για γρήγορες ψηφοφορίες, σύνθετη για λεπτομερείς επιλογές"
        />

        {/* Question Type */}
        <FormSelect
          label="Τύπος Ερώτησης"
          name="questionType"
          value={formData.questionType}
          onChange={(e) => handleChange('questionType', e.target.value)}
          options={[
            { value: 'single-choice', label: 'Μονή Επιλογή' },
            { value: 'ranked-choice', label: 'Κατάταξη Επιλογών' },
            { value: 'free-text', label: 'Ελεύθερο Κείμενο' }
          ]}
          required
          helpText="Πώς θα ψηφίζουν οι χρήστες;"
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={formData.allowUnauthenticatedVoting}
            onChange={(e) => handleChange('allowUnauthenticatedVoting', e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Επιτρέπεται ψήφος από μη εγγεγραμμένους χρήστες
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              Οι επισκέπτες χωρίς λογαριασμό μπορούν να ψηφίσουν
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={formData.allowUserAddOptions}
            onChange={(e) => handleChange('allowUserAddOptions', e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Επιτρέπεται προσθήκη επιλογών από χρήστες
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              Οι χρήστες μπορούν να προσθέσουν τις δικές τους επιλογές
            </p>
          </div>
        </label>
      </div>

      {/* Options */}
      {formData.questionType !== 'free-text' && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Επιλογές Ψηφοφορίας
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addOption}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Προσθήκη Επιλογής
            </Button>
          </div>

          {errors.options && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {errors.options}
            </p>
          )}

          <div className="space-y-4">
            {formData.options.map((option, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Επιλογή {index + 1}
                  </h4>
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Text (always required) */}
                  <FormInput
                    label="Κείμενο"
                    name={`option-${index}-optionText`}
                    type="text"
                    value={option.optionText}
                    onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                    required
                    placeholder="Εισάγετε το κείμενο της επιλογής"
                  />

                  {/* Complex poll fields */}
                  {isComplexPoll && (
                    <>
                      <FormInput
                        label="Όνομα Εμφάνισης"
                        name={`option-${index}-displayName`}
                        type="text"
                        value={option.displayName}
                        onChange={(e) => handleOptionChange(index, 'displayName', e.target.value)}
                        placeholder="Προαιρετικό όνομα εμφάνισης"
                      />

                      <FormInput
                        label="URL Εικόνας"
                        name={`option-${index}-imageUrl`}
                        type="url"
                        value={option.imageUrl}
                        onChange={(e) => handleOptionChange(index, 'imageUrl', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />

                      <FormInput
                        label="URL Link"
                        name={`option-${index}-linkUrl`}
                        type="url"
                        value={option.linkUrl}
                        onChange={(e) => handleOptionChange(index, 'linkUrl', e.target.value)}
                        placeholder="https://example.com/more-info"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          size="lg"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
