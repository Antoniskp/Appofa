import CalendarView from '@/components/calendar/CalendarView';
import { getTranslations } from 'next-intl/server';
export async function generateMetadata() {
  const t = await getTranslations('calendar');
  return { title: `${t('title')} | Appofa` };
}
export default function CalendarPage() { return <main className="mx-auto max-w-6xl px-4 py-8"><CalendarView /></main>; }
