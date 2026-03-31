import SkeletonPositionCard from '@/components/dream-team/SkeletonPositionCard';

export default function DreamTeamLoading() {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Hero skeleton */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-900 h-48 mb-8 animate-pulse" />
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonPositionCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
