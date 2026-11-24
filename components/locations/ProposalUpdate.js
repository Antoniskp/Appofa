import Link from 'next/link';
import { useTranslations } from 'next-intl';

const STATUS_LABELS = {
  open: 'Ανοιχτή', under_review: 'Υπό εξέταση', implemented: 'Υλοποιήθηκε', rejected: 'Απορρίφθηκε',
};

export default function ProposalUpdate({ proposal }) {
  const t = useTranslations('democracy');
  const progress = proposal.progress;
  const event = progress?.history?.at(-1);
  const status = progress?.stage ? t(`stage_${progress.stage}`) : STATUS_LABELS[proposal.status];
  if (!status) return null;
  return (
    <div className="mt-2 space-y-1 text-sm text-gray-700">
      <p className="font-medium">{status}{event?.at && <> · <time dateTime={event.at}>{new Date(event.at).toLocaleDateString('el-GR')}</time></>}</p>
      {progress?.note && <p className="line-clamp-2">{progress.note}</p>}
      <div className="flex flex-wrap gap-x-3 text-blue-700">
        {progress?.response && <Link href={`/suggestions/${proposal.id}#proposal-progress`} className="relative underline">Δες την απάντηση</Link>}
        {progress?.decisionPollId && <Link href={`/polls/${progress.decisionPollId}`} className="relative underline">{t('openConsultation')}</Link>}
        {/^https?:\/\//i.test(progress?.evidenceUrl || '') && <a href={progress.evidenceUrl} className="relative underline">{t('evidenceUrl')}</a>}
      </div>
    </div>
  );
}
