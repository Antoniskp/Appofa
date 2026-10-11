import HomePageClient from '@/components/home/HomePageClient';
import { getPublicHomepage } from '@/lib/api/homepage-server';

export default async function HomePage() {
  const initialPayload = await getPublicHomepage();
  return <HomePageClient initialPayload={initialPayload} />;
}
