'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ChevronRightIcon,
  XMarkIcon,
  NewspaperIcon,
  VideoCameraIcon,
  ChartBarIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { authAPI, messageAPI, candidateRegistrationAPI, onboardingEventAPI } from '@/lib/api';
import { getAccountLandingPath } from '@/lib/auth-redirect';
import EmailVerificationNotice from '@/components/onboarding/EmailVerificationNotice';
import LocationStep from '@/components/onboarding/LocationStep';
import ProtectedRoute from '@/components/ProtectedRoute';
import StartParticipation from '@/components/onboarding/StartParticipation';

// Creator contribution templates — route to existing creation flows
const CREATOR_TEMPLATES = [
  { key: 'article', Icon: NewspaperIcon, href: '/articles/create', labelKey: 'template_article_label', descKey: 'template_article_desc' },
  { key: 'news', Icon: NewspaperIcon, href: '/news/create', labelKey: 'template_news_label', descKey: 'template_news_desc' },
  { key: 'poll', Icon: ChartBarIcon, href: '/polls/create', labelKey: 'template_poll_label', descKey: 'template_poll_desc' },
  { key: 'suggestion', Icon: LightBulbIcon, href: '/civic-questions/create', labelKey: 'template_suggestion_label', descKey: 'template_suggestion_desc' },
  { key: 'video', Icon: VideoCameraIcon, href: '/videos/create', labelKey: 'template_video_label', descKey: 'template_video_desc' },
];

/** Derive per-goal checklist items from actual user data */
function buildChecklist(goal, onboardingData, t, extendedData) {
  const {
    emailVerified,
    firstNameNative,
    lastNameNative,
    bio,
    avatar,
    homeLocationId,
    nationality,
  } = onboardingData || {};

  const {
    moderatorApplication,
    isApprovedModerator,
    hasContributed,
    hasCandidateRegistration,
  } = extendedData || {};

  const commonSteps = [
    {
      key: 'email',
      label: t('step_email'),
      doneLabel: t('step_email_done'),
      action: t('step_email_action'),
      done: Boolean(emailVerified),
      href: '/profile#profile',
    },
    {
      key: 'fullname',
      label: t('step_fullname'),
      doneLabel: t('step_fullname_done'),
      action: t('step_fullname_action'),
      done: Boolean(firstNameNative && lastNameNative),
      href: '/profile#profile',
    },
    {
      key: 'location',
      label: t('step_location'),
      doneLabel: t('step_location_done'),
      action: t('step_location_action'),
      done: Boolean(homeLocationId),
      href: '/profile#location-politics',
    },
    {
      key: 'avatar',
      label: t('step_avatar'),
      doneLabel: t('step_avatar_done'),
      action: t('step_avatar_action'),
      done: Boolean(avatar),
      href: '/profile#profile',
    },
  ];

  // Build moderator application step based on real status
  const buildModeratorApplyStep = () => {
    if (isApprovedModerator) {
      return {
        key: 'moderator_apply',
        label: t('step_moderator_apply_done'),
        doneLabel: t('step_moderator_apply_done'),
        action: t('step_moderator_apply_action'),
        done: true,
        href: '/become-moderator',
      };
    }
    if (moderatorApplication && ['submitted', 'under_review'].includes(moderatorApplication.stage)) {
      return {
        key: 'moderator_apply',
        label: t('step_moderator_apply_pending'),
        doneLabel: t('step_moderator_apply_pending'),
        action: t('step_moderator_apply_action'),
        done: false,
        href: '/become-moderator',
        statusBadge: t(`mod_stage_${moderatorApplication.stage}`) || t('mod_stage_submitted'),
      };
    }
    return {
      key: 'moderator_apply',
      label: t('step_moderator_apply'),
      doneLabel: t('step_moderator_apply'),
      action: t('step_moderator_apply_action'),
      done: false,
      href: '/become-moderator',
    };
  };

  const goalExtras = {
    moderator: [
      {
        key: 'nationality',
        label: t('step_nationality'),
        doneLabel: t('step_nationality_done'),
        action: t('step_nationality_action'),
        done: Boolean(nationality),
        href: '/profile#location-politics',
      },
      {
        key: 'bio',
        label: t('step_bio'),
        doneLabel: t('step_bio_done'),
        action: t('step_bio_action'),
        done: Boolean(bio),
        href: '/profile#profile',
      },
      buildModeratorApplyStep(),
    ],
    creator: [
      {
        key: 'bio',
        label: t('step_bio'),
        doneLabel: t('step_bio_done'),
        action: t('step_bio_action'),
        done: Boolean(bio),
        href: '/profile#profile',
      },
      {
        key: 'first_content',
        label: t('step_first_content'),
        doneLabel: t('step_first_content_done'),
        action: t('step_first_content_action'),
        done: Boolean(hasContributed),
        href: '/polls/create',
      },
    ],
    independent: [
      {
        key: 'nationality',
        label: t('step_nationality'),
        doneLabel: t('step_nationality_done'),
        action: t('step_nationality_action'),
        done: Boolean(nationality),
        href: '/profile#location-politics',
      },
      {
        key: 'bio',
        label: t('step_bio'),
        doneLabel: t('step_bio_done'),
        action: t('step_bio_action'),
        done: Boolean(bio),
        href: '/profile#profile',
      },
      {
        key: 'person_search',
        label: t('step_person_search'),
        action: t('step_person_search_action'),
        optional: true,
        href: '/users',
      },
      {
        key: 'candidate_register',
        label: t('step_candidate_register'),
        doneLabel: t('step_candidate_register_done'),
        action: t('step_candidate_register_action'),
        done: Boolean(hasCandidateRegistration),
        href: '/candidates/register',
        notice: hasCandidateRegistration ? t('candidate_registration_notice') : undefined,
      },
    ],
    citizen: [
      {
        key: 'nationality',
        label: t('step_nationality'),
        doneLabel: t('step_nationality_done'),
        action: t('step_nationality_action'),
        done: Boolean(nationality),
        href: '/profile#location-politics',
      },
    ],
  };

  return [...commonSteps, ...(goalExtras[goal] || [])];
}

