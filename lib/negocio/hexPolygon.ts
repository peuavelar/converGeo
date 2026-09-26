import { cellToBoundary } from "h3-js";

/** Anel [lng, lat] fechado para PolygonLayer / MapLibre. */
export function h3ToLngLatRing(h3Index: string): [number, number][] {
  const ring = cellToBoundary(h3Index, true) as [number, number][];
  if (ring.length < 3) return [];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...ring, first];
  }
  return ring;
}
