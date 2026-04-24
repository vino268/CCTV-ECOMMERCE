/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  reactStrictMode: false,
  images: {
    domains: [
      "encrypted-tbn0.gstatic.com",
      "via.placeholder.com",
      "m.media-amazon.com"
    ],
  },
};

export default nextConfig;