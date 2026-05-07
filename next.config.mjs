/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;