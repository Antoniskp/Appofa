export default function manifest() {
  return {
    name: 'Απόφαση',
    short_name: 'Απόφαση',
    description: 'Η πύλη σας για τελευταίες ειδήσεις, δημοσκοπήσεις και τοπικά νέα',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f0e8',
    theme_color: '#1e3a5f',
    orientation: 'any',
    icons: [
      {
        src: '/images/branding/appofasi-high-resolution-logo-transparent.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
