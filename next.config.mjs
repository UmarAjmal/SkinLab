/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true,
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@tanstack/react-table",
      "recharts",
      "date-fns",
      "dayjs",
    ],
  },
};

export default nextConfig;
