/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ⚡ STATIC EXPORT MODE - For DigitalOcean Spaces/CDN
  output: 'export',

  // Disable features that require Node.js server
  images: {
    unoptimized: true, // Can't use Next.js Image Optimization in static export
  },

  // Optional: Add trailing slashes to URLs (better for static hosting)
  trailingSlash: true,

  // Optional: Base path if hosting in subdirectory
  // basePath: '/aurity',

  // Optional: Asset prefix for CDN
  // assetPrefix: 'https://cdn.yourdomain.com',

  experimental: {
    externalDir: true,
  },

  transpilePackages: [
    '@fi/shared',
    'recordrtc',
  ],

  typescript: {
    ignoreBuildErrors: true,
  },

  turbopack: {},
};

module.exports = nextConfig;
