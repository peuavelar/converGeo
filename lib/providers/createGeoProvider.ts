import { dataSources } from "../config/dataSources";
import type { GeoDataProvider } from "./GeoDataProvider";
import {
  createBackendGeoProvider,
  osmGeoProvider,
} from "./osmAndBackend";

/**
 * Factory — escolha via DATA_PROVIDER.
 * hybrid: backend primeiro, OSM se falhar.
 */
export function createGeoProvider(): GeoDataProvider {
  const mode = dataSources.mode;

  if (mode === "osm" || !dataSources.backendOrigin) {
    return osmGeoProvider;
  }

  const backend = createBackendGeoProvider();

  if (mode === "backend") return backend;

  // hybrid
  return {
    id: "backend",
    async fetchNearby(params) {
      try {
        return await backend.fetchNearby(params);
      } catch {
        return osmGeoProvider.fetchNearby(params);
      }
    },
    async geocode(params) {
      try {
        return await backend.geocode(params);
      } catch {
        return osmGeoProvider.geocode(params);
      }
    },
    async reverseGeocode(params) {
      try {
        const hit = await backend.reverseGeocode(params);
        if (hit) return hit;
      } catch {
        /* fall through */
      }
      return osmGeoProvider.reverseGeocode(params);
    },
  };
}
