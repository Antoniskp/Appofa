'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { statsAPI } from '@/lib/api';
import { 
  MapPinIcon, 
  ChartBarIcon,
  ArrowRightIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 animate-pulse">
      <div className="h-7 w-16 bg-white/20 rounded-md" />
      <div className="h-4 w-14 bg-white/15 rounded" />
    </div>
  );
}

export default function HomeHero() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    statsAPI.getCommunityStats()
      .then((res) => { if (res?.success) setStats(res.data); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const metrics = stats ? [
    { label: 'Χρήστες',       value: stats.totalUsers,    icon: UsersIcon },
    { label: 'Ψηφοφορίες',    value: stats.totalPolls,    icon: ChartBarIcon },
    { label: 'Ψήφοι',         value: stats.totalVotes,    icon: CheckBadgeIcon },
    { label: 'Σχόλια',        value: stats.totalComments, icon: ChatBubbleLeftRightIcon },
  ] : null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative app-container py-10 md:py-14">
        <div className="text-center animate-fade-in max-w-3xl mx-auto">
          {!authLoading && user && (
            <p className="text-base md:text-lg mb-2 text-cyan-100 font-medium">
              Καλώς ήρθες, {user.firstName || user.username}!
            </p>
          )}

          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            Η πλατφόρμα της τοπικής κοινότητας
          </h1>

          <p className="text-lg md:text-xl text-cyan-50/90 mb-7 max-w-xl mx-auto">
            Νέα, άρθρα και ψηφοφορίες για την περιοχή σου.
          </p>

          <div className="flex flex-wrap gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Link 
              href="/locations" 
              className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 focus:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-white/50 transition shadow-lg hover:shadow-xl hover:-translate-y-1 focus:-translate-y-1 transform"
            >
              <MapPinIcon className="w-5 h-5" />
              Βρες την Περιοχή σου
              <ArrowRightIcon className="w-5 h-5" />
            </Link>

            <Link 
              href="/polls" 
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition border border-white/30"
            >
              <ChartBarIcon className="w-5 h-5" />
              Δες Ψηφοφορίες
            </Link>
          </div>
        </div>

        {/* Community stats strip */}
        {(statsLoading || metrics) && (
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
              ) : (
                metrics.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <Icon className="w-5 h-5 text-cyan-200 mb-0.5" />
                    <span className="text-2xl font-bold leading-none">
                      {typeof value === 'number' ? value.toLocaleString('el-GR') : '—'}
                    </span>
                    <span className="text-xs font-medium text-cyan-100/80 uppercase tracking-wider">{label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
