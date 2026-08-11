import { NextResponse } from "next/server";
import { MARKETPLACE_LISTINGS } from "@/app/data/marketplaceListings";
import { enrichListingScore } from "@/lib/benchmarks";
import { loadBenchmarks } from "@/lib/benchmarks/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scores derivados do marketplace — nunca devolve external_listing_snapshots.
 */
export async function GET() {
  const benches = await loadBenchmarks();
  const items = MARKETPLACE_LISTINGS.map((l) => {
    const view = enrichListingScore(l, benches);
    return {
      id: l.id,
      baseScore: view.baseScore,
      opportunityScore: view.displayScore,
      pricePositionPercentile: view.pricePositionPercentile,
      benchmarkAvailable: view.calibrated.benchmarkAvailable,
      explain: view.explainLabel,
      explainMeta: view.calibrated.explain
        ? {
            bucketKey: view.calibrated.explain.bucketKey,
            bucketLevel: view.calibrated.explain.bucketLevel,
            n: view.calibrated.explain.n,
            medianPricePerM2: view.calibrated.explain.medianPricePerM2,
            computedAt: view.calibrated.explain.computedAt,
            priceBasis: "asking" as const,
          }
        : null,
      valorizacaoPct: view.showValorizacao ? view.valorizacaoPct : null,
    };
  });

  return NextResponse.json({
    items,
    marketplaceCount: MARKETPLACE_LISTINGS.length,
  });
}
