import EventForm from '@/components/calendar/EventForm';
export default async function NewEventPage({ searchParams }) {
  const { locationId } = await searchParams;
  return <main className="mx-auto max-w-2xl px-4 py-8"><h1 className="mb-6 text-2xl font-bold">Νέα εκδήλωση</h1><EventForm locationId={locationId} /></main>;
}
