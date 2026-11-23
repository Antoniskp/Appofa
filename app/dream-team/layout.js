import { sectionMetadata } from '@/lib/route-metadata';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const generateMetadata = sectionMetadata({
  title: 'Ιδανική Κυβέρνηση',
  description:
    'Ψηφίστε τους ανθρώπους που θέλετε σε κάθε θέση της κυβέρνησης και δείτε ποια ιδανική κυβέρνηση επιλέγει η κοινότητα.',
  openGraph: {
    title: 'Ιδανική Κυβέρνηση - Απόφαση',
    description:
      'Ψηφίστε τους ανθρώπους που θέλετε σε κάθε θέση της κυβέρνησης και δείτε ποια ιδανική κυβέρνηση επιλέγει η κοινότητα.',
    url: `${SITE_URL}/dream-team`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ιδανική Κυβέρνηση - Απόφαση',
    description:
      'Ψηφίστε τους ανθρώπους που θέλετε σε κάθε θέση της κυβέρνησης.',
  },
});

export default function DreamTeamLayout({ children }) {
  return children;
}
