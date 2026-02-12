'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  MapPinIcon, 
  ChartBarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function HomeHero() {
  const { user, loading: authLoading } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative app-container py-6 md:py-8">
        <div className="text-center animate-fade-in max-w-3xl mx-auto">
          {!authLoading && user && (
            <p className="text-base md:text-lg mb-2 text-cyan-100">
              Καλώς ήρθες, {user.firstName || user.username}!
            </p>
          )}

          <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">
            Η πλατφόρμα της τοπικής κοινότητας
          </h1>

          <p className="text-base md:text-lg text-cyan-50 mb-5">
            Νέα, άρθρα και ψηφοφορίες για την περιοχή σου.
          </p>

          <div className="flex flex-wrap gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Link 
            href="/locations" 
            className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-3 rounded-lg font-semibold hover:bg-amber-600 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <MapPinIcon className="w-5 h-5" />
            Βρες την Περιοχή σου
            <ArrowRightIcon className="w-5 h-5" />
          </Link>

          <Link 
            href="/polls" 
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-5 py-3 rounded-lg font-semibold hover:bg-white/20 transition border border-white/30"
          >
            <ChartBarIcon className="w-5 h-5" />
            Δες Ψηφοφορίες
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}
