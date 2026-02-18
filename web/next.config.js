/** @type {import('next').NextConfig} */

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com'],
  },
  ...(isCapacitorBuild
    ? {
        output: 'export',
        trailingSlash: true,
      }
    : {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: 'http://localhost:8000/api/:path*',
            },
          ];
        },
      }),
};

module.exports = nextConfig;
