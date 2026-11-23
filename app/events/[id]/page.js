import EventDetail from '@/components/calendar/EventDetail';
import { getTranslations } from 'next-intl/server';
import { fetchPublicMetadata } from '@/lib/route-metadata';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const path = `/events/${encodeURIComponent(id)}`;
  const event = (await fetchPublicMetadata(`/api/calendar${path}`))?.data;
  if (event?.title) return pageMetadata(event.title, event.description?.slice(0, 160), path);

  const t = await getTranslations('metadata');
  return { title: t('eventDetails') };
}

export default async function EventPage({ params }) { const { id } = await params; return <EventDetail id={id} />; }