function ChecklistStep({ step, isNextAction }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
        isNextAction && !step.done
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-gray-50'
      }`}
    >
      {!step.optional && <div className="flex-shrink-0">
        {step.done ? (
          <CheckCircleSolid className="h-5 w-5 text-green-500" aria-label="Done" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300" aria-hidden="true" />
        )}
      </div>}
      <span className={`flex-1 text-sm ${step.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
        {step.done ? step.doneLabel : step.label}
      </span>
      {step.statusBadge && !step.done && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
          {step.statusBadge}
        </span>
      )}
      {!step.done && (
        <Link
          href={step.href}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline focus:outline-none focus:underline"
        >
          {step.action}
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/** Creator template selection panel shown under the first_content step */
function CreatorTemplates({ t }) {
  return (
    <div className="mt-3 mb-2 rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
        {t('creator_templates_title')}
      </p>
      <p className="text-xs text-gray-500 mb-3">{t('creator_intro')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CREATOR_TEMPLATES.map(({ key, Icon, href, labelKey, descKey }) => (
          <Link
            key={key}
            href={href}
            className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Icon className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold text-gray-900">{t(labelKey)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t(descKey)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Independent profile readiness panel */
function IndependentProfilePanel({ onboardingData, t }) {
  const { emailVerified, firstNameNative, bio, homeLocationId, username } = onboardingData || {};
  const missing = [];
  if (!emailVerified) missing.push(t('step_email'));
  if (!firstNameNative) missing.push(t('step_fullname'));
  if (!homeLocationId) missing.push(t('step_location'));
  if (!bio) missing.push(t('step_bio'));

  if (missing.length === 0 && !username) return null;

  return (
    <div className="mt-3 mb-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
        {t('independent_profile_title')}
      </p>
      {missing.length > 0 && (
        <ul className="space-y-1 mb-3">
          {missing.map((item) => (
            <li key={item} className="flex items-center gap-1.5 text-xs text-indigo-800">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}
      {username && (
        <Link
          href={`/users/${username}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:underline focus:outline-none focus:underline"
        >
          {t('independent_preview_link')}
          <ChevronRightIcon className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function OnboardingContent() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [phase, setPhase] = useState('loading');
  const [onboardingData, setOnboardingData] = useState(null);
  const primaryGoal = onboardingData?.onboardingGoal;
  const destination = getAccountLandingPath(onboardingData?.homeLocationId);
  // Extended data per goal (loaded lazily when checklist phase activates)
  const [extendedData, setExtendedData] = useState({});
  const [extendedLoading, setExtendedLoading] = useState(false);

  const loadOnboarding = useCallback(async () => {
    try {
      const res = await authAPI.getOnboarding();
      const data = res.success ? res.data.onboarding : null;
      if (!data?.onboardingGoal) {
        setPhase('basic');
        return;
      }
      setOnboardingData(data);
      const editLocation = new URLSearchParams(window.location.search).get('step') === 'location';
      setPhase(editLocation ? 'location' : 'checklist');
      onboardingEventAPI.record({ eventType: 'onboarding_viewed' }).catch(() => {});
    } catch {
      setPhase('basic');
    }
  }, []);

  useEffect(() => {
    loadOnboarding();
  }, [loadOnboarding]);

  // Load goal-specific extended data when the checklist phase activates
  const loadExtendedData = useCallback(async (goal) => {
    if (!goal) return;
    setExtendedLoading(true);
    try {
      const next = {};

      if (goal === 'moderator') {
        const res = await messageAPI.getMyModeratorApplication();
        if (res.success) {
          next.moderatorApplication = res.data.application || null;
          next.isApprovedModerator = res.data.isApprovedModerator || false;
        }
      }

      if (goal === 'creator') {
        const res = await authAPI.getContributionSummary();
        if (res.success) {
          next.hasContributed = res.data.summary.hasContributed;
        }
      }

      if (goal === 'independent') {
        const res = await candidateRegistrationAPI.getMine({ limit: 1 });
        if (res.success) {
          const regs = res.data?.registrations || [];
          next.hasCandidateRegistration = regs.length > 0;
          next.candidateRegistration = regs[0] || null;
        }
      }

      setExtendedData(next);
    } catch (err) {
      console.error('Failed to load extended onboarding data:', err);
      // fail-open: extended data stays empty
    } finally {
      setExtendedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (phase === 'checklist' && primaryGoal) {
      loadExtendedData(primaryGoal);
    }
  }, [phase, primaryGoal, loadExtendedData]);

  const handleSkip = async () => {
    try {
      await authAPI.updateOnboarding({ dismissed: true });
      onboardingEventAPI.record({ eventType: 'onboarding_dismissed', goal: primaryGoal || null }).catch(() => {});
    } catch {
      // ignore
    }
    router.replace(destination);
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  if (phase === 'basic') return <StartParticipation />;

  const checklist = phase === 'checklist' && primaryGoal
    ? buildChecklist(primaryGoal, onboardingData, t, extendedData)
    : [];
  const requiredSteps = checklist.filter((step) => !step.optional);
  const doneCount = requiredSteps.filter((step) => step.done).length;
  const totalCount = requiredSteps.length;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const nextStep = requiredSteps.find((step) => !step.done);
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return <>
    <EmailVerificationNotice />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          Appofasi
        </Link>
        <button
          type="button"
          onClick={handleSkip}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label={t('skip')}
        >
          <XMarkIcon className="h-4 w-4" />
          {t('skip')}
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12 pt-6 sm:pt-10">
        <div className="w-full max-w-xl">
          {phase === 'location' && <LocationStep onContinue={async () => {
            const res = await authAPI.getOnboarding();
            if (!res.success) throw new Error('Could not refresh your profile. Please retry.');
            setOnboardingData(res.data.onboarding);
            setPhase(res.data.onboarding.onboardingGoal ? 'checklist' : 'basic');
          }} />}
          {phase === 'checklist' && primaryGoal && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{t('your_checklist')}</h1>
                {!allDone && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {t('progress_label', { done: doneCount, total: totalCount })}
                  </p>
                )}
              </div>

              {/* Progress bar */}
              <div className="mb-6" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={t('progress_label', { done: doneCount, total: totalCount })}>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {allDone ? (
                <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center mb-6">
                  <CheckCircleSolid className="h-10 w-10 text-green-500 mx-auto mb-2" aria-hidden="true" />
                  <h2 className="text-lg font-bold text-green-900">{t('all_done_title')}</h2>
                  <p className="text-sm text-green-800 mt-1">{t('all_done_body')}</p>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    {/* Goal-specific next destination */}
                    {primaryGoal === 'moderator' && extendedData.isApprovedModerator && (
                      <Link
                        href="/moderator"
                        onClick={() => {
                          authAPI.updateOnboarding({ completed: true }).catch(() => {});
                          onboardingEventAPI.record({ eventType: 'onboarding_completed', goal: primaryGoal }).catch(() => {});
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        {t('go_to_moderator_workspace')}
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                    )}
                    {primaryGoal === 'creator' && extendedData.hasContributed && (
                      <Link
                        href="/creator"
                        onClick={() => {
                          authAPI.updateOnboarding({ completed: true }).catch(() => {});
                          onboardingEventAPI.record({ eventType: 'onboarding_completed', goal: primaryGoal }).catch(() => {});
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        {t('go_to_creator_workspace')}
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                    )}
                    <Link
                      href={destination}
                      replace
                      onClick={() => {
                        authAPI.updateOnboarding({ completed: true }).catch(() => {});
                        onboardingEventAPI.record({ eventType: 'onboarding_completed', goal: primaryGoal }).catch(() => {});
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:underline focus:outline-none focus:underline"
                    >
                      {t('explore_platform')}
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : nextStep && (
                <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">{t('next_step_label')}</p>
                  <Link
                    href={nextStep.href}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-900 hover:underline focus:outline-none focus:underline"
                  >
                    {nextStep.action}
                    <ChevronRightIcon className="h-4 w-4 text-blue-600" />
                  </Link>
                </div>
              )}

              {extendedLoading ? (
                <div className="flex justify-center py-4" aria-label="Loading checklist details">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-2" role="list" aria-label={t('your_checklist')}>
                  {checklist.map((step) => (
                    <div key={step.key} role="listitem">
                      <ChecklistStep step={step} isNextAction={step.key === nextStep?.key} />
                      {/* Creator templates panel — shown directly under first_content step */}
                      {step.key === 'first_content' && primaryGoal === 'creator' && !step.done && (
                        <CreatorTemplates t={t} />
                      )}
                      {/* Independent profile readiness panel */}
                      {step.key === 'person_search' && primaryGoal === 'independent' && (
                        <IndependentProfilePanel onboardingData={onboardingData} t={t} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!allDone && (
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
                  >
                    {t('skip')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </>;
}

function OnboardingRoute() {
  const params = useSearchParams();
  return params.get('mode') === 'advanced' ? <OnboardingContent /> : <StartParticipation />;
}

export default function OnboardingPage() {
  const t = useTranslations('common');
  return (
    <ProtectedRoute>
      <Suspense fallback={<p className="p-8 text-center" role="status">{t('loading')}</p>}>
        <OnboardingRoute />
      </Suspense>
    </ProtectedRoute>
  );
}
