'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  UserIcon,
  GlobeAltIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { useAuth } from '@/lib/auth-context';
import { authAPI } from '@/lib/api';
import Button from '@/components/ui/Button';
import ProtectedRoute from '@/components/ProtectedRoute';

const GOALS = ['moderator', 'creator', 'independent', 'citizen'];

const GOAL_ICONS = {
  moderator: ShieldCheckIcon,
  creator: PencilSquareIcon,
  independent: UserIcon,
  citizen: GlobeAltIcon,
};

/** Derive per-goal checklist items from actual user data */
function buildChecklist(goal, onboardingData, t) {
  const {
    emailVerified,
    firstNameNative,
    lastNameNative,
    bio,
    avatar,
    homeLocationId,
    nationality,
  } = onboardingData || {};

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
      {
        key: 'moderator_apply',
        label: t('step_moderator_apply'),
        doneLabel: t('step_moderator_apply'),
        action: t('step_moderator_apply_action'),
        done: false,
        href: '/become-moderator',
      },
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
        doneLabel: t('step_first_content'),
        action: t('step_first_content_action'),
        done: false,
        href: '/polls',
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
        key: 'candidate_register',
        label: t('step_candidate_register'),
        doneLabel: t('step_candidate_register'),
        action: t('step_candidate_register_action'),
        done: false,
        href: '/candidates/register',
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

function GoalCard({ goalKey, selected, secondary, onPrimary, onSecondary, t }) {
  const Icon = GOAL_ICONS[goalKey];
  const isPrimary = selected === goalKey;
  const isSecondary = secondary.includes(goalKey);

  return (
    <div
      className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isPrimary
          ? 'border-blue-600 bg-blue-50 shadow-md'
          : isSecondary
          ? 'border-blue-300 bg-blue-50/50'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
      }`}
      role="button"
      tabIndex={0}
      aria-pressed={isPrimary}
      onClick={() => onPrimary(goalKey)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPrimary(goalKey); }}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-6 w-6 flex-shrink-0 mt-0.5 ${isPrimary ? 'text-blue-600' : 'text-gray-500'}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isPrimary ? 'text-blue-900' : 'text-gray-900'}`}>
            {t(`goal_${goalKey}_label`)}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            {t(`goal_${goalKey}_description`)}
          </p>
        </div>
        {isPrimary && (
          <CheckCircleSolid className="h-5 w-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
        )}
      </div>
      {isPrimary && onSecondary && (
        <button
          type="button"
          className="mt-3 text-xs text-blue-600 hover:underline focus:outline-none focus:underline"
          onClick={(e) => { e.stopPropagation(); }}
          aria-label="Primary goal selected"
          tabIndex={-1}
        />
      )}
    </div>
  );
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
      <div className="flex-shrink-0">
        {step.done ? (
          <CheckCircleSolid className="h-5 w-5 text-green-500" aria-label="Done" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300" aria-hidden="true" />
        )}
      </div>
      <span className={`flex-1 text-sm ${step.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
        {step.done ? step.doneLabel : step.label}
      </span>
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

function OnboardingContent() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { user } = useAuth();
  const [phase, setPhase] = useState('loading'); // loading | choose | checklist
  const [primaryGoal, setPrimaryGoal] = useState(null);
  const [secondaryGoals, setSecondaryGoals] = useState([]);
  const [onboardingData, setOnboardingData] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadOnboarding = useCallback(async () => {
    try {
      const res = await authAPI.getOnboarding();
      if (res.success) {
        const data = res.data.onboarding;
        setOnboardingData(data);
        if (data.onboardingGoal) {
          setPrimaryGoal(data.onboardingGoal);
          setSecondaryGoals(data.onboardingSecondaryGoals || []);
          setPhase('checklist');
        } else {
          setPhase('choose');
        }
      }
    } catch {
      setPhase('choose');
    }
  }, []);

  useEffect(() => {
    loadOnboarding();
  }, [loadOnboarding]);

  const handleSelectPrimary = (goal) => {
    if (primaryGoal === goal) return;
    setPrimaryGoal(goal);
    setSecondaryGoals((prev) => prev.filter((g) => g !== goal));
  };

  const handleToggleSecondary = (goal) => {
    if (goal === primaryGoal) return;
    setSecondaryGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const handleSaveGoal = async () => {
    if (!primaryGoal) return;
    setSaving(true);
    try {
      await authAPI.updateOnboarding({ goal: primaryGoal, secondaryGoals });
      const res = await authAPI.getOnboarding();
      if (res.success) setOnboardingData(res.data.onboarding);
      setPhase('checklist');
    } catch {
      // continue to checklist even on error
      setPhase('checklist');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    try {
      await authAPI.updateOnboarding({ dismissed: true });
    } catch {
      // ignore
    }
    router.push('/');
  };

  const handleBackToGoals = () => {
    setPhase('choose');
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  const checklist = phase === 'checklist' && primaryGoal
    ? buildChecklist(primaryGoal, onboardingData, t)
    : [];
  const doneCount = checklist.filter((s) => s.done).length;
  const totalCount = checklist.length;
  const allDone = totalCount > 0 && doneCount === totalCount;
  const nextStep = checklist.find((s) => !s.done);
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          Appofa
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
      <main className="flex-1 flex items-start justify-center px-4 pb-12 pt-6 sm:pt-10">
        <div className="w-full max-w-xl">
          {phase === 'choose' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('title')}</h1>
                <p className="mt-2 text-gray-600 text-sm sm:text-base">{t('subtitle')}</p>
              </div>

              <section aria-labelledby="primary-goal-heading">
                <h2 id="primary-goal-heading" className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  {t('choose_one_primary')}
                </h2>
                <div className="space-y-3">
                  {GOALS.map((g) => (
                    <GoalCard
                      key={g}
                      goalKey={g}
                      selected={primaryGoal}
                      secondary={secondaryGoals}
                      onPrimary={handleSelectPrimary}
                      onSecondary={handleToggleSecondary}
                      t={t}
                    />
                  ))}
                </div>
              </section>

              {primaryGoal && (
                <section className="mt-6" aria-labelledby="secondary-goals-heading">
                  <h2 id="secondary-goals-heading" className="text-sm font-semibold text-gray-700 mb-3">
                    {t('optional_secondary')}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.filter((g) => g !== primaryGoal).map((g) => {
                      const Icon = GOAL_ICONS[g];
                      const isSelected = secondaryGoals.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleToggleSecondary(g)}
                          aria-pressed={isSelected}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {t(`goal_${g}_label`)}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="mt-8 flex items-center justify-between">
                <p className="text-xs text-gray-500">{t('resume_hint')}</p>
                <Button
                  onClick={handleSaveGoal}
                  disabled={!primaryGoal || saving}
                  loading={saving}
                >
                  {t('save_goal')}
                </Button>
              </div>
            </>
          )}

          {phase === 'checklist' && primaryGoal && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{t('your_checklist')}</h1>
                  {!allDone && (
                    <p className="text-sm text-gray-600 mt-0.5">
                      {t('progress_label').replace('{done}', doneCount).replace('{total}', totalCount)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleBackToGoals}
                  className="text-xs text-blue-600 hover:underline focus:outline-none focus:underline"
                >
                  {t('back_to_goals')}
                </button>
              </div>

              {/* Progress bar */}
              <div className="mb-6" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={t('progress_label').replace('{done}', doneCount).replace('{total}', totalCount)}>
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
                  <div className="mt-4">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:underline focus:outline-none focus:underline">
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

              <div className="space-y-2" role="list" aria-label={t('your_checklist')}>
                {checklist.map((step, index) => (
                  <div key={step.key} role="listitem">
                    <ChecklistStep step={step} isNextAction={!allDone && index === checklist.findIndex((s) => !s.done)} />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
                >
                  {t('skip')}
                </button>
                <Link href="/" className="text-sm text-blue-600 hover:underline focus:outline-none focus:underline">
                  {t('explore_platform')} →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  );
}
