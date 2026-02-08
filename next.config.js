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
      // Unsplash - popular free image service
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Imgur - popular image hosting
      {
        protocol: 'https',
        hostname: '**.imgur.com',
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
      // ImageKit - popular CDN
      {
        protocol: 'https',
        hostname: '**.imagekit.io',
      },
      // Toppng - PNG images
      {
        protocol: 'https',
        hostname: 'toppng.com',
      },
      // Pinterest images
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
