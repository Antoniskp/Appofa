'use client';

import { useRef, useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LocationSectionManager from '@/components/LocationSectionManager';
import LocationRoleManager from '@/components/LocationRoleManager';
import { locationAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { isAcceptedAvatarFile } from '@/lib/utils/avatarFileValidation';
import { normalizeUploadImage, isHeicFile, UPLOAD_PRESETS } from '@/lib/utils/normalizeUploadImage';

/** Accepted MIME types / extensions for location image upload (must match backend allowlist). */
const IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence', '.heic', '.heif'];

export default function LocationEditForm({ location, editedData, isSaving, onSave, onCancel, onInputChange, onImageUploaded }) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStep, setUploadStep] = useState(''); // '' | 'converting' | 'uploading'
  const [previewUrl, setPreviewUrl] = useState(null);
  const imageFileRef = useRef(null);

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after an error
    if (imageFileRef.current) imageFileRef.current.value = '';

    if (!isAcceptedAvatarFile(file)) {
      toastError('Unsupported file type. Please use JPEG, PNG, WebP, or HEIC/HEIF.');
      return;
    }

    setIsUploadingImage(true);
    try {
      if (isHeicFile(file)) {
        setUploadStep('converting');
      } else if (file.size > UPLOAD_PRESETS.location.maxBytes) {
        setUploadStep('compressing');
      }
      const uploadFile = await normalizeUploadImage(file, UPLOAD_PRESETS.location);
      setUploadStep('uploading');
      const response = await locationAPI.uploadImage(location.id, uploadFile);
      if (response.success && response.data?.imageUrl) {
        // Apply cache-buster so the browser immediately shows the new image
        const ts = response.data.imageUpdatedAt
          ? new Date(response.data.imageUpdatedAt).getTime()
          : Date.now();
        const bustedUrl = `${response.data.imageUrl}?v=${ts}`;
        setPreviewUrl(bustedUrl);
        onImageUploaded?.(bustedUrl);
        toastSuccess('Location image uploaded successfully!');
      }
    } catch (err) {
      toastError(err.message || 'Failed to upload location image.');
    } finally {
      setIsUploadingImage(false);
      setUploadStep('');
    }
  };

  // Build the display image with cache-busting for the stored uploaded image
  const storedUploadSrc = location.imageUrl
    ? (location.imageUpdatedAt
      ? `${location.imageUrl}?v=${new Date(location.imageUpdatedAt).getTime()}`
      : location.imageUrl)
    : null;
  const displayImage = previewUrl || storedUploadSrc || location.wikipedia_image_url;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Edit Location</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckIcon className="h-5 w-5" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
            Cancel
          </button>
        </div>
      </div>

      {/* Location image upload */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Location Image</h3>
        <div className="flex items-start gap-4">
          {displayImage && (
            <img
              src={displayImage}
              alt={`${location.name} image`}
              className="w-24 h-16 rounded-md object-cover border border-gray-200 flex-shrink-0 bg-gray-100"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          <div>
            <input
              ref={imageFileRef}
              type="file"
              accept={IMAGE_ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={handleImageFileChange}
              aria-label="Upload location image"
            />
            <button
              type="button"
              onClick={() => imageFileRef.current?.click()}
              disabled={isUploadingImage}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isUploadingImage ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {uploadStep === 'converting' ? 'Converting…' : uploadStep === 'compressing' ? 'Compressing…' : 'Uploading…'}
                </>
              ) : (
                displayImage ? 'Replace Image' : 'Upload Image'
              )}
            </button>
            <p className="mt-1 text-xs text-gray-500">JPEG, PNG, WebP or HEIC/HEIF · max 10 MB · recommended 1600×900</p>
          </div>
        </div>
      </div>

      {/* Location detail fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={editedData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Location name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Local name</label>
          <input
            type="text"
            value={editedData.name_local}
            onChange={(e) => onInputChange('name_local', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Local name (optional)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
          <input
            type="text"
            value={editedData.code}
            onChange={(e) => onInputChange('code', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Location code"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coordinates (lat, lng)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              value={editedData.lat}
              onChange={(e) => onInputChange('lat', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Latitude"
            />
            <input
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              value={editedData.lng}
              onChange={(e) => onInputChange('lng', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Longitude"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Wikipedia URL</label>
          <input
            type="url"
            value={editedData.wikipedia_url}
            onChange={(e) => onInputChange('wikipedia_url', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://en.wikipedia.org/wiki/..."
          />
        </div>
      </div>

      {/* Section manager — part of the same edit flow */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Αξιωματούχοι Τοποθεσίας</h3>
        <LocationRoleManager locationId={location.id} locationType={location.type} />
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Manage Sections</h3>
        <LocationSectionManager locationId={location.id} />
      </div>
    </div>
  );
}
