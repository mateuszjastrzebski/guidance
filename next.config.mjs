/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    optimizePackageImports: [
      "@mantine/core",
      "@mantine/hooks",
      "@mantine/notifications",
      "@mantine/spotlight"
    ]
  }
};

export default nextConfig;
