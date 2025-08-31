import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3002/api/:path*',
      },
      {
        source: '/graphql',
        destination: 'http://localhost:4000/',
      },
    ]
  },
}

export default nextConfig