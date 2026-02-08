/** @type {import('next').NextConfig} */
const nextConfig = {
  // API proxying is handled by app/api/[...path]/route.js
  // which provides proper error handling and JSON responses
  
  images: {
    remotePatterns: [
      // Google Images (gstatic.com) - commonly used for polls
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'gstatic.com',
      },
      // Unsplash - popular free image service
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
      // Imgur - popular image hosting
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
      // Wikimedia Commons
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      // Cloudinary - popular CDN
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      // Generic CDNs commonly used
      {
        protocol: 'https',
        hostname: '**.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: '**.imgur.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
