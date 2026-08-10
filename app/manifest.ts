import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ConverGeo",
    short_name: "ConverGeo",
    description:
      "Inteligência imobiliária para Salvador — Opportunity Score, mapa e marketplace.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#006aff",
    orientation: "portrait-primary",
    lang: "pt-BR",
    categories: ["business", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
