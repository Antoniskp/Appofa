 'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { imageAPI } from '@/lib/api';

const emptySelection = {
  mode: 'existing',
  imageId: '',
  externalUrl: '',
  title: '',
  tags: '',
  file: null,
};

export default function ImagePicker({
  value,
  onChange,
  disabled = false,
  helperText = 'Upload or choose an intro image. Leave empty for none.',
}) {
  const [selection, setSelection] = useState(emptySelection);
  const [uploadPreview, setUploadPreview] = useState('');
  const [myImages, setMyImages] = useState([]);
  const [searchTag, setSearchTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedImage = useMemo(() => {
    if (!value || !Array.isArray(myImages)) return null;
    return myImages.find((image) => image.id === value) || null;
  }, [myImages, value]);

  useEffect(() => {
    setSelection((prev) => ({ ...prev, imageId: value ? String(value) : '' }));
  }, [value]);

  const fetchImages = useCallback(async (tag) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = { limit: 24 };
      if (tag) {
        params.tag = tag;
      }
      const response = await imageAPI.getMyImages(params);
      if (response.success) {
        setMyImages(response.data.images || []);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load images.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages('');
  }, [fetchImages]);

  const handleModeChange = (event) => {
    const nextMode = event.target.value;
    setSelection((prev) => ({ ...prev, mode: nextMode }));
    setErrorMessage('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setSelection((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelection((prev) => ({ ...prev, file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(typeof reader.result === 'string' ? reader.result : '');
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview('');
    }
  };

  const handleSearch = async () => {
    await fetchImages(searchTag.trim());
  };

  const notifySelection = (id) => {
    const numericId = id ? Number(id) : null;
    onChange(numericId ?? null);
  };

  const handleUseExisting = () => {
    notifySelection(selection.imageId);
  };

  const parseTags = (raw) =>
    raw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

  const handleUpload = async () => {
    if (!selection.file) {
      setErrorMessage('Please choose a file to upload.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('image', selection.file);
      if (selection.title) {
        formData.append('title', selection.title);
      }
      if (selection.tags) {
        formData.append('tags', JSON.stringify(parseTags(selection.tags)));
      }
      const response = await imageAPI.upload(formData);
      if (response.success) {
        const newImage = response.data.image;
        setMyImages((prev) => [newImage, ...prev]);
        notifySelection(newImage.id);
        setSelection((prev) => ({
          ...prev,
          imageId: String(newImage.id),
          file: null,
        }));
        setUploadPreview('');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to upload image.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExternal = async () => {
    if (!selection.externalUrl) {
      setErrorMessage('Please enter an image URL.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const response = await imageAPI.addExternal({
        url: selection.externalUrl,
        title: selection.title,
        tags: parseTags(selection.tags),
      });
      if (response.success) {
        const newImage = response.data.image;
        setMyImages((prev) => [newImage, ...prev]);
        notifySelection(newImage.id);
        setSelection((prev) => ({
          ...prev,
          imageId: String(newImage.id),
        }));
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to add external image.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearSelection = () => {
    notifySelection(null);
    setSelection((prev) => ({ ...prev, imageId: '', file: null }));
    setUploadPreview('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {['existing', 'upload', 'external'].map((mode) => (
          <label key={mode} className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="imageMode"
              value={mode}
              checked={selection.mode === mode}
              onChange={handleModeChange}
              disabled={disabled}
            />
            {mode === 'existing' && 'Use existing'}
            {mode === 'upload' && 'Upload'}
            {mode === 'external' && 'External URL'}
          </label>
        ))}
      </div>

      {selection.mode === 'existing' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={searchTag}
              onChange={(event) => setSearchTag(event.target.value)}
              placeholder="Filter by tag"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              disabled={disabled}
            />
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              disabled={disabled || loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              name="imageId"
              value={selection.imageId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              disabled={disabled}
            >
              <option value="">No intro image</option>
              {myImages.map((image) => (
                <option key={image.id} value={image.id}>
                  {image.title || image.url}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleUseExisting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              disabled={disabled}
            >
              Use selected
            </button>
          </div>
          {selectedImage && (
            <div className="border border-gray-200 rounded-md p-3 flex items-center gap-4 bg-gray-50">
              <img
                src={selectedImage.url}
                alt={selectedImage.title || 'Selected intro image'}
                className="h-20 w-20 object-cover rounded"
              />
              <div className="text-sm text-gray-700">
                <p className="font-medium">{selectedImage.title || 'Untitled image'}</p>
                <p className="text-xs text-gray-500">{selectedImage.url}</p>
              </div>
            </div>
          )}
        </div>
      )}

        {selection.mode === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-700"
              disabled={disabled}
            />
            {uploadPreview && (
              <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                <img
                  src={uploadPreview}
                  alt="Selected upload preview"
                  className="w-full max-h-56 object-cover rounded"
                />
              </div>
            )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="title"
              value={selection.title}
              onChange={handleInputChange}
              placeholder="Image title"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              disabled={disabled}
            />
            <input
              type="text"
              name="tags"
              value={selection.tags}
              onChange={handleInputChange}
              placeholder="Tags (comma-separated)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              disabled={disabled}
            />
          </div>
          <button
            type="button"
            onClick={handleUpload}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            disabled={disabled || submitting}
          >
            {submitting ? 'Uploading...' : 'Upload & Use'}
          </button>
        </div>
      )}

      {selection.mode === 'external' && (
        <div className="space-y-3">
          <input
            type="url"
            name="externalUrl"
            value={selection.externalUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="title"
              value={selection.title}
              onChange={handleInputChange}
              placeholder="Image title (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              disabled={disabled}
            />
            <input
              type="text"
              name="tags"
              value={selection.tags}
              onChange={handleInputChange}
              placeholder="Tags (comma-separated)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              disabled={disabled}
            />
          </div>
          <button
            type="button"
            onClick={handleAddExternal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            disabled={disabled || submitting}
          >
            {submitting ? 'Saving...' : 'Add & Use'}
          </button>
        </div>
      )}

      {(value || selection.imageId || uploadPreview) && (
        <button
          type="button"
          onClick={handleClearSelection}
          className="text-sm text-red-600 hover:text-red-700"
          disabled={disabled}
        >
          Remove intro image
        </button>
      )}

      {errorMessage && (
        <div className="text-sm text-red-600">{errorMessage}</div>
      )}
      {helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
