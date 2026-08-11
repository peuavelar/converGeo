import { dataSources } from "../config/dataSources";
import type { NearbyPlace, NearbyResponse } from "../geo/types";
import { fetchOverpassNearby } from "../osm/overpass";
import { nominatimReverse, nominatimSearch } from "../osm/nominatim";
import type { GeoDataProvider } from "./GeoDataProvider";

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

/** Fallback mínimo se Overpass estiver offline. */
function mockNearby(
  lat: number,
  lng: number,
  radiusM: number,
): NearbyPlace[] {
  const seeds: {
    category: NearbyPlace["category"];
    names: string[];
    bearings: number[];
    dists: number[];
  }[] = [
    {
      category: "restaurante",
      names: ["Restaurante (estimativa)", "Café (estimativa)"],
      bearings: [40, 210],
      dists: [350, 900],
    },
    {
      category: "hospital",
      names: ["UPA (estimativa)"],
      bearings: [120],
      dists: [800],
    },
    {
      category: "delegacia",
      names: ["Delegacia (estimativa)"],
      bearings: [280],
      dists: [1100],
    },
    {
      category: "escola",
      names: ["Escola (estimativa)"],
      bearings: [60],
      dists: [500],
    },
  ];
  const out: NearbyPlace[] = [];
  for (const g of seeds) {
    g.names.forEach((name, i) => {
      const dist = g.dists[i];
      if (dist > radiusM) return;
      const p = offsetPoint(lat, lng, dist, g.bearings[i]);
      out.push({
        id: `mock-${g.category}-${i}`,
        name,
        category: g.category,
        lat: p.lat,
        lng: p.lng,
        distanceM: dist,
      });
    });
  }
  return out;
}

export const osmGeoProvider: GeoDataProvider = {
  id: "osm",

  async fetchNearby({ lat, lng, radiusM, signal }) {
    const places = await fetchOverpassNearby(lat, lng, radiusM, signal);
    const useMock = places.length === 0;
    return {
      places: useMock ? mockNearby(lat, lng, radiusM) : places,
      source: useMock ? "mock" : "osm",
      fetchedAt: new Date().toISOString(),
      radiusM,
      center: { lat, lng },
    };
  },

  async geocode({ query, limit, signal }) {
    return nominatimSearch(query, {
      limit,
      cityHint: "Salvador, Bahia, Brasil",
      signal,
    });
  },

  async reverseGeocode({ lat, lng, signal }) {
    return nominatimReverse(lat, lng, { signal });
  },
};

/** Encaminha para o motor Python / FastAPI (mesmo contrato JSON). */
export function createBackendGeoProvider(
  origin = dataSources.backendOrigin,
): GeoDataProvider {
  const base = origin.replace(/\/$/, "");
  return {
    id: "backend",

    async fetchNearby({ lat, lng, radiusM, signal }) {
      const url = new URL(`${base}/nearby`);
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lng", String(lng));
      url.searchParams.set("radius_m", String(radiusM));
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal,
      });
      if (!res.ok) throw new Error(`backend nearby ${res.status}`);
      const data = await res.json();
      return {
        places: data.places ?? [],
        source: "backend",
        fetchedAt: data.fetchedAt || new Date().toISOString(),
        radiusM,
        center: { lat, lng },
      } satisfies NearbyResponse;
    },

    async geocode({ query, limit, signal }) {
      const url = new URL(`${base}/geocode`);
      url.searchParams.set("q", query);
      if (limit) url.searchParams.set("limit", String(limit));
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal,
      });
      if (!res.ok) throw new Error(`backend geocode ${res.status}`);
      return res.json();
    },

    async reverseGeocode({ lat, lng, signal }) {
      const url = new URL(`${base}/reverse`);
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lng", String(lng));
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal,
      });
      if (!res.ok) return null;
      return res.json();
    },
  };
}
