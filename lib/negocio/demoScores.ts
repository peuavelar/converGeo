/**
 * Paridade com engine/convergeo_engine/seed_demo.py (v1.3.0).
 * Usado só quando o motor remoto falha — respostas levam demo: true.
 */
import { createHash } from "node:crypto";
import { cellToLatLng, gridDisk, latLngToCell } from "h3-js";

export const H3_RES = 8;

export const DEMO_CENTERS: ReadonlyArray<readonly [number, number]> = [
  [-13.0018, -38.4631],
  [-13.01, -38.531],
  [-13.0098, -38.4865],
  [-12.9764, -38.4609],
  [-12.9328, -38.4235],
  [-12.9165, -38.4168],
  [-12.9416, -38.3571],
  [-12.894, -38.327],
];

export const DEMO_SEGMENTS = [
  "food_service",
  "padaria",
  "cafe",
  "farmacia",
  "clinica",
  "otica",
  "academia",
  "beleza",
  "vestuario",
  "supermercado",
  "pet",
  "papelaria",
  "construcao",
  "posto",
  "hotel",
  "educacao",
  "imobiliaria",
] as const;

export type DemoSegment = (typeof DEMO_SEGMENTS)[number];

export type ScoreBreakdown = {
  estrutural: number;
  macroeconomico: number;
  comportamental: number;
};

export type ScoreOk = {
  status: "sucesso";
  h3_index: string;
  lat: number;
  lng: number;
  segmento: string;
  score_total: number;
  breakdown: ScoreBreakdown;
  demo?: boolean;
};

export type ScoreEmpty = {
  status: "sem_dados";
  h3_index: string;
  mensagem: string;
  demo?: boolean;
};

function unit(key: string): number {
  return createHash("sha256").update(key).digest()[0] / 255;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

let cellsCache: string[] | null = null;

export function demoCoverageCells(): string[] {
  if (cellsCache) return cellsCache;
  const set = new Set<string>();
  for (const [lat, lng] of DEMO_CENTERS) {
    const origin = latLngToCell(lat, lng, H3_RES);
    for (const cell of gridDisk(origin, 3)) set.add(cell);
  }
  cellsCache = [...set];
  return cellsCache;
}

export function isDemoSegment(segmento: string): segmento is DemoSegment {
  return (DEMO_SEGMENTS as readonly string[]).includes(segmento);
}

export function demoScoreForCell(cell: string, segmento: string): ScoreOk {
  const estrutural = round2(4 + 6 * unit(`${segmento}-e-${cell}`));
  const macroeconomico = round2(3 + 7 * unit(`${segmento}-m-${cell}`));
  const comportamental = round2(4 + 5 * unit(`${segmento}-c-${cell}`));
  const score_total = round2(
    0.35 * estrutural + 0.4 * macroeconomico + 0.25 * comportamental,
  );
  const [lat, lng] = cellToLatLng(cell);
  return {
    status: "sucesso",
    h3_index: cell,
    lat,
    lng,
    segmento,
    score_total,
    breakdown: { estrutural, macroeconomico, comportamental },
    demo: true,
  };
}

export function demoScoreAt(
  lat: number,
  lng: number,
  segmento: string,
): ScoreOk | ScoreEmpty {
  const h3_index = latLngToCell(lat, lng, H3_RES);
  const covered = demoCoverageCells();
  if (!covered.includes(h3_index)) {
    return {
      status: "sem_dados",
      h3_index,
      mensagem: "Região sem dados suficientes ou fora da área de cobertura.",
      demo: true,
    };
  }
  return demoScoreForCell(h3_index, segmento);
}

export function demoTop(segmento: string, limit: number): {
  status: "sucesso";
  segmento: string;
  recomendacoes: Array<
    Omit<ScoreOk, "status" | "segmento" | "demo"> & { demo?: undefined }
  >;
  demo: true;
} {
  const rows = demoCoverageCells()
    .map((cell) => demoScoreForCell(cell, segmento))
    .sort((a, b) => b.score_total - a.score_total)
    .slice(0, Math.max(1, Math.min(limit, 300)))
    .map((row) => ({
      h3_index: row.h3_index,
      lat: row.lat,
      lng: row.lng,
      score_total: row.score_total,
      breakdown: row.breakdown,
    }));
  return { status: "sucesso", segmento, recomendacoes: rows, demo: true };
}
