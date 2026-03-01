'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';

/**
 * Toggle to control whether the user appears in search results.
 *
 * @param {Object} props
 * @param {boolean} props.searchable - Current searchable state
 * @param {Function} props.onChange - (checked: boolean) => void
 */
export default function ProfilePrivacySection({ searchable, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        id="searchable"
        name="searchable"
        type="checkbox"
        checked={searchable}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label htmlFor="searchable" className="flex items-center gap-2 text-sm text-gray-700">
        Allow other users to find me in user search
        <Tooltip content="Επιτρέψτε σε άλλους χρήστες να σας βρουν στην αναζήτηση">
          <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
        </Tooltip>
      </label>
    </div>
  );
}
