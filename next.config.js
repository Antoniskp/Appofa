/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: API routing is handled by:
  // - In development: Direct fetch calls from frontend (lib/api.js) to backend
  // - In production: Nginx reverse proxy routing /api/* to backend server
  // Rewrites are not needed and can cause 502 errors or routing loops
}

module.exports = nextConfig
