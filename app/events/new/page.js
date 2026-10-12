import EventForm from '@/components/calendar/EventForm';
import { getTranslations } from 'next-intl/server';
export default async function NewEventPage({ searchParams }) {
  const { locationId } = await searchParams;
  const t = await getTranslations('calendar');
  return <main className="mx-auto max-w-2xl px-4 py-8"><h1 className="mb-6 text-2xl font-bold">{t('newEvent')}</h1><EventForm locationId={locationId} /></main>;
}
