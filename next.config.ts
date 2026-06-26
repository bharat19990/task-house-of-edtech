import type { NextConfig } from 'next';

/**
 * Next.js 15 configuration.
 * - Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
 * - Webpack config to handle Yjs binary modules properly.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  /** Security headers applied to all routes */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  /** Webpack adjustments for Yjs and binary buffer handling */
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },

  /** Allow server actions for form handling */
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
