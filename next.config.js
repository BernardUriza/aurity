/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [],
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Disable telemetry
  telemetry: false,
}

module.exports = nextConfig