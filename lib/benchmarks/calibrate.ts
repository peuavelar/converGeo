import { scoringConfig } from "./scoring.config";
import type {
  CalibratedOpportunity,
  PriceBenchmark,
  ScoreBenchmarkExplain,
} from "./types";

/**
 * Percentil empírico: fração de observações do bucket com R$/m² <= listing.
 * Aproximação via distribuição p25/median/p75 quando só temos agregados.
 */
export function estimatePricePositionPercentile(
  listingPricePerM2: number,
  bench: PriceBenchmark,
): number {
  const { p25, medianPricePerM2: med, p75 } = bench;
  if (listingPricePerM2 <= p25) {
    const span = Math.max(1, med - p25);
    return Math.max(0, Math.min(25, 25 * (listingPricePerM2 - (p25 - span)) / (span * 2)));
  }
  if (listingPricePerM2 <= med) {
    const span = Math.max(1, med - p25);
    return 25 + (50 - 25) * ((listingPricePerM2 - p25) / span);
  }
  if (listingPricePerM2 <= p75) {
    const span = Math.max(1, p75 - med);
    return 50 + (75 - 50) * ((listingPricePerM2 - med) / span);
  }
  const span = Math.max(1, p75 - med);
  const over = (listingPricePerM2 - p75) / span;
  return Math.min(100, 75 + Math.min(25, over * 25));
}

/**
 * S1 — não altera baseScore. calibratedOpportunityScore é derivado.
 * Sem benchmark: adj=0, benchmarkAvailable=false.
 */
export function calibrateOpportunityScore(
  baseScore: number,
  listingPricePerM2: number | null,
  bench: PriceBenchmark | null,
): CalibratedOpportunity {
  if (
    !bench ||
    listingPricePerM2 == null ||
    !Number.isFinite(listingPricePerM2) ||
    listingPricePerM2 <= 0
  ) {
    return {
      baseScore,
      calibratedOpportunityScore: baseScore,
      pricePositionPercentile: null,
      priceAdj: 0,
      benchmarkAvailable: false,
      explain: null,
    };
  }

  const pct = estimatePricePositionPercentile(listingPricePerM2, bench);
  // Abaixo da mediana (pct < 50) → signal positivo
  const signal = (50 - pct) / 50; // [-1, +1] approx
  const priceAdj =
    scoringConfig.externalPriceWeight *
    scoringConfig.externalPriceMaxAdjPoints *
    signal;
  const calibrated = Math.round(
    Math.min(100, Math.max(0, baseScore + priceAdj)),
  );

  const explain: ScoreBenchmarkExplain = {
    bucketKey: bench.bucketKey,
    bucketLevel: bench.bucketLevel,
    n: bench.n,
    medianPricePerM2: bench.medianPricePerM2,
    computedAt: bench.computedAt,
    pricePositionPercentile: Math.round(pct * 10) / 10,
    priceBasis: "asking",
    benchmarkAvailable: true,
  };

  return {
    baseScore,
    calibratedOpportunityScore: calibrated,
    pricePositionPercentile: explain.pricePositionPercentile,
    priceAdj: Math.round(priceAdj * 100) / 100,
    benchmarkAvailable: true,
    explain,
  };
}

/** Variação do bairro — só com collectionCount >= 3. */
export function benchmarkValorizacaoPct(
  bench: PriceBenchmark | null,
): number | null {
  if (!bench) return null;
  if (
    bench.collectionCount < scoringConfig.minHistoryCollectionsForValorizacao
  ) {
    return null;
  }
  if (
    bench.previousMedianPricePerM2 == null ||
    bench.previousMedianPricePerM2 <= 0
  ) {
    return null;
  }
  return (
    ((bench.medianPricePerM2 - bench.previousMedianPricePerM2) /
      bench.previousMedianPricePerM2) *
    100
  );
}

export function formatBenchmarkExplain(
  explain: ScoreBenchmarkExplain | null,
): string | null {
  if (!explain?.benchmarkAvailable) return null;
  const vsMedian = 50 - explain.pricePositionPercentile;
  const dir =
    vsMedian > 0.5
      ? `${Math.abs(Math.round(vsMedian))}% abaixo da mediana`
      : vsMedian < -0.5
        ? `${Math.abs(Math.round(vsMedian))}% acima da mediana`
        : "próximo da mediana";
  const level =
    explain.bucketLevel === "neighborhood"
      ? "bairro"
      : explain.bucketLevel === "region"
        ? "região"
        : "cidade";
  const date = new Date(explain.computedAt).toLocaleDateString("pt-BR");
  return `${dir} do ${level} (base: ${explain.n} anúncios, atualizado em ${date})`;
}
