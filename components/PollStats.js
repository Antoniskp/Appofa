import { CheckCircleIcon, XCircleIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';

/**
 * Small stats widget for polls
 * @param {Object} poll - Poll object with voteCount, status, createdAt
 * @param {string} variant - 'compact' or 'detailed'
 */
export default function PollStats({ poll, variant = 'detailed' }) {
  const createdAt = new Date(poll.createdAt);
  const formattedDate = createdAt.toLocaleDateString('el-GR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const isOpen = poll.status === 'open' || poll.status === 'active';
  
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <ChartBarIcon className="h-4 w-4" />
          <span>{poll.voteCount || 0} ψήφοι</span>
        </div>
        <div className="flex items-center gap-1">
          {isOpen ? (
            <>
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Ανοιχτή</span>
            </>
          ) : (
            <>
              <XCircleIcon className="h-4 w-4 text-red-600" />
              <span className="text-red-600">Κλειστή</span>
            </>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Στατιστικά</h3>
      <div className="space-y-3">
        {/* Total Votes */}
        <div className="flex items-start gap-3">
          <ChartBarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Σύνολο Ψήφων</p>
            <p className="text-lg font-semibold text-gray-900">
              {poll.voteCount || 0}
            </p>
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-start gap-3">
          {isOpen ? (
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5" />
          )}
          <div>
            <p className="text-sm text-gray-600">Κατάσταση</p>
            <p className={`text-lg font-semibold ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
              {isOpen ? 'Ανοιχτή' : 'Κλειστή'}
            </p>
          </div>
        </div>
        
        {/* Created Date */}
        <div className="flex items-start gap-3">
          <CalendarIcon className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">Δημιουργήθηκε</p>
            <p className="text-sm font-medium text-gray-900">
              {formattedDate}
            </p>
          </div>
        </div>
        
        {/* Question Type */}
        {poll.questionType && (
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 flex items-center justify-center text-gray-600 mt-0.5">
              <span className="text-xs font-bold">?</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Τύπος</p>
              <p className="text-sm font-medium text-gray-900">
                {poll.questionType === 'single-choice' && 'Μονή Επιλογή'}
                {poll.questionType === 'ranked-choice' && 'Κατάταξη Επιλογών'}
                {poll.questionType === 'free-text' && 'Ελεύθερο Κείμενο'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
