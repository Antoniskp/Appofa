export default function CountryFundingBanner({ funding, locationName, hasContent }) {
  if (hasContent) return null;

  const showDonation = funding && (funding.status === 'locked' || funding.status === 'funding');

  if (showDonation) {
    const goal = Number(funding.goalAmount) || 500;
    const current = Number(funding.currentAmount) || 0;
    const pct = Math.min(100, goal > 0 ? (current / goal) * 100 : 0);

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-blue-900 mb-2">
          🚀 Βοηθήστε να ανοίξει η {locationName} στην πλατφόρμα!
        </h3>
        <p className="text-blue-700 mb-4 text-sm">
          Αυτή η χώρα δεν έχει ακόμα περιεχόμενο. Με τη συνεισφορά σας μπορούμε να ανοίξουμε την πλατφόρμα για αυτή την κοινότητα.
        </p>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-blue-700 mb-1">
            <span>€{current.toFixed(2)} συγκεντρώθηκαν</span>
            <span>Στόχος: €{goal.toFixed(2)}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-blue-600 mt-1">{funding.donorCount || 0} δωρητές</p>
        </div>
        {funding.donationUrl && (
          <a
            href={funding.donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            🎁 Κάντε Δωρεά
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-gray-600 text-sm">
        ℹ️ Αυτή η χώρα δεν έχει ακόμα περιεχόμενο. Μπορείτε να δημιουργήσετε άρθρα, δημοσκοπήσεις ή προτάσεις για αυτή την τοποθεσία.
      </p>
    </div>
  );
}
