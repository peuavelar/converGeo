/**
 * Escopo geográfico da coleta de benchmarks: Salvador + RMS (foco Lauro de Freitas).
 * Versionado — o job só processa cidades nesta lista.
 */

export const BENCHMARK_METRO_ID = "rms-salvador";

export const ALLOWED_BENCHMARK_CITIES = [
  "salvador",
  "lauro de freitas",
] as const;

export type AllowedBenchmarkCity = (typeof ALLOWED_BENCHMARK_CITIES)[number];

export function normalizePlace(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function isAllowedBenchmarkCity(city: string | null | undefined): boolean {
  const n = normalizePlace(city);
  return (ALLOWED_BENCHMARK_CITIES as readonly string[]).includes(n);
}

/** Mapeia nome de cidade → id de região agregada. */
export function cityToRegionId(city: string): "salvador" | "lauro-de-freitas" {
  const n = normalizePlace(city);
  if (n === "lauro de freitas") return "lauro-de-freitas";
  return "salvador";
}
