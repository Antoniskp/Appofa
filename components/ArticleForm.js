'use client';

import { useState, useEffect } from 'react';
import AlertMessage from '@/components/AlertMessage';
import FormInput from '@/components/FormInput';
import FormSelect from '@/components/FormSelect';
import CascadingLocationSelector from '@/components/CascadingLocationSelector';
import { locationAPI } from '@/lib/api';
import articleCategories from '@/config/articleCategories.json';
import { isCategoryRequired } from '@/lib/utils/articleTypes';

export default function ArticleForm({
  article = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = ''
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    bannerImageUrl: '',
    type: 'personal',
    category: '',
    tags: '',
    status: 'draft',
    isNews: false,
  });

  const [linkedLocations, setLinkedLocations] = useState([]);
  const [newLocationId, setNewLocationId] = useState(null);
  const [locationError, setLocationError] = useState('');

  // Initialize form data from article prop (edit mode)
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        content: article.content || '',
        summary: article.summary || '',
        bannerImageUrl: article.bannerImageUrl || '',
        type: article.type || 'personal',
        category: article.category || '',
        tags: Array.isArray(article.tags) ? article.tags.join(', ') : '',
        status: article.status || 'draft',
        isNews: Boolean(article.isNews),
      });

      // Load linked locations only when article.id exists (edit mode)
      if (article.id) {
        fetchLinkedLocations(article.id);
      }
    }
  }, [article]);

  const fetchLinkedLocations = async (articleId) => {
    try {
      const response = await locationAPI.getEntityLocations('article', articleId);
      if (response.success) {
        setLinkedLocations(response.locations || []);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // If changing article type, reset category
    if (name === 'type') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        category: '', // Reset category when type changes
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationId || newLocationId === 'international' || !article?.id) return;

    try {
      const response = await locationAPI.link('article', article.id, newLocationId);
      if (response.success) {
        // Reload locations
        await fetchLinkedLocations(article.id);
        setNewLocationId(null);
        setLocationError('');
      }
    } catch (err) {
      setLocationError(`Failed to link location: ${err.message}`);
    }
  };

  const handleRemoveLocation = async (locationId) => {
    if (!article?.id) return;

    try {
      const response = await locationAPI.unlink('article', article.id, locationId);
      if (response.success) {
        setLinkedLocations(prev => prev.filter(loc => loc.id !== locationId));
        setLocationError('');
      }
    } catch (err) {
      setLocationError(`Failed to unlink location: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Parse tags from comma-separated string to array
    const payload = {
      ...formData,
      tags: formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AlertMessage className="mb-6" message={submitError} />

      <FormInput
        name="title"
        label="Title"
        value={formData.title}
        onChange={handleInputChange}
        required
        maxLength={200}
        showCharCount
        placeholder="Enter article title"
        helpText="A clear, descriptive title for your article"
      />

      <FormInput
        name="summary"
        label="Summary"
        value={formData.summary}
        onChange={handleInputChange}
        placeholder="Brief summary (optional)"
      />
 
      <FormInput
        name="bannerImageUrl"
        label="Banner Image URL"
        value={formData.bannerImageUrl}
        onChange={handleInputChange}
        placeholder="https://example.com/banner.jpg or /images/yourimage.png"
      />

      <FormInput
        name="tags"
        label="Tags (comma-separated)"
        value={formData.tags}
        onChange={handleInputChange}
        placeholder="e.g. AI, Research"
      />

      <FormInput
        name="content"
        type="textarea"
        label="Content"
        rows={10}
        value={formData.content}
        onChange={handleInputChange}
        required
        maxLength={50000}
        showCharCount
        placeholder="Write your article content here..."
      />

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          name="type"
          label="Τύπος Άρθρου (Article Type)"
          value={formData.type}
          onChange={handleInputChange}
          required
          options={Object.values(articleCategories.articleTypes).map((articleType) => ({
            value: articleType.value,
            label: `${articleType.labelEl} (${articleType.label})`
          }))}
          helpText={articleCategories.articleTypes[formData.type]?.description}
        />

        {articleCategories.articleTypes[formData.type]?.categories.length > 0 ? (
          <FormSelect
            name="category"
            label="Κατηγορία (Category)"
            value={formData.category}
            onChange={handleInputChange}
            required={isCategoryRequired(formData.type, articleCategories)}
            options={articleCategories.articleTypes[formData.type].categories}
            placeholder="Επιλέξτε κατηγορία..."
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Κατηγορία (Category)
            </label>
            <input
              type="text"
              disabled
              value="Δεν απαιτείται"
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          name="status"
          label="Status"
          value={formData.status}
          onChange={handleInputChange}
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'archived', label: 'Archived' }
          ]}
        />
      </div>

      {/* Locations Section - Only show in edit mode when article.id exists */}
      {article?.id ? (
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Locations
          </label>
          
          {locationError && (
            <AlertMessage message={locationError} className="mb-3" />
          )}
          
          {/* Linked Locations */}
          {linkedLocations.length > 0 && (
            <div className="mb-3 space-y-2">
              {linkedLocations.map(location => (
                <div key={location.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div>
                    <span className="font-medium text-gray-900">{location.name}</span>
                    {location.name_local && (
                      <span className="text-gray-500 ml-2">({location.name_local})</span>
                    )}
                    <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {location.type}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(location.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Location */}
          <div className="flex gap-2">
            <div className="flex-1">
              <CascadingLocationSelector
                value={newLocationId}
                onChange={setNewLocationId}
                placeholder="Select a location to add"
                allowClear={true}
              />
            </div>
            <button
              type="button"
              onClick={handleAddLocation}
              disabled={!newLocationId || newLocationId === 'international'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        /* Create mode - show informational message about locations */
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Locations
          </label>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold" aria-label="Information">ℹ️ Note:</span> Locations can be added after creating the article. 
              You will be redirected to the edit page where you can link locations to your article.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSubmitting ? (article ? 'Saving...' : 'Creating...') : (article ? 'Save Changes' : 'Create Article')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
