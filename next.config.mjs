/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  reactStrictMode: false,
  compress: true,
  images: {
    domains: [
      "encrypted-tbn0.gstatic.com",
      "via.placeholder.com",
      "m.media-amazon.com",
      "images.pexels.com",
    ],
  },
};

export default nextConfig;