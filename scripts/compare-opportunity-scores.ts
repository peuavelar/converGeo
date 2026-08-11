/**
 * Relatório flag OFF vs ON para os 16 imóveis do marketplace.
 *   ENABLE_EXTERNAL_BENCHMARK=true npx tsx scripts/compare-opportunity-scores.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { MARKETPLACE_LISTINGS } from "../app/data/marketplaceListings";
import { calibrateOpportunityScore } from "../lib/benchmarks/calibrate";
import { findBenchmarkForListing } from "../lib/benchmarks/compute";
import type { PriceBenchmark } from "../lib/benchmarks/types";

function loadBenches(): PriceBenchmark[] {
  const file = path.join(
    process.cwd(),
    "data",
    "benchmarks",
    "price_benchmarks.json",
  );
  try {
    return JSON.parse(readFileSync(file, "utf8")) as PriceBenchmark[];
  } catch {
    return [];
  }
}

function main() {
  const benches = loadBenches();
  const rows = MARKETPLACE_LISTINGS.map((l) => {
    const bench = findBenchmarkForListing(benches, {
      neighborhoodId: l.regionId,
      propertyType: "apartamento",
      bedrooms: l.beds,
      businessType: "venda",
    });
    const off = l.score;
    const on = calibrateOpportunityScore(l.score, l.precoM2, bench);
    return {
      id: l.id,
      regionId: l.regionId,
      baseScore: off,
      calibrated: on.calibratedOpportunityScore,
      delta: on.calibratedOpportunityScore - off,
      percentile: on.pricePositionPercentile,
      benchmarkAvailable: on.benchmarkAvailable,
      bucketLevel: on.explain?.bucketLevel ?? null,
      n: on.explain?.n ?? null,
    };
  });

  const withBench = rows.filter((r) => r.benchmarkAvailable);
  const avgDelta =
    withBench.reduce((s, r) => s + r.delta, 0) / Math.max(1, withBench.length);

  console.log(
    JSON.stringify(
      {
        listings: rows.length,
        withBenchmark: withBench.length,
        avgDelta: Math.round(avgDelta * 100) / 100,
        maxAbsDelta: Math.max(...rows.map((r) => Math.abs(r.delta))),
        rows,
      },
      null,
      2,
    ),
  );
}

main();
