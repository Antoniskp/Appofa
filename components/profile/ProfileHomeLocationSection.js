'use client';

import CascadingLocationSelector from '@/components/CascadingLocationSelector';

/**
 * Collapsible section for viewing and editing the user's home location.
 *
 * @param {Object} props
 * @param {number|null} props.homeLocationId - The currently selected location ID
 * @param {Object|null} props.homeLocation - The resolved location object (with nested parents)
 * @param {boolean} props.isOpen - Whether the edit panel is expanded
 * @param {Function} props.onToggle - () => void, toggles the expanded state
 * @param {Function} props.onLocationChange - (locationId) => void, called when location changes
 */
export default function ProfileHomeLocationSection({
  homeLocationId,
  homeLocation,
  isOpen,
  onToggle,
  onLocationChange,
}) {
  const getBreadcrumb = (location) => {
    if (!location) return 'Not set';
    const parts = [];
    let current = location;
    while (current) {
      parts.unshift(current.name);
      current = current.parent;
    }
    return parts.join(' → ');
  };

  return (
    <div
      className={`rounded-md border border-gray-200 bg-gray-50 overflow-hidden transition-all duration-800 ease-in-out ${
        isOpen ? 'max-h-[520px]' : 'max-h-11'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="home-location-panel"
        className="w-full h-11 px-4 flex items-center justify-between text-sm font-medium text-gray-900"
      >
        <span className="min-w-0 flex items-center gap-2">
          <span className="shrink-0">Home location</span>
          <span className="text-xs font-normal text-gray-500 truncate">
            {getBreadcrumb(homeLocation)}
          </span>
        </span>
        <span className="text-xs text-gray-500">{isOpen ? 'Hide' : 'Edit'}</span>
      </button>

      <div
        id="home-location-panel"
        aria-hidden={!isOpen}
        className={`px-4 pb-4 pt-2 transition-opacity duration-800 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {homeLocation?.name && (
          <p className="text-xs text-gray-500 mb-2">Current: {homeLocation.name}</p>
        )}
        <label className="block text-sm font-medium text-gray-700 mb-2">Home location</label>
        <CascadingLocationSelector
          value={homeLocationId}
          onChange={onLocationChange}
          placeholder="Select your home location"
          allowClear={true}
        />
      </div>
    </div>
  );
}
