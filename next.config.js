const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep review builds separate from an already running local preview.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    // Proxy buffers multipart requests before the API handler receives them.
    proxyClientMaxBodySize: '21mb',
  },
  // API proxying is handled by app/api/[...path]/route.js
  // which provides proper error handling and JSON responses
  async rewrites() {
    const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return [{ source: '/laws/:asset*', destination: `${apiBase.replace(/\/+$/, '')}/api/laws/view/:asset*` }];
  },
  
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
    // Prefer the faster encoder on cache misses and keep one format per size.
    formats: ['image/webp'],
  },
};

module.exports = withNextIntl(nextConfig);
