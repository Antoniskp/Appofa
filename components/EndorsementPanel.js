'use client';

import { useState, useEffect, useCallback } from 'react';
import { endorsementAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import LoginLink from '@/components/ui/LoginLink';

const TOPICS = [
  'Real Profile',
  'Knows Personally',
  'Worked Together',
  'Local Connection',
];

const TOPIC_LABELS = {
  'Real Profile': 'Πραγματικό προφίλ',
  'Knows Personally': 'Τον/την γνωρίζω',
  'Worked Together': 'Έχουμε συνεργαστεί',
  'Local Connection': 'Τοπική σύνδεση',
};

const TOPIC_HELPERS = {
  'Real Profile': 'Το προφίλ αντιστοιχεί στο πραγματικό πρόσωπο.',
  'Knows Personally': 'Υπάρχει προσωπική γνωριμία με αυτό το άτομο.',
  'Worked Together': 'Υπήρξε συνεργασία σε εργασία, ομάδα ή δράση.',
  'Local Connection': 'Υπάρχει σύνδεση με την κοινότητα ή την περιοχή.',
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
      const res = await endorsementAPI.getStatus(targetUserId);
      if (res?.success) {
        setEndorsedTopics(res.data.endorsedTopics || []);
        setTopicCounts(res.data.topicCounts || {});
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingStatus(false);
    }
  }, [targetUserId]);

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
          success('Η επιβεβαίωση αφαιρέθηκε.');
        }
      } else {
        const res = await endorsementAPI.endorse(targetUserId, topic);
        if (res.success) {
          setEndorsedTopics((prev) => [...prev, topic]);
          setTopicCounts((prev) => ({
            ...prev,
            [topic]: (prev[topic] || 0) + 1
          }));
          success('Η επιβεβαίωση καταχωρίστηκε.');
        }
      }
    } catch {
      showError('Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setTogglingTopic(null);
    }
  };

  const totalEndorsements = TOPICS.reduce((total, topic) => total + (topicCounts[topic] || 0), 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Επιβεβαιώσεις κοινότητας</h2>
        {totalEndorsements > 0 && (
          <span className="text-sm text-gray-500">{totalEndorsements} συνολικά</span>
        )}
      </div>

      {loadingStatus ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {TOPICS.map((t) => (
            <div key={t} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
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
                    ? 'Δεν μπορείτε να επιβεβαιώσετε τον εαυτό σας'
                    : !isAuthenticated
                    ? 'Συνδεθείτε για επιβεβαίωση'
                    : endorsed
                    ? 'Κάντε κλικ για αφαίρεση'
                    : TOPIC_HELPERS[topic]
                }
                className={`flex min-h-[64px] items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                  endorsed
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-white text-gray-700 border-gray-300'
                } ${canToggle && !isToggling ? 'hover:border-blue-400 hover:bg-blue-50 cursor-pointer' : 'cursor-default'} ${
                  isToggling ? 'opacity-60' : ''
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold">{TOPIC_LABELS[topic]}</span>
                  <span className="mt-1 block text-xs leading-5 text-gray-500">{TOPIC_HELPERS[topic]}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                    endorsed ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
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
          για να επιβεβαιώσετε μια πραγματική σχέση με αυτόν τον χρήστη.
        </p>
      )}

      {!authLoading && isAuthenticated && !isSelf && (
        <p className="mt-3 text-xs text-gray-500">
          Επιλέξτε μόνο όσα γνωρίζετε προσωπικά. Οι επιβεβαιώσεις είναι για πραγματικές σχέσεις, όχι για πολιτική συμφωνία.
        </p>
      )}
    </div>
  );
}
