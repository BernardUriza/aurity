/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  images: {
    domains: [],
  },
  output: 'standalone',
  transpilePackages: [
    '@fi/shared',
    'recordrtc', // Fix: Next.js 16 + Turbopack compatibility (2025-11-10)
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack config (required in Next.js 16 if webpack config exists)
  turbopack: {},
};

module.exports = nextConfig;