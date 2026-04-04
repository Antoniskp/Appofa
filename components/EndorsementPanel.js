'use client';

import { useState, useEffect, useCallback } from 'react';
import { endorsementAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import LoginLink from '@/components/ui/LoginLink';

const TOPICS = [
  'Education',
  'Economy',
  'Health',
  'Environment',
  'Local Governance',
  'Technology',
];

const TOPIC_LABELS = {
  Education: 'Παιδεία',
  Economy: 'Οικονομία',
  Health: 'Υγεία',
  Environment: 'Περιβάλλον',
  'Local Governance': 'Τοπική Αυτοδιοίκηση',
  Technology: 'Τεχνολογία',
};

export default function EndorsementPanel({ targetUserId }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const isAuthenticated = !authLoading && !!authUser;
  const isSelf = authUser?.id === targetUserId;

  const [topicCounts, setTopicCounts] = useState({});
  const [endorsedTopics, setEndorsedTopics] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [togglingTopic, setTogglingTopic] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!targetUserId) return;
    setLoadingStatus(true);
    try {
      if (isAuthenticated && !isSelf) {
        const res = await endorsementAPI.getStatus(targetUserId);
        if (res.success) {
          setEndorsedTopics(res.data.endorsedTopics || []);
          setTopicCounts(res.data.topicCounts || {});
        }
      } else {
        // Fetch public counts only (no auth)
        const res = await endorsementAPI.getStatus(targetUserId).catch(() => null);
        if (res?.success) {
          setTopicCounts(res.data.topicCounts || {});
        }
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingStatus(false);
    }
  }, [targetUserId, isAuthenticated, isSelf]);

  useEffect(() => {
    if (!authLoading) {
      fetchStatus();
    }
  }, [fetchStatus, authLoading]);

  const toggleEndorsement = async (topic) => {
    if (!isAuthenticated || isSelf || togglingTopic) return;
    setTogglingTopic(topic);
    try {
      const alreadyEndorsed = endorsedTopics.includes(topic);
      if (alreadyEndorsed) {
        const res = await endorsementAPI.removeEndorsement(targetUserId, topic);
        if (res.success) {
          setEndorsedTopics((prev) => prev.filter((t) => t !== topic));
          setTopicCounts((prev) => ({
            ...prev,
            [topic]: Math.max(0, (prev[topic] || 0) - 1)
          }));
          success('Η έγκριση αφαιρέθηκε.');
        }
      } else {
        const res = await endorsementAPI.endorse(targetUserId, topic);
        if (res.success) {
          setEndorsedTopics((prev) => [...prev, topic]);
          setTopicCounts((prev) => ({
            ...prev,
            [topic]: (prev[topic] || 0) + 1
          }));
          success('Η έγκριση καταχωρίστηκε!');
        }
      }
    } catch {
      showError('Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setTogglingTopic(null);
    }
  };

  const totalEndorsements = Object.values(topicCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Εγκρίσεις Κοινότητας</h2>
        {totalEndorsements > 0 && (
          <span className="text-sm text-gray-500">{totalEndorsements} συνολικά</span>
        )}
      </div>

      {loadingStatus ? (
        <div className="space-y-2">
          {TOPICS.map((t) => (
            <div key={t} className="h-9 bg-gray-100 animate-pulse rounded-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => {
            const count = topicCounts[topic] || 0;
            const endorsed = endorsedTopics.includes(topic);
            const isToggling = togglingTopic === topic;
            const canToggle = isAuthenticated && !isSelf;

            return (
              <button
                key={topic}
                onClick={() => canToggle && toggleEndorsement(topic)}
                disabled={isToggling || !canToggle}
                title={
                  isSelf
                    ? 'Δεν μπορείτε να εγκρίνετε τον εαυτό σας'
                    : !isAuthenticated
                    ? 'Συνδεθείτε για να εγκρίνετε'
                    : endorsed
                    ? 'Κάντε κλικ για αφαίρεση έγκρισης'
                    : 'Κάντε κλικ για έγκριση'
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  endorsed
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
                } ${canToggle && !isToggling ? 'hover:border-blue-400 cursor-pointer' : 'cursor-default'} ${
                  isToggling ? 'opacity-60' : ''
                }`}
              >
                <span>{TOPIC_LABELS[topic]}</span>
                {count > 0 && (
                  <span
                    className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${
                      endorsed ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!authLoading && !isAuthenticated && (
        <p className="mt-3 text-xs text-gray-500">
          <LoginLink className="text-blue-600 hover:underline">
            Συνδεθείτε
          </LoginLink>{' '}
          για να εγκρίνετε αυτόν τον χρήστη για ένα θέμα.
        </p>
      )}

      {!authLoading && isAuthenticated && !isSelf && (
        <p className="mt-3 text-xs text-gray-500">
          Κάντε κλικ σε ένα θέμα για να εγκρίνετε ή να αφαιρέσετε την έγκρισή σας.
        </p>
      )}
    </div>
  );
}
