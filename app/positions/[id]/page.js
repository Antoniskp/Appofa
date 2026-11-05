'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { positionAPI } from '@/lib/api/positions';
import { useAuth } from '@/lib/auth-context';
import { PositionCard } from '@/components/positions/PositionsPanel';
import CommentsThread from '@/components/comments/CommentsThread';

export default function PositionPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const t = useTranslations('positions');
  const locale = useLocale();
  const [row, setRow] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    setRow(null); setError('');
    positionAPI.detail(id).then(({ data }) => { if (current) setRow(data); })
      .catch(err => { if (current) setError(err.message); });
    return () => { current = false; };
  }, [id, user?.id]);
  const vote = async (revisionId, value) => {
    const { data } = await positionAPI.vote(revisionId, value);
    setRow(previous => previous?.id === revisionId ? { ...previous, support: data.support, oppose: data.oppose, unsure: data.unsure, myVote: data.value } : previous);
  };
  return <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
    {error ? <p role="alert">{error}</p> : !row ? <p role="status">{t('loading')}</p> : <>
      <Link className="text-sm text-blue-700 underline" href={`/organizations/${row.position.organization.slug}?tab=tab_positions`}>← {row.position.organization.name}</Link>
      <PositionCard key={row.id} detail row={row} user={user} metadata={{}} onVote={vote} t={t}
        categoryName={category => t.has('categories.' + category.slug) ? t('categories.' + category.slug) : category.name}
        formatDate={value => new Date(value).toLocaleDateString(locale)} />
      <CommentsThread entityType="position" entityId={row.positionId} />
    </>}
  </main>;
}
