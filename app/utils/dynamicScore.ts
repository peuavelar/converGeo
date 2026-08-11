export type ScoreWeights = {
  demografia: number;
  mercado: number;
  fluxo: number;
};

type HexLike = {
  breakdown?: {
    estrutural?: number;
    macroeconomico?: number;
    comportamental?: number;
  };
};

/** Score ponderado 0–10 a partir do breakdown da API. */
export function getDynamicScore(hex: HexLike, w: ScoreWeights): number {
  const total = w.demografia + w.mercado + w.fluxo;
  if (!total) return 0;
  const bd = hex.breakdown || {};
  return (
    ((bd.estrutural || 0) * w.demografia +
      (bd.macroeconomico || 0) * w.mercado +
      (bd.comportamental || 0) * w.fluxo) /
    total
  );
}
