'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function ConsultationCommitment({ registration, compact = false }) {
  const t = useTranslations('politicalWidget');
  const plan = registration.consultationCommitment?.trim();
  const user = registration.candidate;
  const activityHref = user?.username ? `/users/${encodeURIComponent(user.username)}` : null;
  return <div className={compact ? 'mt-3 border-t border-brand-border pt-3' : 'mt-6 rounded-xl border border-brand-border bg-ivory/40 p-4'}>
    {plan ? <details>
      <summary className="cursor-pointer text-xs font-semibold text-[var(--brand)]">{t('planShared')}</summary>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{t('candidateStatement')}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal">{plan}</p>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">{t('statementNote')}</p>
    </details> : <p className="text-xs text-gray-500">{t('noPlan')}</p>}
    {activityHref && <Link href={activityHref} className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-copper hover:underline">{t('publicActivity')} →</Link>}
  </div>;
}
