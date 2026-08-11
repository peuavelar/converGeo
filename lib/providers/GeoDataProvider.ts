import type {
  GeocodeHit,
  NearbyResponse,
  ReverseGeocodeHit,
} from "../geo/types";

/** Contrato único — implementado por OSM ou pelo motor Python. */
export interface GeoDataProvider {
  readonly id: "osm" | "backend";
  fetchNearby(params: {
    lat: number;
    lng: number;
    radiusM: number;
    signal?: AbortSignal;
  }): Promise<NearbyResponse>;
  geocode(params: {
    query: string;
    limit?: number;
    signal?: AbortSignal;
  }): Promise<GeocodeHit[]>;
  reverseGeocode(params: {
    lat: number;
    lng: number;
    signal?: AbortSignal;
  }): Promise<ReverseGeocodeHit | null>;
}
