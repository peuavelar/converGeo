/**
 * Serviço de locais próximos (cliente).
 *
 * Fluxo:
 *  UI → /api/geo/nearby (BFF) → Overpass OSM ou motor Python
 *
 * Tipos canônicos: @/lib/geo/types
 * Arquitetura: docs/DATA_ARCHITECTURE.md
 */

export type {
  NearbyCategory,
  NearbyFilters,
  NearbyPlace,
  NearbySource,
} from "@/lib/geo/types";

export {
  DEFAULT_NEARBY_FILTERS,
  NEARBY_CATEGORY_META,
} from "@/lib/geo/types";

import type { NearbyPlace, NearbySource } from "@/lib/geo/types";

export const DEFAULT_NEARBY_RADIUS_M = 1500;
export const NEARBY_RADIUS_STEPS_M = [
  500, 1000, 1500, 2000, 3000, 4000, 5000,
] as const;

export function formatRadiusLabel(m: number): string {
  if (m < 1000) return `${m} m`;
  const km = m / 1000;
  return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
}

export function nextNearbyRadius(current: number, dir: 1 | -1): number {
  const steps = [...NEARBY_RADIUS_STEPS_M];
  let idx = steps.findIndex((s) => s >= current);
  if (idx < 0) idx = steps.length - 1;
  if (steps[idx] !== current) {
    if (dir < 0) return steps[Math.max(0, idx - 1)];
    return steps[idx];
  }
  return steps[Math.min(steps.length - 1, Math.max(0, idx + dir))];
}

export function radiusCirclePolygon(
  lat: number,
  lng: number,
  radiusM = DEFAULT_NEARBY_RADIUS_M,
  steps = 64,
): [number, number][] {
  const coords: [number, number][] = [];
  const latRad = (lat * Math.PI) / 180;
  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI;
    const dLat = (radiusM / 6371000) * Math.cos(bearing);
    const dLng =
      ((radiusM / 6371000) * Math.sin(bearing)) / Math.cos(latRad);
    coords.push([
      lng + (dLng * 180) / Math.PI,
      lat + (dLat * 180) / Math.PI,
    ]);
  }
  return coords;
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/**
 * Busca POIs via BFF (OpenStreetMap Overpass por padrão).
 */
export async function fetchNearbyAmenities(
  lat: number,
  lng: number,
  options?: {
    signal?: AbortSignal;
    radiusM?: number;
    onInstant?: (places: NearbyPlace[]) => void;
  },
): Promise<{ places: NearbyPlace[]; source: NearbySource }> {
  const radiusM = options?.radiusM ?? DEFAULT_NEARBY_RADIUS_M;
  const url = `/api/geo/nearby?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}&radius_m=${encodeURIComponent(String(radiusM))}`;

  const res = await fetch(url, {
    signal: options?.signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`nearby ${res.status}`);
  }

  const data = (await res.json()) as {
    places?: NearbyPlace[];
    source?: NearbySource;
  };

  const places = data.places ?? [];
  const source = data.source ?? "osm";
  options?.onInstant?.(places);
  return { places, source };
}
