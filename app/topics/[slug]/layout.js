import { getTranslations } from 'next-intl/server';
import { fetchPublicMetadata, MetadataLayout } from '@/lib/route-metadata';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const path = `/topics/${encodeURIComponent(slug)}`;
  const [result, t] = await Promise.all([fetchPublicMetadata(`/api${path}`), getTranslations()]);
  const topic = result?.topic;
  if (!topic?.name) {
    return { title: t('nav.topics'), alternates: null, openGraph: null, twitter: null, description: null };
  }

  return pageMetadata(topic.name, topic.description?.slice(0, 160) || t('metadata.topicDescription'), path);
}

export default MetadataLayout;
