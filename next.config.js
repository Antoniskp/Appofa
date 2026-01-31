/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure backend API routes don't conflict with Next.js
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
