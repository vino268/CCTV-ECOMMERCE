/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;