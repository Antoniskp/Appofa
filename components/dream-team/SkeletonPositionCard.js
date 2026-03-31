'use client';

export default function SkeletonPositionCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="bg-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-300" />
          <div className="flex-1">
            <div className="h-5 bg-gray-300 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Current holder */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          </div>
        </div>

        {/* Vote picker */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
          <div className="h-10 bg-gray-100 rounded-lg" />
        </div>

        {/* Vote results bars */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-2">
              <div className="h-3 bg-gray-200 rounded flex-1" />
              <div className="h-3 bg-gray-100 rounded w-10" />
            </div>
          ))}
        </div>

        {/* Button */}
        <div className="h-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
