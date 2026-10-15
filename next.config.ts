import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // A stray lockfile in the home folder confuses workspace-root detection.
  turbopack: { root: process.cwd() },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
  },
}

export default nextConfig
