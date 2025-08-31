/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

module.exports = nextConfig