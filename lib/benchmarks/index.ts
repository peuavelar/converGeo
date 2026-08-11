import { isExternalBenchmarkEnabled } from "./scoring.config";
import {
  calibrateOpportunityScore,
  benchmarkValorizacaoPct,
  formatBenchmarkExplain,
} from "./calibrate";
import { findBenchmarkForListing } from "./compute";
import type { CalibratedOpportunity, PriceBenchmark } from "./types";
import type { MarketplaceListing } from "@/app/data/marketplaceListings";

export type ListingScoreView = {
  listingId: string;
  displayScore: number;
  baseScore: number;
  calibrated: CalibratedOpportunity;
  explainLabel: string | null;
  valorizacaoPct: number | null;
  showValorizacao: boolean;
  /** Para chip Custo-benefício: percentil real (menor = mais barato vs mercado). */
  pricePositionPercentile: number | null;
};

export function enrichListingScore(
  listing: MarketplaceListing,
  benches: PriceBenchmark[],
): ListingScoreView {
  const enabled = isExternalBenchmarkEnabled();
  const bench = enabled
    ? findBenchmarkForListing(benches, {
        neighborhoodId: listing.regionId,
        propertyType: "apartamento",
        bedrooms: listing.beds,
        businessType: "venda",
      })
    : null;

  const calibrated = enabled
    ? calibrateOpportunityScore(listing.score, listing.precoM2, bench)
    : {
        baseScore: listing.score,
        calibratedOpportunityScore: listing.score,
        pricePositionPercentile: null,
        priceAdj: 0,
        benchmarkAvailable: false,
        explain: null,
      };

  const valorizacaoPct = enabled ? benchmarkValorizacaoPct(bench) : null;

  return {
    listingId: listing.id,
    displayScore: calibrated.calibratedOpportunityScore,
    baseScore: listing.score,
    calibrated,
    explainLabel: formatBenchmarkExplain(calibrated.explain),
    valorizacaoPct,
    showValorizacao: valorizacaoPct != null,
    pricePositionPercentile: calibrated.pricePositionPercentile,
  };
}

export {
  isExternalBenchmarkEnabled,
  calibrateOpportunityScore,
  findBenchmarkForListing,
  formatBenchmarkExplain,
  benchmarkValorizacaoPct,
};
export * from "./types";
export { scoringConfig } from "./scoring.config";
export { COLLECTION_CUTS } from "./cuts";
export { runBenchmarkCollection } from "./collect";
export { computePriceBenchmarks } from "./compute";
