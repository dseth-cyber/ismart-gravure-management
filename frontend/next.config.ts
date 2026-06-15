import type { NextConfig } from 'next';

const backendUrl = process.env.BACKEND_URL || 'http://backend:5000';
const allowedOrigins = (process.env.ALLOWED_DEV_ORIGINS || '').split(',').filter(Boolean);

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'qrcode.react'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

if (process.env.NODE_ENV === 'development') {
  const origins = allowedOrigins.map(o => {
    try { return new URL(o).hostname; } catch { return o; }
  });
  if (origins.length > 0) (nextConfig as any).allowedDevOrigins = origins;
}

export default nextConfig;
