const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export const metadata = {
  title: 'Ονειρεμένη Κυβέρνηση - Απόφαση',
  description:
    'Ψηφίστε τους ανθρώπους που θέλετε σε κάθε θέση της κυβέρνησης και δείτε ποια ονειρεμένη κυβέρνηση επιλέγει η κοινότητα.',
  openGraph: {
    title: 'Ονειρεμένη Κυβέρνηση - Απόφαση',
    description:
      'Ψηφίστε τους ανθρώπους που θέλετε σε κάθε θέση της κυβέρνησης και δείτε ποια ονειρεμένη κυβέρνηση επιλέγει η κοινότητα.',
    url: `${SITE_URL}/dream-team`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ονειρεμένη Κυβέρνηση - Απόφαση',
    description:
      'Ψηφίστε τους ανθρώπους που θέλετε σε κάθε θέση της κυβέρνησης.',
  },
};

export default function DreamTeamLayout({ children }) {
  return children;
}
