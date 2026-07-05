'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LocationSectionManager from '@/components/LocationSectionManager';
import LocationRoleManager from '@/components/LocationRoleManager';
import LocationModeratorManager from '@/components/locations/LocationModeratorManager';
import LocationBoundaryGeoJsonField from '@/components/locations/LocationBoundaryGeoJsonField';
import { locationAPI } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { isAcceptedAvatarFile } from '@/lib/utils/avatarFileValidation';
import { normalizeUploadImage, isHeicFile, UPLOAD_PRESETS } from '@/lib/utils/normalizeUploadImage';

const LocationPickerMap = dynamic(() => import('@/components/map/LocationPickerMap'), { ssr: false });
const MapViewportPickerMap = dynamic(() => import('@/components/map/MapViewportPickerMap'), { ssr: false });

/** Accepted MIME types / extensions for location image upload (must match backend allowlist). */
const IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence', '.heic', '.heif'];

export default function LocationEditForm({
  location,
  editedData,
  isSaving,
  onSave,
  onCancel,
  onInputChange,
  onImageUploaded,
  onBoundaryValidationChange
}) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStep, setUploadStep] = useState(''); // '' | 'converting' | 'uploading'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [geoSearchQuery, setGeoSearchQuery] = useState('');
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);
  const imageFileRef = useRef(null);

  const hasCoords = editedData.lat !== '' && editedData.lng !== '';
  const hasBoundary = !!editedData.boundary_geojson;
  const hasViewport = !!editedData.map_default_center_lat && !!editedData.map_default_center_lng && !!editedData.map_default_zoom;
  const mapHealthItems = [
    { label: 'Coordinates', ok: hasCoords },
    { label: 'Boundary', ok: hasBoundary },
    { label: 'Default viewport', ok: hasViewport },
    { label: 'Boundary color', ok: !editedData.boundary_color || /^#[0-9A-Fa-f]{6}$/.test(String(editedData.boundary_color).trim()) },
  ];

  const applyParentCenter = () => {
    const parent = location.parent;
    if (!parent?.lat || !parent?.lng) {
      toastError('Parent location does not have coordinates.');
      return;
    }
    onInputChange('map_default_center_lat', String(parent.lat));
    onInputChange('map_default_center_lng', String(parent.lng));
    onInputChange('map_default_zoom', String(location.type === 'municipality' ? 11 : 8));
  };

  const applyBoundaryViewport = () => {
    try {
      const parsed = typeof editedData.boundary_geojson === 'string'
        ? JSON.parse(editedData.boundary_geojson)
        : editedData.boundary_geojson;
      const coords = [];
      const collect = (node) => {
        if (!Array.isArray(node)) return;
        if (node.length >= 2 && Number.isFinite(Number(node[0])) && Number.isFinite(Number(node[1]))) {
          coords.push([Number(node[0]), Number(node[1])]);
          return;
        }
        node.forEach(collect);
      };
      if (parsed?.type === 'FeatureCollection') {
        parsed.features?.forEach((feature) => collect(feature?.geometry?.coordinates));
      } else if (parsed?.type === 'Feature') {
        collect(parsed.geometry?.coordinates);
      } else {
        collect(parsed?.coordinates);
      }
      if (!coords.length) {
        toastError('Boundary does not contain usable coordinates.');
        return;
      }
      const lngs = coords.map(([lng]) => lng);
      const lats = coords.map(([, lat]) => lat);
      const latCenter = (Math.min(...lats) + Math.max(...lats)) / 2;
      const lngCenter = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      onInputChange('map_default_center_lat', latCenter.toFixed(6));
      onInputChange('map_default_center_lng', lngCenter.toFixed(6));
      onInputChange('map_default_zoom', String(location.type === 'country' ? 6 : location.type === 'periphery' ? 8 : 11));
      toastSuccess('Viewport centered from boundary.');
    } catch {
      toastError('Boundary GeoJSON is not valid JSON.');
    }
  };

  const searchPlace = async () => {
    const query = geoSearchQuery.trim() || editedData.name_local || editedData.name;
    if (!query) return;
    setIsSearchingGeo(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      const results = await response.json();
      const first = results?.[0];
      if (!first?.lat || !first?.lon) {
        toastError('No map result found for that place.');
        return;
      }
      onInputChange('lat', String(Number(first.lat).toFixed(6)));
      onInputChange('lng', String(Number(first.lon).toFixed(6)));
      onInputChange('map_default_center_lat', String(Number(first.lat).toFixed(6)));
      onInputChange('map_default_center_lng', String(Number(first.lon).toFixed(6)));
      onInputChange('map_default_zoom', String(location.type === 'country' ? 6 : 12));
      toastSuccess('Coordinates updated from place search.');
    } catch {
      toastError('Place search failed. Try again or set coordinates manually.');
    } finally {
      setIsSearchingGeo(false);
    }
  };

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
                  {{ converting: 'Converting…', compressing: 'Compressing…', uploading: 'Uploading…' }[uploadStep] ?? 'Uploading…'}
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
        <div className="md:col-span-2">
          <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {mapHealthItems.map((item) => (
                <span
                  key={item.label}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}
                >
                  {item.ok ? 'OK' : 'Missing'} · {item.label}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={geoSearchQuery}
                onChange={(e) => setGeoSearchQuery(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={editedData.name_local || editedData.name || 'Search place'}
                aria-label="Search place for coordinates"
              />
              <button
                type="button"
                onClick={searchPlace}
                disabled={isSearchingGeo}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isSearchingGeo ? 'Searching...' : 'Find place'}
              </button>
              <button
                type="button"
                onClick={applyParentCenter}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Use parent center
              </button>
              <button
                type="button"
                onClick={applyBoundaryViewport}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Fit boundary
              </button>
            </div>
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coordinates (lat, lng)</label>
          <LocationPickerMap
            lat={editedData.lat}
            lng={editedData.lng}
            onChange={({ lat, lng }) => {
              onInputChange('lat', String(lat));
              onInputChange('lng', String(lng));
            }}
            className="h-[300px] w-full rounded-xl overflow-hidden sm:h-[340px]"
          />
          <div className="flex gap-2 mt-2">
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
        <LocationBoundaryGeoJsonField
          value={editedData.boundary_geojson}
          onChange={(nextBoundary) => onInputChange('boundary_geojson', nextBoundary)}
          onValidationChange={onBoundaryValidationChange}
          locationMeta={{
            id: location.id,
            slug: location.slug,
            name: editedData.name || location.name,
            nameLocal: editedData.name_local || location.name_local,
          }}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Boundary Color</label>
          <input
            type="text"
            value={editedData.boundary_color || ''}
            onChange={(e) => onInputChange('boundary_color', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#3b82f6"
          />
          <p className="mt-1 text-xs text-gray-500">Optional HEX color (#RRGGBB) used for territory fill/outline.</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Map Viewport</label>
          <MapViewportPickerMap
            lat={editedData.map_default_center_lat}
            lng={editedData.map_default_center_lng}
            zoom={editedData.map_default_zoom}
            onChange={({ lat, lng, zoom }) => {
              onInputChange('map_default_center_lat', String(lat));
              onInputChange('map_default_center_lng', String(lng));
              onInputChange('map_default_zoom', String(zoom));
            }}
            className="h-[300px] w-full rounded-xl overflow-hidden sm:h-[340px]"
          />
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              value={editedData.map_default_center_lat || ''}
              onChange={(e) => onInputChange('map_default_center_lat', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Latitude (38.0)"
              aria-label="Default map center latitude"
            />
            <input
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              value={editedData.map_default_center_lng || ''}
              onChange={(e) => onInputChange('map_default_center_lng', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Longitude (23.8)"
              aria-label="Default map center longitude"
            />
            <input
              type="number"
              min="1"
              max="18"
              value={editedData.map_default_zoom || ''}
              onChange={(e) => onInputChange('map_default_zoom', e.target.value)}
              className="w-32 border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Zoom (7)"
              aria-label="Default map zoom"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Population Override
            {location.population != null && (
              <span className="ml-1 text-xs text-gray-400 font-normal">(Wikipedia: {location.population.toLocaleString()})</span>
            )}
          </label>
          <input
            type="number"
            min="0"
            value={editedData.population_override ?? ''}
            onChange={(e) => onInputChange('population_override', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Leave blank to use Wikipedia value"
          />
          <p className="mt-1 text-xs text-gray-500">Set a manual population value. This overrides the Wikipedia-derived figure for participation % calculations.</p>
        </div>
      </div>

      {/* Section manager — part of the same edit flow */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Αξιωματούχοι Τοποθεσίας</h3>
        <LocationRoleManager locationId={location.id} locationType={location.type} />
      </div>

      {/* Platform-level moderator assignments (admin-only, from location page) */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <LocationModeratorManager locationId={location.id} />
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Manage Sections</h3>
        <LocationSectionManager locationId={location.id} />
      </div>
    </div>
  );
}
