import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import LocationSectionManager from '@/components/LocationSectionManager';

export default function LocationEditForm({ location, editedData, isSaving, onSave, onCancel, onInputChange }) {
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
        <h3 className="text-base font-semibold text-gray-900 mb-3">Manage Sections</h3>
        <LocationSectionManager locationId={location.id} />
      </div>
    </div>
  );
}
