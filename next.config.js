/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Enable standalone output for Docker
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['@radix-ui/react-dialog'],
  },
  webpack: (config) => {
    // Ensure PostCSS processes Tailwind directives
    const cssLoaderIndex = config.module.rules.findIndex((rule) =>
      rule.test?.test?.('.css')
    )

    if (cssLoaderIndex !== -1) {
      const cssRule = config.module.rules[cssLoaderIndex]
      if (Array.isArray(cssRule.use)) {
        cssRule.use.forEach((loader) => {
          if (typeof loader === 'object' && loader.loader?.includes('postcss')) {
            // Ensure postcss-loader is configured
            if (!loader.options) loader.options = {}
            if (!loader.options.postcssOptions) {
              loader.options.postcssOptions = {
                plugins: {
                  tailwindcss: {},
                  autoprefixer: {},
                },
              }
            }
          }
        })
      }
    }

    return config
  },
}

module.exports = nextConfig