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
        src: '/images/branding/appofa-app-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
