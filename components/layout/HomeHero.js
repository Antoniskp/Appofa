'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { heroSettingsAPI, pollAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import VotingIntentionNotice from '@/components/polls/VotingIntentionNotice';
import PollOptionLogo from '@/components/polls/PollOptionLogo';
import VotingIntentionSummary from '@/components/polls/VotingIntentionSummary';
import { 
  ArrowRightIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_BG_COLOR = '#252627';
const DEFAULT_TITLE = 'Δες τι συμβαίνει. Πάρε θέση. Πρότεινε λύσεις.';
const DEFAULT_SUBTITLE = 'Ανακάλυψε τι αφορά την περιοχή σου, συμμετείχε σε ανοιχτές ψηφοφορίες και δώσε ορατότητα σε ιδέες, προβλήματα και ανθρώπους.';
const GUEST_TITLE = 'Η περιοχή σου. Τα θέματα που σε αφορούν. Η δική σου φωνή.';
const GUEST_SUBTITLE = 'Ανακάλυψε προτάσεις και ψηφοφορίες για την περιοχή σου. Δημιούργησε λογαριασμό για να ακολουθείς όσα σε ενδιαφέρουν και να καταθέτεις τις δικές σου προτάσεις.';

function FeaturedLivePoll({ poll, loading, user }) {
  const [currentPoll, setCurrentPoll] = useState(poll);
  const [selectedOptionId, setSelectedOptionId] = useState(poll?.userVote?.optionId || null);
  const [submittingOptionId, setSubmittingOptionId] = useState(null);
  const [voteError, setVoteError] = useState(null);

  useEffect(() => {
    setCurrentPoll(poll);
    setSelectedOptionId(poll?.userVote?.optionId || null);
    setSubmittingOptionId(null);
    setVoteError(null);
  }, [poll]);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/15 backdrop-blur-md">
        <div className="h-3 w-32 animate-pulse rounded bg-white/20" />
        <div className="mt-3 h-5 w-full animate-pulse rounded bg-white/20" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-8 animate-pulse rounded bg-white/15" />
          <div className="h-8 animate-pulse rounded bg-white/15" />
        </div>
      </div>
    );
  }

  if (!currentPoll) return null;

  if (currentPoll.purpose === 'voting_intention') return <VotingIntentionSummary poll={currentPoll} />;

  const options = Array.isArray(currentPoll.options) ? currentPoll.options : [];
  const isPollActive = currentPoll.status === 'active' && (!currentPoll.deadline || new Date(currentPoll.deadline) > new Date());
  const canVote = isPollActive && (user || currentPoll.voteRestriction === 'anyone') && (currentPoll.purpose !== 'voting_intention' || currentPoll.googleVotingEligible);
  const totalVotes = options.reduce((sum, option) => sum + (option.voteCount || 0), 0);

  const handleVote = async (optionId) => {
    if (!canVote || submittingOptionId) return;

    setSubmittingOptionId(optionId);
    setVoteError(null);

    try {
      const response = await pollAPI.vote(currentPoll.id, optionId);
      const voteCounts = response?.data?.voteCounts || {};
      setSelectedOptionId(optionId);
      setCurrentPoll((prev) => ({
        ...prev,
        userVote: { optionId, createdAt: new Date().toISOString() },
        options: (prev.options || []).map((option) => ({
          ...option,
          voteCount: voteCounts[String(option.id)] ?? voteCounts[option.id] ?? 0,
        })),
      }));
    } catch (error) {
      setVoteError(error?.message || 'Η ψήφος δεν καταχωρίστηκε.');
    } finally {
      setSubmittingOptionId(null);
    }
  };

  return (
    <div className="rounded-lg border border-white/25 bg-white/[0.16] p-5 shadow-2xl shadow-black/15 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sand">
        {currentPoll.purpose === 'voting_intention' ? 'Πρόθεση ψήφου' : 'Δημόσια γνώμη'}
      </p>
      <h2 className="mt-2 text-xl font-bold leading-7 text-white">
        {currentPoll.title}
      </h2>
      {currentPoll.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/75">
          {currentPoll.description}
        </p>
      )}

      <div className="mt-3"><VotingIntentionNotice poll={currentPoll} user={user} /></div>
      <div className="mt-5 max-h-96 overflow-y-auto space-y-2">
        {options.map((option) => {
          const count = option.voteCount || 0;
          const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = selectedOptionId === option.id;
          const isSubmitting = submittingOptionId === option.id;

          if (selectedOptionId) {
            return (
              <button
                key={option.id}
                type="button"
                disabled={!canVote || Boolean(submittingOptionId)}
                onClick={() => handleVote(option.id)}
                className="group w-full rounded-lg border border-white/15 bg-white/10 p-3 text-left transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-75"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className={`flex min-w-0 items-center gap-3 font-semibold ${isSelected ? 'text-sand' : 'text-white/85'}`}>
                    <PollOptionLogo poll={currentPoll} option={option} />
                    {option.text || option.displayText}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-white">
                    {percentage}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-sand' : 'bg-sand/70'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-white/55">
                  {count.toLocaleString('el-GR')} {count === 1 ? 'ψήφος' : 'ψήφοι'}
                </p>
              </button>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={!canVote || Boolean(submittingOptionId)}
              onClick={() => handleVote(option.id)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-left text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex min-w-0 items-center gap-3"><PollOptionLogo poll={currentPoll} option={option} />{option.text || option.displayText}</span>
              <span className="text-xs text-white/65">
                {isSubmitting ? '...' : 'Ψήφος'}
              </span>
            </button>
          );
        })}
      </div>

      {voteError && (
        <p className="mt-3 rounded-lg border border-red-200/25 bg-red-500/15 px-3 py-2 text-xs font-medium text-red-50">
          {voteError}
        </p>
      )}
      {!canVote && isPollActive && (
        <p className="mt-3 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/75">
          Συνδέσου για να ψηφίσεις σε αυτή τη ψηφοφορία.
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Link href={`/polls/${currentPoll.id}`} className="text-xs font-semibold text-white underline">Αποτελέσματα και λεπτομέρειες</Link>
        <span className="text-xs font-medium text-white/70">
          {totalVotes.toLocaleString('el-GR')} {totalVotes === 1 ? 'ψήφος' : 'ψήφοι'}
        </span>
        {!isPollActive && (
          <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
            Η ψηφοφορία έληξε
          </span>
        )}
      </div>
    </div>
  );
}

export default function HomeHero({ featuredPoll = null, featuredPollLoading = false }) {
  const { user, loading: authLoading } = useAuth();
  const [heroBg, setHeroBg] = useState({ type: 'color', value: DEFAULT_BG_COLOR });
  // Fetch hero background settings (side-effect only — sets heroBg state)
  useAsyncData(
    () => heroSettingsAPI.get(),
    [],
    {
      onSuccess: (res) => {
        if (!res?.success) return;
        const { backgroundImageUrl, backgroundColor } = res.data;
        const color = backgroundColor || DEFAULT_BG_COLOR;
        if (backgroundImageUrl && /^https?:\/\//.test(backgroundImageUrl)) {
          const img = new Image();
          img.onload = () => setHeroBg({ type: 'image', url: backgroundImageUrl, color });
          img.onerror = () => setHeroBg({ type: 'color', value: color });
          img.src = backgroundImageUrl;
        } else {
          setHeroBg({ type: 'color', value: color });
        }
      },
    }
  );

  const heroStyle =
    heroBg.type === 'image'
      ? {
          backgroundImage: `url(${heroBg.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : { backgroundColor: heroBg.value };

  return (
    <>
      {/* Hero banner */}
      <section
        className="relative isolate overflow-hidden text-white"
        style={heroStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/65 via-charcoal/35 to-charcoal/50 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ivory to-transparent pointer-events-none" />

        <div className="relative app-container py-6 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-center animate-fade-in">

            {/* Left – text & actions */}
            <div className="min-w-0 max-w-3xl">
              {!authLoading && user && (
                <p className="text-sm mb-2 text-sand font-medium">
                  Καλώς ήρθες, {user.firstNameNative || user.username}!
                </p>
              )}

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">{user ? DEFAULT_TITLE : GUEST_TITLE}</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/90">{user ? DEFAULT_SUBTITLE : GUEST_SUBTITLE}</p>
              <div className="my-5 flex flex-wrap gap-3">
                {!user && <Link href="/register" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 py-3 font-semibold text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Δημιούργησε λογαριασμό <ArrowRightIcon className="h-4 w-4" /></Link>}
                <Link href={user?.homeLocation?.slug ? `/locations/${user.homeLocation.slug}` : '/locations'} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-3 font-semibold ${user ? 'bg-white text-charcoal' : 'border border-white/60 text-white'}`}>
                  <MapPinIcon className="h-5 w-5" />{user?.homeLocation?.slug ? 'Η περιοχή σου' : user ? 'Βρες την περιοχή σου' : 'Εξερεύνησε την περιοχή σου'}
                </Link>
                {user && <Link href="/polls" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/60 px-4 py-3 font-semibold text-white">Ψήφισε σε ένα θέμα <ArrowRightIcon className="h-4 w-4" /></Link>}
              </div>
              <p className="mb-4 text-xs leading-5 text-white/80">Οι ψηφοφορίες εκφράζουν τους συμμετέχοντες. Δεν αποτελούν επίσημες αποφάσεις ή αντιπροσωπευτικές δημοσκοπήσεις. Η σύνδεση με Google δεν επαληθεύει μοναδικό φυσικό πρόσωπο.</p>
              <nav aria-label="Συνέχισε τη συμμετοχή σου" className="mb-5 flex flex-wrap gap-4 text-sm font-semibold underline">
                {user && <Link href="/following">Θέματα που ακολουθείς</Link>}
                <Link href="/progress">Δες την πρόοδο των προτάσεων</Link>
              </nav>

              {(featuredPoll || featuredPollLoading) && (
                <div className="lg:hidden">
                  <FeaturedLivePoll poll={featuredPoll} loading={featuredPollLoading} user={user} />
                </div>
              )}

            </div>

            {(featuredPoll || featuredPollLoading) && (
              <div className="relative hidden lg:block">
                <FeaturedLivePoll poll={featuredPoll} loading={featuredPollLoading} user={user} />
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
}
