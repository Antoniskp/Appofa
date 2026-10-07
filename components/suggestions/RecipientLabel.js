'use client';

import { useLocale, useTranslations } from 'next-intl';

export function recipientLabel(recipient, locale, t) {
  const title = recipient.kind === 'position'
    ? (locale === 'el' ? recipient.title : recipient.titleEn || recipient.title)
    : t(recipient.kind);
  return `${title} · ${recipient.locationName}`;
}

export default function RecipientLabel({ recipient }) {
  const locale = useLocale();
  const t = useTranslations('suggestionRecipients');
  if (!recipient) return null;
  return <span>{t('addressed_to')}: {recipientLabel(recipient, locale, t)}</span>;
}
