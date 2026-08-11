/**
 * Fontes de dados — troque via env sem reescrever a UI.
 *
 * DATA_PROVIDER=osm      → OpenStreetMap (Overpass + Nominatim) via BFF /api/geo/*
 * DATA_PROVIDER=backend  → motor Python / FastAPI em BACKEND_ORIGIN
 * DATA_PROVIDER=hybrid   → tenta backend; se falhar, OSM
 *
 * Ver docs/DATA_ARCHITECTURE.md
 */

export type DataProviderMode = "osm" | "backend" | "hybrid";

function readMode(): DataProviderMode {
  const raw = (
    process.env.DATA_PROVIDER ||
    process.env.NEXT_PUBLIC_DATA_PROVIDER ||
    "osm"
  )
    .trim()
    .toLowerCase();
  if (raw === "backend" || raw === "hybrid" || raw === "osm") return raw;
  return "osm";
}

export const dataSources = {
  mode: readMode(),
  backendOrigin: (
    process.env.BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/$/, ""),
  /** User-Agent exigido pela política do Nominatim. */
  userAgent:
    process.env.OSM_USER_AGENT ||
    "ConverGeo/1.1 (https://github.com/peuavelar/converGeo; local-dev)",
  nearbyDefaultRadiusM: Number(process.env.OSM_NEARBY_RADIUS_M || 1500),
  nearbyCacheTtlMs: Number(process.env.OSM_NEARBY_CACHE_TTL_MS || 5 * 60_000),
} as const;
