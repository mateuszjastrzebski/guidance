import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Katalog projektu jako root przy śledzeniu plików (unika fałszywego wyboru rodzica z innym package-lock).
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // Nie dodawaj @mantine/* do optimizePackageImports — psuje bundling "use client" i MantineProvider.
    // typedRoutes wyłączone — niekompatybilne z Turbopack w Next 14.2.x
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
