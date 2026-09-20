'use client';
import { useTranslations } from 'next-intl';

export default function ParticipationNotice({ restriction = 'authenticated', compact = false }) {
  const t = useTranslations('democracy');
  return (
    <aside className="my-3 rounded-lg border border-teal-200 bg-teal-50 p-3 text-xs leading-relaxed text-teal-950">
      <strong>{t('advisory')}</strong>
      <p>{t(restriction === 'anyone' ? 'guestEligibility' : restriction === 'locals_only' ? 'localEligibility' : 'accountEligibility')}</p>
      <p className="mt-1">{!compact && t('meaning')} {t('privacy')}</p>
    </aside>
  );
}
