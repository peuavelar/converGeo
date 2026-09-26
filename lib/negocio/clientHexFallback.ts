/**
 * Fallback no browser quando /api/negocio falha.
 * Gera a mesma grade H3 do seed_demo (centros + gridDisk 3).
 */
import { cellToLatLng, gridDisk, latLngToCell } from "h3-js";

const H3_RES = 8;
const DEMO_CENTERS: ReadonlyArray<readonly [number, number]> = [
  [-13.0018, -38.4631],
  [-13.01, -38.531],
  [-13.0098, -38.4865],
  [-12.9764, -38.4609],
  [-12.9328, -38.4235],
  [-12.9165, -38.4168],
  [-12.9416, -38.3571],
  [-12.894, -38.327],
];

function unit(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 256) / 255;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type ClientHex = {
  h3_index: string;
  lat: number;
  lng: number;
  segmento: string;
  score_total: number;
  breakdown: {
    estrutural: number;
    macroeconomico: number;
    comportamental: number;
  };
  demo: true;
};

function scoreCell(cell: string, segmento: string): ClientHex {
  const estrutural = round2(4 + 6 * unit(`${segmento}-e-${cell}`));
  const macroeconomico = round2(3 + 7 * unit(`${segmento}-m-${cell}`));
  const comportamental = round2(4 + 5 * unit(`${segmento}-c-${cell}`));
  const [lat, lng] = cellToLatLng(cell);
  return {
    h3_index: cell,
    lat,
    lng,
    segmento,
    score_total: round2(0.35 * estrutural + 0.4 * macroeconomico + 0.25 * comportamental),
    breakdown: { estrutural, macroeconomico, comportamental },
    demo: true,
  };
}

function coverage(): string[] {
  const set = new Set<string>();
  for (const [lat, lng] of DEMO_CENTERS) {
    for (const cell of gridDisk(latLngToCell(lat, lng, H3_RES), 3)) {
      set.add(cell);
    }
  }
  return [...set];
}

export function clientScoreAt(
  lat: number,
  lng: number,
  segmento: string,
): ClientHex | null {
  const cell = latLngToCell(lat, lng, H3_RES);
  if (!coverage().includes(cell)) return null;
  return scoreCell(cell, segmento);
}

export function clientTop(segmento: string, limit: number): ClientHex[] {
  return coverage()
    .map((cell) => scoreCell(cell, segmento))
    .sort((a, b) => b.score_total - a.score_total)
    .slice(0, Math.max(1, Math.min(limit, 300)));
}
