export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function bedroomsBand(bedrooms: number | null): "0" | "1" | "2" | "3" | "4plus" {
  if (bedrooms == null || bedrooms <= 0) return "0";
  if (bedrooms === 1) return "1";
  if (bedrooms === 2) return "2";
  if (bedrooms === 3) return "3";
  return "4plus";
}

export function areaBucket(usableArea: number): number {
  return Math.round(usableArea / 5) * 5;
}

export function priceBand(price: number): number {
  const band = Math.max(1, Math.round(price * 0.02));
  return Math.round(price / band) * band;
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return percentile(s, 50);
}

export function daysBetween(laterIso: string, earlierIso: string): number {
  const a = Date.parse(laterIso);
  const b = Date.parse(earlierIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((a - b) / 86_400_000));
}
