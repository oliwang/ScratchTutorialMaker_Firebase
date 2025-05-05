import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add webpack configuration to handle 'async_hooks' resolution
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude 'async_hooks' from client-side bundles
      // It's a Node.js built-in module and not available in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false, // Add this line
      };
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
