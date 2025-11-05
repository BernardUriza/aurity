/** @type {import('next').NextConfig} */

// Ensure postcss config is loaded
process.env.POSTCSS_PRESET_ENV = 'production';

const nextConfig = {
  images: {
    domains: [],
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Transpile packages from monorepo
  transpilePackages: ['@fi/shared'],
  experimental: {
    optimizePackageImports: ['@radix-ui/react-dialog'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // PostCSS should handle @tailwind directives
    // Config in postcss.config.js
    return config;
  },
}

module.exports = nextConfig