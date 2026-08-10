export type NearbyCategory =
  | "farmacia"
  | "mercado"
  | "restaurante"
  | "shopping";

export type NearbyPlace = {
  id: string;
  name: string;
  category: NearbyCategory;
  lat: number;
  lng: number;
  distanceM: number;
};

export type NearbyFilters = Record<NearbyCategory, boolean>;

export const NEARBY_CATEGORY_META: Record<
  NearbyCategory,
  {
    label: string;
    symbol: string;
    color: [number, number, number];
  }
> = {
  farmacia: { label: "Farmácias", symbol: "💊", color: [16, 185, 129] },
  mercado: { label: "Mercados", symbol: "🛒", color: [245, 158, 11] },
  restaurante: { label: "Restaurantes", symbol: "🍽️", color: [239, 68, 68] },
  shopping: { label: "Shoppings", symbol: "🏬", color: [139, 92, 246] },
};

export const DEFAULT_NEARBY_FILTERS: NearbyFilters = {
  farmacia: true,
  mercado: true,
  restaurante: true,
  shopping: true,
};

/** Raio padrão e degraus para +/- no clique. */
export const DEFAULT_NEARBY_RADIUS_M = 2000;
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
    // current entre dois degraus
    if (dir < 0) return steps[Math.max(0, idx - 1)];
    return steps[idx];
  }
  return steps[Math.min(steps.length - 1, Math.max(0, idx + dir))];
}

/** Overpass costuma ser lento/instável — não segurar a UI. */
const OVERPASS_TIMEOUT_MS = 2800;
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

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

/** Polígono aproximado do raio (para desenhar no mapa). */
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

function offsetPoint(
  lat: number,
  lng: number,
  distanceM: number,
  bearingDeg: number,
): { lat: number; lng: number } {
  const br = (bearingDeg * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const dLat = (distanceM / 6371000) * Math.cos(br);
  const dLng = ((distanceM / 6371000) * Math.sin(br)) / Math.cos(latRad);
  return {
    lat: lat + (dLat * 180) / Math.PI,
    lng: lng + (dLng * 180) / Math.PI,
  };
}

/** Mock determinístico perto do clique (resposta imediata). */
export function mockNearby(
  lat: number,
  lng: number,
  radiusM = DEFAULT_NEARBY_RADIUS_M,
): NearbyPlace[] {
  const seeds: {
    category: NearbyCategory;
    names: string[];
    bearings: number[];
    dists: number[];
  }[] = [
    {
      category: "farmacia",
      names: ["Farmácia DrogaVida", "Drogasil Express", "Pague Menos", "Farmácia Popular"],
      bearings: [20, 140, 250, 310],
      dists: [420, 980, 1500, 2800],
    },
    {
      category: "mercado",
      names: ["Mercado Bom Preço", "Supermercado Extra", "Atacadão Local", "Hiper Bahia"],
      bearings: [60, 180, 300, 15],
      dists: [550, 1100, 1700, 3500],
    },
    {
      category: "restaurante",
      names: [
        "Restaurante Sabor Baiano",
        "Cantina da Praça",
        "Burger House",
        "Café da Esquina",
        "Churrascaria Norte",
      ],
      bearings: [40, 100, 210, 320, 160],
      dists: [300, 700, 1200, 1850, 4200],
    },
    {
      category: "shopping",
      names: ["Shopping Center Norte", "Galeria Comercial", "Outlet Salvador"],
      bearings: [90, 270, 45],
      dists: [900, 1600, 4500],
    },
  ];

  const places: NearbyPlace[] = [];
  for (const group of seeds) {
    group.names.forEach((name, i) => {
      const dist = group.dists[i];
      if (dist > radiusM) return;
      const p = offsetPoint(lat, lng, dist, group.bearings[i]);
      places.push({
        id: `mock-${group.category}-${i}`,
        name,
        category: group.category,
        lat: p.lat,
        lng: p.lng,
        distanceM: dist,
      });
    });
  }
  return places.sort((a, b) => a.distanceM - b.distanceM);
}

function mapOsmToCategory(tags: Record<string, string>): NearbyCategory | null {
  if (tags.amenity === "pharmacy") return "farmacia";
  if (tags.shop === "supermarket" || tags.shop === "convenience")
    return "mercado";
  if (
    tags.amenity === "restaurant" ||
    tags.amenity === "fast_food" ||
    tags.amenity === "cafe"
  )
    return "restaurante";
  if (tags.shop === "mall" || tags.shop === "department_store")
    return "shopping";
  return null;
}

function parseOverpassElements(
  elements: {
    id: number;
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
  for (const el of elements) {
    const tags = el.tags || {};
    const category = mapOsmToCategory(tags);
    if (!category) continue;
    const plat = el.lat ?? el.center?.lat;
    const plng = el.lon ?? el.center?.lon;
    if (plat == null || plng == null) continue;
    places.push({
      id: `osm-${el.id}`,
      name: tags.name || NEARBY_CATEGORY_META[category].label,
      category,
      lat: plat,
      lng: plng,
      distanceM: Math.round(haversineM(lat, lng, plat, plng)),
    });
  }
  return places
    .filter((p) => p.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 40);
}

async function fetchOverpass(
  lat: number,
  lng: number,
  radiusM: number,
  signal?: AbortSignal,
): Promise<NearbyPlace[] | null> {
  const query = `
[out:json][timeout:8];
(
  node["amenity"="pharmacy"](around:${radiusM},${lat},${lng});
  node["shop"="supermarket"](around:${radiusM},${lat},${lng});
  node["shop"="convenience"](around:${radiusM},${lat},${lng});
  node["amenity"="restaurant"](around:${radiusM},${lat},${lng});
  node["amenity"="fast_food"](around:${radiusM},${lat},${lng});
  node["shop"="mall"](around:${radiusM},${lat},${lng});
);
out body 30;
`;

  const body = `data=${encodeURIComponent(query)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) return null;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal,
      });
      if (!res.ok) continue;
      const data = await res.json();
      const elements = (data?.elements || []) as {
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }[];
      const places = parseOverpassElements(elements, lat, lng, radiusM);
      if (places.length > 0) return places;
    } catch {
      if (signal?.aborted) return null;
      continue;
    }
  }
  return null;
}

/**
 * Instantâneo com mock; tenta OSM em paralelo com timeout curto.
 * onInstant: chamado na hora com estimativa (para UI responsiva).
 */
export async function fetchNearbyAmenities(
  lat: number,
  lng: number,
  options?: {
    signal?: AbortSignal;
    radiusM?: number;
    onInstant?: (places: NearbyPlace[]) => void;
  },
): Promise<{ places: NearbyPlace[]; source: "osm" | "mock" }> {
  const radiusM = options?.radiusM ?? DEFAULT_NEARBY_RADIUS_M;
  const instant = mockNearby(lat, lng, radiusM);
  options?.onInstant?.(instant);

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  options?.signal?.addEventListener("abort", onAbort);

  const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

  try {
    const osm = await fetchOverpass(lat, lng, radiusM, controller.signal);
    if (osm && osm.length > 0) return { places: osm, source: "osm" };
  } catch {
    // timeout / abort
  } finally {
    clearTimeout(timer);
    options?.signal?.removeEventListener("abort", onAbort);
  }

  return { places: instant, source: "mock" };
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
