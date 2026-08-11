import { NEIGHBORHOODS } from "../data/neighborhoods";
import { getRegionsSync } from "./regionsApi";

export type LatLng = { lat: number; lng: number };

export type FrequentPlace = {
  id: string;
  label: string;
  lat?: number;
  lng?: number;
};

export type RouteLeg = {
  placeId: string;
  label: string;
  durationMin: number;
  distanceKm: number;
  /** Coordenadas [lng, lat] para PathLayer */
  path: [number, number][];
  color: [number, number, number];
};

const ROUTE_COLORS: [number, number, number][] = [
  [0, 106, 255],
  [234, 88, 12],
  [5, 150, 105],
  [147, 51, 234],
  [220, 38, 38],
  [8, 145, 178],
];

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Geocodifica localmente (bairros) ou via Nominatim. */
export async function geocodeInSalvador(
  query: string,
): Promise<LatLng & { name: string } | null> {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const region = getRegionsSync().find(
    (r) =>
      r.name.toLowerCase() === q || r.name.toLowerCase().includes(q),
  );
  if (region) {
    return { lat: region.lat, lng: region.lng, name: region.name };
  }

  const n = NEIGHBORHOODS.find(
    (x) =>
      x.name.toLowerCase() === q || x.name.toLowerCase().includes(q),
  );
  if (n) return { lat: n.lat, lng: n.lng, name: n.name };

  try {
    const res = await fetch(
      `/api/geo/geocode?q=${encodeURIComponent(query)}&limit=1`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      hits?: { lat: number; lng: number; name: string }[];
    };
    const hit = data.hits?.[0];
    if (!hit) return null;
    return {
      lat: hit.lat,
      lng: hit.lng,
      name: hit.name || query,
    };
  } catch {
    return null;
  }
}

async function fetchOsrmRoute(
  from: LatLng,
  to: LatLng,
): Promise<{ durationMin: number; distanceKm: number; path: [number, number][] } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    const coords = (route.geometry?.coordinates || []) as [number, number][];
    return {
      durationMin: Math.max(1, Math.round(route.duration / 60)),
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      path: coords,
    };
  } catch {
    return null;
  }
}

function estimateRoute(
  from: LatLng,
  to: LatLng,
): { durationMin: number; distanceKm: number; path: [number, number][] } {
  const distanceKm = Math.round(haversineKm(from, to) * 1.35 * 10) / 10;
  // ~25 km/h média urbana Salvador
  const durationMin = Math.max(3, Math.round((distanceKm / 25) * 60));
  return {
    durationMin,
    distanceKm,
    path: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
  };
}

/** Calcula rotas do ponto de origem até cada lugar frequente. */
export async function buildFrequentRoutes(
  origin: LatLng,
  places: FrequentPlace[],
): Promise<RouteLeg[]> {
  const legs: RouteLeg[] = [];

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    let dest: LatLng | null =
      place.lat != null && place.lng != null
        ? { lat: place.lat, lng: place.lng }
        : null;
    let label = place.label;

    if (!dest) {
      const geo = await geocodeInSalvador(place.label);
      if (geo) {
        dest = { lat: geo.lat, lng: geo.lng };
        label = geo.name;
      }
    }

    if (!dest) continue;

    const routed = (await fetchOsrmRoute(origin, dest)) || estimateRoute(origin, dest);
    legs.push({
      placeId: place.id,
      label,
      durationMin: routed.durationMin,
      distanceKm: routed.distanceKm,
      path: routed.path,
      color: ROUTE_COLORS[i % ROUTE_COLORS.length],
    });
  }

  return legs.sort((a, b) => a.durationMin - b.durationMin);
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
