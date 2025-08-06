import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff' // Prevents MIME type sniffing
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin' // Hides full URLs from external sites
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()' // Disable unused browser features
  }
];

// Only add HSTS in production to avoid dev issues
if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains' // Force HTTPS for 1 year
  });
}

// Content Security Policy - carefully crafted to work with your app
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://human.biodigital.com https://developer.biodigital.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' data: blob: https:;
  media-src 'self' blob:;
  connect-src 'self' 
    https://*.supabase.co 
    wss://*.supabase.co 
    https://web-production-945c4.up.railway.app 
    http://localhost:8000 
    https://human.biodigital.com 
    https://developer.biodigital.com;
  frame-src *;
  frame-ancestors *;
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  worker-src 'self' blob:;
  manifest-src 'self';
`.replace(/\s{2,}/g, ' ').trim();

securityHeaders.push({
  key: 'Content-Security-Policy',
  value: ContentSecurityPolicy
});

const nextConfig: NextConfig = {
  transpilePackages: ['@supabase/auth-helpers-nextjs', '@supabase/auth-ui-react'],
  experimental: {
    esmExternals: true,
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
    return config;
  },
  eslint: {
    // WARNING: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Special handling for API routes - more permissive
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://your-production-domain.com' // Update this with your actual domain
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
          }
        ]
      }
    ];
  },
};

export default nextConfig;
