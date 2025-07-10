import type { NextConfig } from "next";

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
};

export default nextConfig;
