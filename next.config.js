/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'server',  // Change this to 'server' to support dynamic functionality
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
