import CalendarView from '@/components/calendar/CalendarView';
import { publicPageMetadata } from '@/lib/route-metadata';

export const generateMetadata = publicPageMetadata('calendar.title', 'calendar.intro', '/calendar');

export default function CalendarPage() { return <main className="mx-auto max-w-6xl px-4 py-8"><CalendarView /></main>; }
