import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calibrateOpportunityScore } from "./calibrate";
import type { PriceBenchmark } from "./types";

const bench: PriceBenchmark = {
  bucketKey: "neighborhood:pituba:apartamento:2:venda",
  bucketLevel: "neighborhood",
  propertyType: "apartamento",
  bedroomsBand: "2",
  businessType: "venda",
  n: 23,
  medianPricePerM2: 9000,
  p25: 8000,
  p75: 10000,
  iqr: 2000,
  medianPrice: 630000,
  medianDaysOnMarket: 45,
  supplyCount: 23,
  computedAt: "2026-08-02T00:00:00.000Z",
  previousMedianPricePerM2: 8500,
  priceBasis: "asking",
  collectionCount: 3,
};

describe("calibrateOpportunityScore", () => {
  it("não altera base quando benchmark ausente", () => {
    const r = calibrateOpportunityScore(78, 9200, null);
    assert.equal(r.calibratedOpportunityScore, 78);
    assert.equal(r.benchmarkAvailable, false);
    assert.equal(r.priceAdj, 0);
  });

  it("aumenta score quando abaixo da mediana", () => {
    const r = calibrateOpportunityScore(78, 7500, bench);
    assert.ok(r.calibratedOpportunityScore >= 78);
    assert.equal(r.benchmarkAvailable, true);
    assert.ok(r.explain?.bucketKey);
  });
});
