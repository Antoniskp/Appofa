'use client';

import { useState } from 'react';
import LocationSelector from '@/components/ui/LocationSelector';

export default function DiasporaModal({ isOpen, detectedCountryName, onConfirmDiaspora, onDecline, onSkip }) {
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Κλείσιμο"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4">
          <span className="text-2xl">🌍</span>
          <h2 className="text-xl font-bold text-gray-900 mt-2">Είστε μέλος της Διασποράς;</h2>
        </div>

        <p className="text-gray-600 mb-5 text-sm leading-relaxed">
          {detectedCountryName ? `Εντοπίσαμε ότι βρίσκεστε στη ${detectedCountryName}. ` : ''}
          Είστε μέλος της Ελληνικής Διασποράς ή άλλης κοινότητας που ζει εκτός της χώρας καταγωγής σας;
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Επιλέξτε τη χώρα καταγωγής σας
          </label>
          <LocationSelector
            value={selectedLocationId}
            onChange={setSelectedLocationId}
            filterType="country"
            placeholder="Αναζήτηση χώρας..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => selectedLocationId && onConfirmDiaspora(selectedLocationId)}
            disabled={!selectedLocationId}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
          >
            Ναι, είμαι Διασπορά
          </button>
          <button
            onClick={onDecline}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
          >
            Όχι, συνέχεια
          </button>
        </div>
      </div>
    </div>
  );
}
