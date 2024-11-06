/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['icongr.am', 'firebasestorage.googleapis.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        http2: false,
        net: false,
        tls: false,
        constants: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;