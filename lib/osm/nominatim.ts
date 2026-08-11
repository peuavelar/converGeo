/**
 * Cliente Nominatim (OpenStreetMap geocoding).
 * Política: https://operations.osmfoundation.org/policies/nominatim/
 * Sempre chamar via BFF com User-Agent identificável.
 */

import { dataSources } from "../config/dataSources";
import type { GeocodeHit, ReverseGeocodeHit } from "../geo/types";

const NOMINATIM = "https://nominatim.openstreetmap.org";

type NominatimSearchItem = {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
};

type NominatimReverse = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    municipality?: string;
  };
};

export async function nominatimSearch(
  query: string,
  options?: {
    limit?: number;
    cityHint?: string;
    signal?: AbortSignal;
  },
): Promise<GeocodeHit[]> {
  const q = options?.cityHint
    ? `${query}, ${options.cityHint}`
    : query;
  const url = new URL(`${NOMINATIM}/search`);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(options?.limit ?? 5));
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": dataSources.userAgent,
    },
    signal: options?.signal,
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as NominatimSearchItem[];
  return (data || []).map((item) => ({
    lat: Number(item.lat),
    lng: Number(item.lon),
    name: item.name || item.display_name.split(",")[0] || query,
    displayName: item.display_name,
    source: "osm" as const,
  }));
}

export async function nominatimReverse(
  lat: number,
  lng: number,
  options?: { zoom?: number; signal?: AbortSignal },
): Promise<ReverseGeocodeHit | null> {
  const url = new URL(`${NOMINATIM}/reverse`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", String(options?.zoom ?? 14));

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": dataSources.userAgent,
    },
    signal: options?.signal,
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as NominatimReverse;
  if (!data?.display_name) return null;
  return {
    lat: Number(data.lat),
    lng: Number(data.lon),
    displayName: data.display_name,
    neighbourhood: data.address?.neighbourhood,
    suburb: data.address?.suburb,
    city:
      data.address?.city ||
      data.address?.town ||
      data.address?.municipality,
    source: "osm",
  };
}
