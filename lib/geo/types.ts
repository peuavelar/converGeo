/**
 * Contratos geo compartilhados entre:
 * - BFF Next.js (/api/geo/*)
 * - OpenStreetMap (Overpass / Nominatim)
 * - Motor Python / FastAPI futuro
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

export type NearbySource = "osm" | "backend" | "mock";

export type NearbyResponse = {
  places: NearbyPlace[];
  source: NearbySource;
  /** ISO timestamp da resposta */
  fetchedAt: string;
  radiusM: number;
  center: { lat: number; lng: number };
};

export type GeocodeHit = {
  lat: number;
  lng: number;
  name: string;
  displayName?: string;
  source: "osm" | "backend" | "local";
};

export type ReverseGeocodeHit = {
  lat: number;
  lng: number;
  displayName: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  source: "osm" | "backend";
};

export const NEARBY_CATEGORY_META: Record<
  NearbyCategory,
  {
    label: string;
    short: string;
    color: [number, number, number];
    /** Tag amenity OSM principal */
    osmAmenity: string[];
  }
> = {
  restaurante: {
    label: "Restaurantes",
    short: "Restaurante",
    color: [226, 75, 75],
    osmAmenity: ["restaurant", "fast_food", "cafe"],
  },
  hospital: {
    label: "Hospitais",
    short: "Hospital",
    color: [13, 159, 110],
    osmAmenity: ["hospital", "clinic", "doctors"],
  },
  delegacia: {
    label: "Delegacias",
    short: "Delegacia",
    color: [37, 99, 235],
    osmAmenity: ["police"],
  },
  escola: {
    label: "Escolas",
    short: "Escola",
    color: [234, 136, 20],
    osmAmenity: ["school", "kindergarten", "college", "university"],
  },
};

export type NearbyFilters = Record<NearbyCategory, boolean>;

export const DEFAULT_NEARBY_FILTERS: NearbyFilters = {
  restaurante: true,
  hospital: true,
  delegacia: true,
  escola: true,
};
