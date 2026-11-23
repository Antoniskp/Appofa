import { getTranslations } from 'next-intl/server';
import { fetchPublicMetadata, MetadataLayout } from '@/lib/route-metadata';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const path = `/positions/${encodeURIComponent(id)}`;
  const position = (await fetchPublicMetadata(`/api${path}`))?.data;
  if (position?.title) return pageMetadata(position.title, position.body?.slice(0, 160), path);

  const t = await getTranslations('metadata');
  return { title: t('positionDetails') };
}

export default MetadataLayout;
