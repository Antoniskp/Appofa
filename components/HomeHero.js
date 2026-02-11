'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { statsAPI } from '@/lib/api';
import { 
  MapPinIcon, 
  NewspaperIcon, 
  AcademicCapIcon, 
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

/**
 * Hero section for the homepage with gradient background, animations,
 * and community engagement features
 */
export default function HomeHero() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCommunityStats();
  }, []);

  const fetchCommunityStats = async () => {
    try {
      const response = await statsAPI.getCommunityStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load community stats:', err);
      setError(err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-300/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative app-container py-16 md:py-24">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          {!authLoading && user && (
            <p className="text-lg md:text-xl mb-2 text-cyan-100">
              Καλώς ήρθες, {user.firstName || user.username}!
            </p>
          )}
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Η Πλατφόρμα της Τοπικής Κοινότητας
          </h1>
          
          <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto leading-relaxed">
            Ενημέρωση • Εκπαίδευση • Δημοκρατική Συμμετοχή
          </p>
          
          <p className="text-base md:text-lg text-cyan-50 max-w-2xl mx-auto">
            Μια ανοιχτή πλατφόρμα για νέα, άρθρα, εκπαιδευτικό υλικό και δημοκρατικές ψηφοφορίες σε τοπικό επίπεδο
          </p>
        </div>

        {/* Community Stats */}
        {!loadingStats && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition">
              <MapPinIcon className="w-10 h-10 mx-auto mb-3 text-cyan-200" />
              <div className="text-3xl font-bold mb-1">{stats.totalLocations}</div>
              <div className="text-sm text-cyan-100">Καταχωρημένες Περιοχές</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition">
              <UserGroupIcon className="w-10 h-10 mx-auto mb-3 text-cyan-200" />
              <div className="text-3xl font-bold mb-1">{stats.activeUsers}</div>
              <div className="text-sm text-cyan-100">Ενεργοί Χρήστες</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20 hover:bg-white/20 transition">
              <ChartBarIcon className="w-10 h-10 mx-auto mb-3 text-cyan-200" />
              <div className="text-3xl font-bold mb-1">{stats.areasNeedingModerators}</div>
              <div className="text-sm text-cyan-100">Περιοχές Χρειάζονται Συντονιστές</div>
            </div>
          </div>
        )}

        {/* Call-to-Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {!authLoading && !user && (
            <>
              <Link 
                href="/register" 
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-cyan-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Εγγραφή
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition border border-white/30"
              >
                Σύνδεση
              </Link>
            </>
          )}
          
          <Link 
            href="/locations" 
            className="inline-flex items-center gap-2 bg-amber-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-amber-600 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <MapPinIcon className="w-5 h-5" />
            Βρες την Περιοχή σου
          </Link>
          
          <Link 
            href="/articles" 
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition border border-white/30"
          >
            <NewspaperIcon className="w-5 h-5" />
            Περιήγηση Άρθρων
          </Link>
          
          <Link 
            href="/polls" 
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition border border-white/30"
          >
            <ChartBarIcon className="w-5 h-5" />
            Δες Ψηφοφορίες
          </Link>
        </div>

        {/* Moderator Recruitment Section */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-8 md:p-12 mb-12 shadow-2xl animate-fade-in border-2 border-amber-300" style={{ animationDelay: '0.4s' }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/20 backdrop-blur-sm inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🎯 Ευκαιρία Συμμετοχής
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Γίνε Συντονιστής της Περιοχής σου!
            </h2>
            
            <p className="text-lg md:text-xl mb-6 text-amber-50">
              Βοήθησε να οργανώσουμε και να διαχειριστούμε το τοπικό περιεχόμενο της κοινότητάς σου
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <DocumentTextIcon className="w-8 h-8 mb-2 text-amber-100" />
                <h3 className="font-semibold mb-2">Διαχείριση Περιεχομένου</h3>
                <p className="text-sm text-amber-50">Έγκριση άρθρων και ψηφοφοριών για την περιοχή σου</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <MapPinIcon className="w-8 h-8 mb-2 text-amber-100" />
                <h3 className="font-semibold mb-2">Δημιουργία Τοποθεσιών</h3>
                <p className="text-sm text-amber-50">Προσθήκη νέων περιοχών στην πλατφόρμα</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <UserGroupIcon className="w-8 h-8 mb-2 text-amber-100" />
                <h3 className="font-semibold mb-2">Συντονισμός Κοινότητας</h3>
                <p className="text-sm text-amber-50">Οργάνωση και υποστήριξη της τοπικής κοινότητας</p>
              </div>
            </div>

            {stats && stats.areasNeedingModerators > 0 && (
              <p className="text-base mb-6 font-semibold bg-white/20 backdrop-blur-sm inline-block px-6 py-3 rounded-lg">
                ⚡ {stats.areasNeedingModerators} περιοχές χρειάζονται συντονιστές τώρα!
              </p>
            )}

            <Link 
              href="/become-moderator" 
              className="inline-flex items-center gap-2 bg-white text-orange-600 px-10 py-4 rounded-lg font-bold text-lg hover:bg-amber-50 transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Υποβολή Αίτησης
              <ArrowRightIcon className="w-6 h-6" />
            </Link>
          </div>
        </div>

        {/* Feature Cards - Three Pillars */}
        <div className="grid md:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 hover:bg-white/15 transition transform hover:-translate-y-2 hover:shadow-2xl">
            <NewspaperIcon className="w-12 h-12 mb-4 text-cyan-200" />
            <h3 className="text-2xl font-bold mb-3">📰 Ενημέρωση</h3>
            <p className="text-cyan-50">
              Νέα και άρθρα από την τοπική σου κοινότητα. Μείνε ενημερωμένος για τα σημαντικά γεγονότα της περιοχής σου.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 hover:bg-white/15 transition transform hover:-translate-y-2 hover:shadow-2xl">
            <AcademicCapIcon className="w-12 h-12 mb-4 text-cyan-200" />
            <h3 className="text-2xl font-bold mb-3">🎓 Εκπαίδευση</h3>
            <p className="text-cyan-50">
              Εκπαιδευτικό υλικό και πόροι για να μάθεις περισσότερα για την κοινότητα, την ιστορία και τον πολιτισμό της.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 hover:bg-white/15 transition transform hover:-translate-y-2 hover:shadow-2xl">
            <ChartBarIcon className="w-12 h-12 mb-4 text-cyan-200" />
            <h3 className="text-2xl font-bold mb-3">🗳️ Δημοκρατική Συμμετοχή</h3>
            <p className="text-cyan-50">
              Συμμετέχε σε ψηφοφορίες και εκφράζε τη γνώμη σου για θέματα που αφορούν την τοπική κοινότητα.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
