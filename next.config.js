/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Enable standalone output for Docker
  output: 'standalone',
}

module.exports = nextConfig