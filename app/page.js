import { pageMetadata, SITE_URL, serializeJsonLd } from '@/lib/seo';
import HomePageClient from '@/components/home/HomePageClient';

export const metadata = pageMetadata(
  'Προτάσεις πολιτών και δημόσια συμμετοχή',
  'Ενημερωθείτε, καταθέστε προτάσεις, συμμετέχετε σε δημοσκοπήσεις και παρακολουθήστε τις αποφάσεις που επηρεάζουν την κοινότητά σας.',
  '/',
);

export default function HomePage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
      '@context': 'https://schema.org', '@type': 'WebSite',
      name: 'Απόφαση', alternateName: 'Appofasi', url: SITE_URL,
    }) }} />
    <HomePageClient />
  </>;
}
