/** @type {import('next').NextConfig} */
const nextConfig = {
  // API proxying is handled by app/api/[...path]/route.js
  // which provides proper error handling and JSON responses
  
  images: {
    remotePatterns: [
      // Allow images from any HTTPS source
      // Note: This is intentionally permissive to support user-provided image URLs
      // from various CDNs and image hosting services. While this creates a wider
      // attack surface for potential SSRF attacks, it enables the core functionality
      // of allowing users to add images from any source to poll options.
      // Consider implementing rate limiting and URL validation at the application
      // level, or restricting to specific trusted domains if security concerns arise.
      {
        protocol: 'https',
        hostname: '**',
      },
      // Allow HTTP images from localhost only (for local development)
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
