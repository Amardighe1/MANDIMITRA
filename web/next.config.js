/** @type {import('next').NextConfig} */

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';
const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

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
    : backendUrl
    ? {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${backendUrl}/api/:path*`,
            },
          ];
        },
      }
    : {}),
};

module.exports = nextConfig;
