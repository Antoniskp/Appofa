'use client';

import { useState, useEffect, useCallback } from 'react';
import { dreamTeamAPI } from '@/lib/api/dreamTeamAPI.js';
import { useAuth } from '@/lib/auth-context';
import FormationView from '@/components/dream-team/FormationView';
import SkeletonPositionCard from '@/components/dream-team/SkeletonPositionCard';

export default function SharedFormationPage({ params }) {
  const { slug } = params;
  const { user } = useAuth();
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await dreamTeamAPI.getSharedFormation(slug);
        if (res?.success) {
          setFormation(res.data);
        } else if (/^\d+$/.test(slug)) {
          // Fallback: slug looks like a numeric ID — try fetching by primary key
          const fallback = await dreamTeamAPI.getFormation(slug);
          if (fallback?.success) {
            setFormation(fallback.data);
          } else {
            setError(fallback?.message || 'Η σύνθεση δεν βρέθηκε');
          }
        } else {
          setError(res?.message || 'Η σύνθεση δεν βρέθηκε');
        }
      } catch (err) {
        setError(err.message || 'Σφάλμα κατά τη φόρτωση');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleLike = useCallback(async () => {
    if (!formation) return;
    try {
      const res = await dreamTeamAPI.likeFormation(formation.id);
      if (res?.success) {
        setFormation((prev) => ({
          ...prev,
          likedByMe: res.data?.likedByMe,
          likeCount: res.data?.likeCount ?? prev.likeCount,
        }));
      }
    } catch {
      showToast('Σφάλμα κατά την καταγραφή like', 'error');
    }
  }, [formation]);

  const isOwner = user && formation && user.id === formation.userId;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            }`}
            role="alert"
          >
            {toast.message}
          </div>
        )}

        {/* Back link */}
        <div className="mb-6">
          <a
            href="/dream-team"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Πίσω στο Dream Team
          </a>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <SkeletonPositionCard key={i} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <span className="text-4xl mb-4 block">🏛️</span>
            <p className="text-lg font-bold text-gray-800 mb-2">Η σύνθεση δεν βρέθηκε</p>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <a
              href="/dream-team"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              🏛️ Dream Team
            </a>
          </div>
        ) : (
          <FormationView
            formation={formation}
            showToast={showToast}
            onLike={user && !isOwner ? handleLike : undefined}
            isOwner={isOwner}
          />
        )}
      </div>
    </div>
  );
}
