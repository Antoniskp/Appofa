import EventDetail from '@/components/calendar/EventDetail';
export default async function EventPage({ params }) { const { id } = await params; return <EventDetail id={id} />; }
