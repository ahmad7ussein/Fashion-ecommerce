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
  async rewrites() {
    if (process.env.CAPACITOR_BUILD === 'true') {
      return [];
    }
    const target = process.env.API_PROXY_TARGET;
    if (!target) {
      return [];
    }
    const normalizedTarget = target.replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${normalizedTarget}/api/:path*`,
      },
    ];
  },
  
  poweredByHeader: false,
  compress: true,
  async headers() {
    if (process.env.CAPACITOR_BUILD === 'true') {
      return [];
    }
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      return [];
    }
    const scriptSrc =
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://cdn.jsdelivr.net";
    const styleSrc =
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com";
    const fontSrc =
      "font-src 'self' data: https://fonts.gstatic.com";
    const imgSrc =
      "img-src 'self' data: blob: https: http:";
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `${scriptSrc}; ${styleSrc}; ${fontSrc}; ${imgSrc}; object-src 'none';`,
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
