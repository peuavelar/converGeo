import { cellToBoundary } from "h3-js";
import { insetRing } from "./hexStyle";

/** Anel [lng, lat] fechado para PolygonLayer / MapLibre. */
export function h3ToLngLatRing(
  h3Index: string,
  inset = 1,
): [number, number][] {
  const ring = cellToBoundary(h3Index, true) as [number, number][];
  if (ring.length < 3) return [];
  const first = ring[0];
  const last = ring[ring.length - 1];
  const closed =
    first[0] !== last[0] || first[1] !== last[1] ? [...ring, first] : ring;
  return inset < 1 ? insetRing(closed, inset) : closed;
}
