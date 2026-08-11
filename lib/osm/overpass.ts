/**
 * Cliente Overpass (OpenStreetMap) — uso preferencial no servidor (BFF).
 * Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 * Teste: https://overpass-turbo.eu/
 */

import {
  NEARBY_CATEGORY_META,
  type NearbyCategory,
  type NearbyPlace,
} from "../geo/types";
import { dataSources } from "../config/dataSources";

export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
] as const;

function haversineM(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function mapOsmToCategory(tags: Record<string, string>): NearbyCategory | null {
  const amenity = tags.amenity;
  if (!amenity) return null;
  for (const [cat, meta] of Object.entries(NEARBY_CATEGORY_META) as [
    NearbyCategory,
    (typeof NEARBY_CATEGORY_META)[NearbyCategory],
  ][]) {
    if (meta.osmAmenity.includes(amenity)) return cat;
  }
  return null;
}

export function buildNearbyOverpassQuery(
  lat: number,
  lng: number,
  radiusM: number,
): string {
  const lines: string[] = [];
  for (const meta of Object.values(NEARBY_CATEGORY_META)) {
    for (const amenity of meta.osmAmenity) {
      lines.push(
        `  nwr["amenity"="${amenity}"](around:${radiusM},${lat},${lng});`,
      );
    }
  }
  return `
[out:json][timeout:25];
(
${lines.join("\n")}
);
out center 80;
`.trim();
}

function parseElements(
  elements: {
    id: number;
    type?: string;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }[],
  lat: number,
  lng: number,
  radiusM: number,
): NearbyPlace[] {
  const places: NearbyPlace[] = [];
  const seen = new Set<string>();

  for (const el of elements) {
    const tags = el.tags || {};
    const category = mapOsmToCategory(tags);
    if (!category) continue;
    const plat = el.lat ?? el.center?.lat;
    const plng = el.lon ?? el.center?.lon;
    if (plat == null || plng == null) continue;

    const name = (tags.name || tags["name:pt"] || "").trim();
    if (!name) continue;

    const id = `osm-${el.type || "n"}-${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const distanceM = Math.round(haversineM(lat, lng, plat, plng));
    if (distanceM > radiusM) continue;

    places.push({
      id,
      name,
      category,
      lat: plat,
      lng: plng,
      distanceM,
    });
  }

  const perCat = new Map<NearbyCategory, number>();
  const capped: NearbyPlace[] = [];
  for (const p of places.sort((a, b) => a.distanceM - b.distanceM)) {
    const n = perCat.get(p.category) ?? 0;
    if (n >= 8) continue;
    perCat.set(p.category, n + 1);
    capped.push(p);
  }
  return capped;
}

/** Busca POIs reais no OSM. Retorna [] se todos os espelhos falharem. */
export async function fetchOverpassNearby(
  lat: number,
  lng: number,
  radiusM: number,
  signal?: AbortSignal,
): Promise<NearbyPlace[]> {
  const query = buildNearbyOverpassQuery(lat, lng, radiusM);
  const body = `data=${encodeURIComponent(query)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) return [];
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
          "User-Agent": dataSources.userAgent,
        },
        signal,
        next: { revalidate: 0 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const places = parseElements(data?.elements || [], lat, lng, radiusM);
      if (places.length > 0) return places;
    } catch {
      if (signal?.aborted) return [];
      continue;
    }
  }
  return [];
}
