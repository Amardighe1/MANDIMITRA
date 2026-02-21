/** @type {import('next').NextConfig} */

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';
const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com'],
  },
  // TF.js needs these webpack settings to work in browser builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
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
