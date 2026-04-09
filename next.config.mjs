/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Nie dodawaj @mantine/* do optimizePackageImports — psuje bundling "use client" i MantineProvider.
    // typedRoutes wyłączone — niekompatybilne z Turbopack w Next 14.2.x
  }
};

export default nextConfig;
