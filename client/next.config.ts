import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3002/api/:path*',
      },
      {
        source: '/graphql/:path*',
        destination: 'http://localhost:3002/graphql/:path*',
      },
    ]
  },
  // Add WebSocket support for GraphQL subscriptions
  experimental: {
    serverComponentsExternalPackages: ['graphql'],
  },
  // Enable webpack configuration for GraphQL
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
}

export default nextConfig