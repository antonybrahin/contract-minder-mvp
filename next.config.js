/**
 * Next.js configuration for contract-minder-mvp
 * NOTE: Configure remotePatterns if you need to serve images from Supabase Storage public bucket.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
};

module.exports = nextConfig;


