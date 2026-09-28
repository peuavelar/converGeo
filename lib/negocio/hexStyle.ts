/** Visual do heatmap H3 — cor relativa ao conjunto visível + recuo do anel. */

export function relativeT(score: number, min: number, max: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return 0.5;
  }
  if (max - min < 1e-6) return 0.5;
  return Math.min(1, Math.max(0, (score - min) / (max - min)));
}

export function scoreRange(scores: number[]): { min: number; max: number } {
  const finite = scores.filter((n) => Number.isFinite(n));
  if (!finite.length) return { min: 0, max: 0 };
  return { min: Math.min(...finite), max: Math.max(...finite) };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Gradiente no mapa escuro: vinho → âmbar → ciano. */
export function heatmapFill(
  t: number,
  dark = true,
): [number, number, number, number] {
  const x = Math.min(1, Math.max(0, t));
  const low: [number, number, number] = dark ? [88, 28, 48] : [239, 68, 68];
  const mid: [number, number, number] = dark ? [245, 158, 11] : [245, 158, 11];
  const high: [number, number, number] = dark ? [52, 211, 191] : [16, 185, 129];
  const rgb =
    x < 0.5 ? mix(low, mid, x * 2) : mix(mid, high, (x - 0.5) * 2);
  const alpha = dark ? 210 : 200;
  return [Math.round(rgb[0]), Math.round(rgb[1]), Math.round(rgb[2]), alpha];
}

/** Recua o anel em torno do centróide para o hexágono não virar um tapete. */
export function insetRing(
  ring: [number, number][],
  factor = 0.82,
): [number, number][] {
  if (ring.length < 4) return ring;
  const body = ring.slice(0, -1);
  const cx = body.reduce((s, p) => s + p[0], 0) / body.length;
  const cy = body.reduce((s, p) => s + p[1], 0) / body.length;
  const scaled = body.map(
    ([lng, lat]) =>
      [cx + (lng - cx) * factor, cy + (lat - cy) * factor] as [number, number],
  );
  return [...scaled, scaled[0]];
}
