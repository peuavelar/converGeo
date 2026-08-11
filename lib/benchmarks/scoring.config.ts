/**
 * Pesos do componente de preço externo (S1).
 * NÃO rebalanceia Match Score nem os 6 fatores mock do Opportunity base.
 *
 * calibrated = clamp(0,100, baseScore + EXTERNAL_PRICE_WEIGHT * maxAdj * signal)
 * signal ∈ [-1, +1]: abaixo da mediana → positivo.
 */
export const scoringConfig = {
  /** Feature flag lida de env em runtime — ver isExternalBenchmarkEnabled(). */
  externalPriceWeight: 0.1,
  /** Amplitude máxima do ajuste em pontos de score (±). */
  externalPriceMaxAdjPoints: 6,
  /** n mínimo para publicar um bucket. */
  minBucketN: 8,
  /** Janela de snapshots no cálculo de mediana R$/m². */
  snapshotWindowDays: 90,
  /** listedAt acima disso marca oferta encalhada (ainda entra em daysOnMarket). */
  staleListingDays: 180,
  /** Coletas históricas mínimas do bucket para exibir valorização. */
  minHistoryCollectionsForValorizacao: 3,
  priceBasis: "asking" as const,
} as const;

export function isExternalBenchmarkEnabled(): boolean {
  const v = (
    process.env.ENABLE_EXTERNAL_BENCHMARK ||
    process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_BENCHMARK ||
    ""
  )
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
