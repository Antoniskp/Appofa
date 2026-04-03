export async function generateMetadata({ params }) {
  const { slug } = await params;
  const name = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${name} - Appofa`,
    description: `News, education, polls, and community information for ${name} on Appofa.`,
    openGraph: {
      title: `${name} - Appofa`,
      description: `News, education, polls, and community information for ${name} on Appofa.`,
      type: 'website',
    },
  };
}

export default function LocationLayout({ children }) {
  return children;
}
