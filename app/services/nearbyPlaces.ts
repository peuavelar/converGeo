/**
 * Locais próximos via OpenStreetMap / Overpass API (dados públicos).
 *
 * APIs para verificação:
 * - Overpass (POIs): https://overpass-api.de/api/interpreter
 * - Overpass Turbo (testar queries): https://overpass-turbo.eu/
 * - Nominatim (geocode, já usado em buscas): https://nominatim.openstreetmap.org/
 *
 * Política de uso OSM: https://operations.osmfoundation.org/policies/overpass/
 */

export type NearbyCategory =
  | "restaurante"
  | "hospital"
  | "delegacia"
  | "escola";

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
    short: string;
    color: [number, number, number];
  }
> = {
  restaurante: {
    label: "Restaurantes",
    short: "Restaurante",
    color: [226, 75, 75],
  },
  hospital: {
    label: "Hospitais",
    short: "Hospital",
    color: [13, 159, 110],
  },
  delegacia: {
    label: "Delegacias",
    short: "Delegacia",
    color: [37, 99, 235],
  },
  escola: {
    label: "Escolas",
    short: "Escola",
    color: [234, 136, 20],
  },
};

export const DEFAULT_NEARBY_FILTERS: NearbyFilters = {
  restaurante: true,
  hospital: true,
  delegacia: true,
  escola: true,
};

export const DEFAULT_NEARBY_RADIUS_M = 1500;
export const NEARBY_RADIUS_STEPS_M = [
  500, 1000, 1500, 2000, 3000, 4000, 5000,
] as const;

/** Endpoints públicos Overpass (espelhos). */
export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
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

/** Timeout generoso — Overpass público pode demorar. */
const OVERPASS_TIMEOUT_MS = 10000;

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

/** Fallback só se Overpass falhar (rede/timeout). */
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
      category: "restaurante",
      names: [
        "Restaurante Sabor Baiano",
        "Cantina da Praça",
        "Burger House",
        "Café da Esquina",
      ],
      bearings: [40, 100, 210, 320],
      dists: [300, 700, 1200, 1850],
    },
    {
      category: "hospital",
      names: ["Hospital São Rafael", "UPA Regional", "Clínica Salvador"],
      bearings: [15, 130, 255],
      dists: [650, 1100, 1600],
    },
    {
      category: "delegacia",
      names: ["Delegacia da Região", "DP Comunitária"],
      bearings: [75, 195],
      dists: [800, 1400],
    },
    {
      category: "escola",
      names: [
        "Escola Municipal Centro",
        "Colégio Bahia",
        "Instituto Educacional",
      ],
      bearings: [55, 170, 230],
      dists: [400, 950, 1350],
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
  if (
    tags.amenity === "restaurant" ||
    tags.amenity === "fast_food" ||
    tags.amenity === "cafe"
  )
    return "restaurante";
  if (
    tags.amenity === "hospital" ||
    tags.amenity === "clinic" ||
    tags.amenity === "doctors"
  )
    return "hospital";
  if (tags.amenity === "police") return "delegacia";
  if (
    tags.amenity === "school" ||
    tags.amenity === "kindergarten" ||
    tags.amenity === "college" ||
    tags.amenity === "university"
  )
    return "escola";
  return null;
}

function parseOverpassElements(
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
    // Preferir locais com nome real (dados verificáveis no OSM)
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

  // Limitar por categoria para não poluir o mapa
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

function buildOverpassQuery(lat: number, lng: number, radiusM: number) {
  // nwr = node + way + relation (hospitais/escolas muitas vezes são ways)
  return `
[out:json][timeout:25];
(
  nwr["amenity"="restaurant"](around:${radiusM},${lat},${lng});
  nwr["amenity"="fast_food"](around:${radiusM},${lat},${lng});
  nwr["amenity"="cafe"](around:${radiusM},${lat},${lng});
  nwr["amenity"="hospital"](around:${radiusM},${lat},${lng});
  nwr["amenity"="clinic"](around:${radiusM},${lat},${lng});
  nwr["amenity"="police"](around:${radiusM},${lat},${lng});
  nwr["amenity"="school"](around:${radiusM},${lat},${lng});
  nwr["amenity"="kindergarten"](around:${radiusM},${lat},${lng});
  nwr["amenity"="college"](around:${radiusM},${lat},${lng});
  nwr["amenity"="university"](around:${radiusM},${lat},${lng});
);
out center 80;
`;
}

async function fetchOverpass(
  lat: number,
  lng: number,
  radiusM: number,
  signal?: AbortSignal,
): Promise<NearbyPlace[] | null> {
  const query = buildOverpassQuery(lat, lng, radiusM);
  const body = `data=${encodeURIComponent(query)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) return null;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Accept: "application/json",
        },
        signal,
      });
      if (!res.ok) continue;
      const data = await res.json();
      const elements = (data?.elements || []) as {
        id: number;
        type?: string;
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
 * Busca POIs reais no OpenStreetMap via Overpass.
 * Fallback mock só se todos os espelhos falharem.
 */
export async function fetchNearbyAmenities(
  lat: number,
  lng: number,
  options?: {
    signal?: AbortSignal;
    radiusM?: number;
    /** Chamado quando OSM responde (ou no fallback). */
    onInstant?: (places: NearbyPlace[]) => void;
  },
): Promise<{ places: NearbyPlace[]; source: "osm" | "mock" }> {
  const radiusM = options?.radiusM ?? DEFAULT_NEARBY_RADIUS_M;

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  options?.signal?.addEventListener("abort", onAbort);

  const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

  try {
    const osm = await fetchOverpass(lat, lng, radiusM, controller.signal);
    if (osm && osm.length > 0) {
      options?.onInstant?.(osm);
      return { places: osm, source: "osm" };
    }
  } catch {
    // timeout / abort
  } finally {
    clearTimeout(timer);
    options?.signal?.removeEventListener("abort", onAbort);
  }

  const fallback = mockNearby(lat, lng, radiusM);
  options?.onInstant?.(fallback);
  return { places: fallback, source: "mock" };
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

/** Query pronta para colar no Overpass Turbo e validar um ponto. */
export function overpassTurboHint(lat: number, lng: number, radiusM = 1500) {
  return buildOverpassQuery(lat, lng, radiusM).trim();
}
