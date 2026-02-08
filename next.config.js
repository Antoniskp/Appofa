/** @type {import('next').NextConfig} */
const nextConfig = {
  // API proxying is handled by app/api/[...path]/route.js
  // which provides proper error handling and JSON responses
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
