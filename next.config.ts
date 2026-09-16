import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Não publica source maps no browser (dificulta leitura do código-fonte original)
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,

  // Reduz memória/CPU no bundling de libs pesadas (mapa)
  experimental: {
    optimizePackageImports: [
      "@deck.gl/core",
      "@deck.gl/layers",
      "@deck.gl/geo-layers",
      "@deck.gl/react",
      "maplibre-gl",
    ],
  },

  compiler: {
    // Remove console.* no build de produção
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          // Impede cache agressivo de HTML (sempre puxa a versão nova)
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },

  async rewrites() {
    const fallback = "https://convergeo.onrender.com";
    let api = (
      process.env.BACKEND_ORIGIN ||
      process.env.NEXT_PUBLIC_API_URL ||
      fallback
    ).replace(/\/$/, "");

    const isPrivate =
      !api.startsWith("http") ||
      /localhost|127\.0\.0\.1|0\.0\.0\.0|::1/i.test(api);
    if (process.env.VERCEL && isPrivate) {
      api = fallback;
    }

    const destinationBase = api.startsWith("http") ? api : fallback;

    return [
      {
        source: "/backend/:path*",
        destination: `${destinationBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
