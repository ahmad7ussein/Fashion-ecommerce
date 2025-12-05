/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Static export for Capacitor mobile app
  // إذا كنت تحتاج SSR، قم بتعطيل هذا السطر وحدد server URL في capacitor.config.ts
  output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // For static export, use unoptimized images
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },
  // Remove Next.js branding
  poweredByHeader: false,
  compress: true,
  // Experimental features for better chunk loading
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Webpack configuration to fix module loading issues
  webpack: (config, { isServer }) => {
    // Fix for webpack module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    // Improve module resolution
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.jsx': ['.tsx', '.jsx'],
    };
    
    return config;
  },
}

export default nextConfig
