'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import StaticPageLayout from '@/components/StaticPageLayout';
import ContactForm from '@/components/ContactForm';
import { useAuth } from '@/lib/auth-context';
import { messageAPI } from '@/lib/api';

/** Map internal application stage to i18n key */
const STAGE_LABELS = {
  submitted: 'mod_stage_submitted',
  under_review: 'mod_stage_under_review',
  decision_available: 'mod_stage_decision_available',
  closed: 'mod_stage_closed',
};

const STAGE_COLORS = {
  submitted: 'bg-blue-50 border-blue-200 text-blue-800',
  under_review: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  decision_available: 'bg-purple-50 border-purple-200 text-purple-800',
  closed: 'bg-gray-50 border-gray-200 text-gray-700',
};

function ModeratorFirstActions({ t }) {
  const actions = [
    { key: 'location', href: '/locations', label: t('mod_action_location') },
    { key: 'info', href: '/locations', label: t('mod_action_info') },
    { key: 'rules', href: '/pages/community-rules', label: t('mod_action_rules') },
    { key: 'reports', href: '/admin/reports', label: t('mod_action_reports') },
  ];

  return (
    <section className="mb-8" aria-labelledby="first-actions-heading">
      <h3 id="first-actions-heading" className="text-xl font-semibold mb-4">{t('mod_first_actions_title')}</h3>
      <ul className="space-y-3" role="list">
        {actions.map((action) => (
          <li key={action.key}>
            <Link
              href={action.href}
              className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800 hover:bg-indigo-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {action.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ApplicationStatusCard({ application, t }) {
  const stage = application?.stage || 'submitted';
  const colorClass = STAGE_COLORS[stage] || STAGE_COLORS.submitted;

  const bodyKey = {
    submitted: 'mod_pending_body',
    under_review: 'mod_pending_body',
    decision_available: 'mod_decision_body',
    closed: 'mod_stage_closed',
  }[stage] || 'mod_pending_body';

  return (
    <section className={`rounded-lg border p-5 mb-8 ${colorClass}`} aria-labelledby="app-status-heading">
      <div className="flex items-center gap-2 mb-3">
        <ClockIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <h3 id="app-status-heading" className="font-semibold">{t('mod_status_title')}</h3>
      </div>
      <p className="text-sm font-medium mb-1">
        {t(STAGE_LABELS[stage] || 'mod_stage_submitted')}
      </p>
      <p className="text-sm">{t(bodyKey)}</p>
      {application?.createdAt && (
        <p className="text-xs mt-2 opacity-70">
          {t('mod_submitted_at')}: {new Date(application.createdAt).toLocaleDateString('el-GR')}
        </p>
      )}
      {stage === 'decision_available' && application?.response && (
        <div className="mt-4 rounded-lg border border-current/20 bg-white/60 p-3">
          <p className="text-xs font-semibold mb-1">{t('mod_response_label')}</p>
          <p className="text-sm whitespace-pre-wrap">{application.response}</p>
        </div>
      )}
    </section>
  );
}

export default function BecomeModeratorPage() {
  const t = useTranslations('onboarding');
  const { user, loading: authLoading } = useAuth();
  const [appState, setAppState] = useState(null); // null = loading, 'ready' = done
  const [applicationData, setApplicationData] = useState(null);
  const [isApprovedModerator, setIsApprovedModerator] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadApplicationStatus = useCallback(async () => {
    if (!user) {
      setAppState('ready');
      return;
    }
    try {
      const res = await messageAPI.getMyModeratorApplication();
      if (res.success) {
        setApplicationData(res.data.application || null);
        setIsApprovedModerator(res.data.isApprovedModerator || false);
      }
    } catch {
      // fail-open: show form
    } finally {
      setAppState('ready');
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadApplicationStatus();
    }
  }, [authLoading, loadApplicationStatus]);

  const handleSuccess = () => {
    // Reload the status instead of redirecting
    setSubmitted(true);
    loadApplicationStatus();
  };

  // Active application: pending, under_review stages block re-submission
  const hasActiveApplication =
    applicationData &&
    ['submitted', 'under_review'].includes(applicationData.stage);

  const showForm = !isApprovedModerator && !hasActiveApplication && !submitted;

  return (
    <StaticPageLayout
      title="Γίνε Moderator"
      maxWidth="max-w-3xl"
      breadcrumb={
        <Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">
          ← Σελίδες
        </Link>
      }
    >
      {/* Introduction */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-indigo-900 mb-3">Βοήθησε την κοινότητά σου</h2>
        <p className="text-gray-700">
          Οι moderators είναι οι φύλακες της ποιότητας και της τάξης στην πλατφόρμα. Αν θέλεις να
          συμβάλεις στη διαμόρφωση της συζήτησης στην περιοχή σου, κάνε αίτηση παρακάτω.
        </p>
      </div>

      {/* Approved moderator view */}
      {isApprovedModerator && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 mb-8" role="status">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircleSolid className="h-8 w-8 text-green-500 flex-shrink-0" aria-hidden="true" />
            <h2 className="text-xl font-bold text-green-900">{t('mod_approved_title')}</h2>
          </div>
          <p className="text-green-800 text-sm mb-4">{t('mod_approved_body')}</p>
        </div>
      )}

      {/* First-actions for approved moderators */}
      {isApprovedModerator && <ModeratorFirstActions t={t} />}

      {/* Pending / decision / closed application status */}
      {!isApprovedModerator && applicationData && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
            <span>{t('mod_applied_notice')}</span>
          </div>
          <ApplicationStatusCard application={applicationData} t={t} />
        </div>
      )}

      {/* Post-submission confirmation (shown after new submission in this session) */}
      {submitted && !applicationData && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-8" role="status" aria-live="polite">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheckIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <p className="font-semibold text-blue-900">{t('mod_stage_submitted')}</p>
          </div>
          <p className="text-sm text-blue-800">{t('mod_pending_body')}</p>
        </div>
      )}

      {/* Benefits section — always shown unless approved */}
      {!isApprovedModerator && (
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Τι κάνει ένας Moderator;</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-700 mb-2">✓ Διαχείριση Περιεχομένου</h4>
              <p className="text-sm text-gray-700">
                Έγκριση και έλεγχος άρθρων και ψηφοφοριών για την περιοχή σου
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-700 mb-2">✓ Δημιουργία Locations</h4>
              <p className="text-sm text-gray-700">
                Προσθήκη νέων τοποθεσιών και οργάνωση της ιεραρχίας
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-700 mb-2">✓ Συντονισμός Κοινότητας</h4>
              <p className="text-sm text-gray-700">
                Διασφάλιση ότι οι κανόνες τηρούνται και η συζήτηση παραμένει εποικοδομητική
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-700 mb-2">✓ Ειδικά Δικαιώματα</h4>
              <p className="text-sm text-gray-700">
                Πρόσβαση σε εργαλεία διαχείρισης και moderator dashboard
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Requirements section — shown when form is available */}
      {showForm && (
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Απαιτήσεις</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Ενεργός λογαριασμός στην πλατφόρμα</li>
            <li>Κατανόηση των κανόνων και της αποστολής της πλατφόρμας</li>
            <li>Διάθεση να αφιερώσεις χρόνο για τη διαχείριση</li>
            <li>Δίκαιη και αμερόληπτη κρίση</li>
            <li>Σεβασμός στην κοινότητα και τις διαφορετικές απόψεις</li>
          </ul>
        </section>
      )}

      {/* Application form — shown only when eligible */}
      {showForm && (
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Αίτηση</h3>
          <p className="text-gray-700 mb-6">
            Συμπλήρωσε την παρακάτω φόρμα για να κάνεις αίτηση. Εξήγησε γιατί θέλεις να γίνεις
            moderator και ποια εμπειρία έχεις (αν υπάρχει).
          </p>
          <ContactForm
            type="moderator_application"
            showLocationSelector={true}
            submitButtonText="Υποβολή Αίτησης"
            onSuccess={handleSuccess}
          />
        </section>
      )}
    </StaticPageLayout>
  );
}
