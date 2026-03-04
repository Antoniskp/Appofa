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
  CheckBadgeIcon,
  ShieldCheckIcon,
  UserPlusIcon,
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
        <div className="absolute top-6 left-10 w-56 h-56 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-4 right-10 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-indigo-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative app-container py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 animate-fade-in">

          {/* Left – text & actions */}
          <div className="flex-1 min-w-0">
            {!authLoading && user && (
              <p className="text-sm mb-1 text-cyan-100 font-medium">
                Καλώς ήρθες, {user.firstName || user.username}!
              </p>
            )}

            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight tracking-tight">
              Αποφάσεις που ξεκινούν από εσένα.
            </h1>

            <p className="text-base text-cyan-50/90 mb-5">
              Συμμετείχε σε ανοιχτές ψηφοφορίες, κατέθεσε προτάσεις και επηρέασε τις εξελίξεις στην περιοχή σου με διαφάνεια και πραγματικό αντίκτυπο.
            </p>

            <div className="flex flex-wrap gap-3" style={{ animationDelay: '0.2s' }}>
              <Link 
                href={!authLoading && user?.homeLocation ? `/locations/${user.homeLocation.slug}` : '/locations'} 
                className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-600 focus:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-white/50 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:-translate-y-0.5 transform"
              >
                <MapPinIcon className="w-4 h-4" />
                {!authLoading && user?.homeLocation ? 'Δες την Περιοχή σου' : 'Βρες την Περιοχή σου'}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>

              <Link 
                href="/polls" 
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition border border-white/30"
              >
                <ChartBarIcon className="w-4 h-4" />
                Δες Ψηφοφορίες
              </Link>

              {!authLoading && user && (
                (user.role === 'admin' || user.role === 'moderator') ? (
                  <Link 
                    href="/admin" 
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition border border-white/30"
                  >
                    <ShieldCheckIcon className="w-4 h-4" />
                    Admin / Moderator
                  </Link>
                ) : (
                  <Link 
                    href="/become-moderator" 
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/20 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition border border-white/30"
                  >
                    <ShieldCheckIcon className="w-4 h-4" />
                    Γίνε Moderator
                  </Link>
                )
              )}

              {!authLoading && !user && (
                <Link 
                  href="/register" 
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-cyan-50 focus:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white/50 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:-translate-y-0.5 transform"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  Εγγραφή
                </Link>
              )}
            </div>
          </div>

          {/* Right – community stats */}
          {(statsLoading || metrics) && (
            <div className="md:w-64 lg:w-72 shrink-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-4 grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {statsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                ) : (
                  metrics.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <Icon className="w-4 h-4 text-cyan-200 mb-0.5" />
                      <span className="text-xl font-bold leading-none">
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
      </div>
    </section>
  );
}
