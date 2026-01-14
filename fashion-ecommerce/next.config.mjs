import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

 
const nextConfig = {
  
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: false,
  },
  
  
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
    
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },
  
  poweredByHeader: false,
  compress: true,
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      return [];
    }
    const scriptSrc =
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com";
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `${scriptSrc}; object-src 'none';`,
          },
        ],
      },
    ];
  },
  
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  webpack: (config, { isServer }) => {
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.jsx': ['.tsx', '.jsx'],
    };
    
    return config;
  },
}

export default nextConfig
