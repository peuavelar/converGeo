import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExternalListingSnapshot } from "../types";
import {
  dedupeSnapshots,
  discardIqrOutliers,
  filterTemporalWindow,
  flagStaleListings,
  pickBucketWithFallback,
  requirePriceAndArea,
  separateByBusinessType,
  withAskingPriceBasis,
} from "../rules";

function snap(
  partial: Partial<ExternalListingSnapshot> &
    Pick<
      ExternalListingSnapshot,
      "id" | "price" | "usableArea" | "neighborhood" | "businessType"
    >,
): ExternalListingSnapshot {
  return {
    source: "simulated",
    sourceUrl: "https://example.invalid/x",
    capturedAt: new Date().toISOString(),
    bedrooms: 2,
    bathrooms: 1,
    propertyType: "apartamento",
    city: "Salvador",
    listedAt: new Date().toISOString(),
    rawHash: "x",
    ...partial,
  };
}

describe("separateByBusinessType", () => {
  it("nunca mistura venda e aluguel", () => {
    const items = [
      snap({
        id: "a",
        price: 500000,
        usableArea: 70,
        neighborhood: "Pituba",
        businessType: "venda",
      }),
      snap({
        id: "b",
        price: 3500,
        usableArea: 70,
        neighborhood: "Pituba",
        businessType: "aluguel",
      }),
    ];
    const sale = separateByBusinessType(items, "venda");
    assert.equal(sale.length, 1);
    assert.equal(sale[0].businessType, "venda");
  });
});

describe("dedupeSnapshots", () => {
  it("colapsa o mesmo imóvel em fontes diferentes", () => {
    const items = [
      snap({
        id: "olx:1",
        source: "olx",
        price: 500000,
        usableArea: 70,
        neighborhood: "Pituba",
        businessType: "venda",
      }),
      snap({
        id: "zap:1",
        source: "zap",
        price: 500000,
        usableArea: 70,
        neighborhood: "Pituba",
        businessType: "venda",
      }),
      snap({
        id: "vr:1",
        source: "vivareal",
        price: 500000,
        usableArea: 72,
        neighborhood: "Pituba",
        businessType: "venda",
      }),
    ];
    // 70 e 72 arredondam para faixa 70 (5m²); preço igual → 1 canônico se mesma faixa
    const deduped = dedupeSnapshots(items);
    assert.ok(deduped.length <= 2);
    assert.ok(deduped.some((d) => d.sources.length >= 2));
  });
});

describe("discardIqrOutliers", () => {
  it("remove extremos fora de p25±1.5 IQR", () => {
    const base = Array.from({ length: 10 }, (_, i) =>
      snap({
        id: `n${i}`,
        price: (7000 + i * 50) * 70,
        usableArea: 70,
        neighborhood: "Pituba",
        businessType: "venda",
      }),
    );
    base.push(
      snap({
        id: "low",
        price: 70,
        usableArea: 70,
        neighborhood: "Pituba",
        businessType: "venda",
      }),
      snap({
        id: "high",
        price: 70 * 900000,
        usableArea: 70,
        neighborhood: "Pituba",
        businessType: "venda",
      }),
    );
    const { kept, discarded } = discardIqrOutliers(base);
    assert.ok(discarded.length >= 1);
    assert.ok(kept.every((k) => k.id !== "low" && k.id !== "high"));
  });
});

describe("requirePriceAndArea", () => {
  it("descarta sem price ou sem usableArea", () => {
    const items = [
      snap({
        id: "ok",
        price: 100,
        usableArea: 50,
        neighborhood: "X",
        businessType: "venda",
      }),
      snap({
        id: "bad1",
        price: 0,
        usableArea: 50,
        neighborhood: "X",
        businessType: "venda",
      }),
      {
        ...snap({
          id: "bad2",
          price: 100,
          usableArea: 50,
          neighborhood: "X",
          businessType: "venda",
        }),
        usableArea: Number.NaN,
      },
    ];
    const ok = requirePriceAndArea(items);
    assert.equal(ok.length, 1);
    assert.equal(ok[0].id, "ok");
  });
});

describe("filterTemporalWindow", () => {
  it("só mantém capturedAt dos últimos 90 dias", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");
    const items = [
      snap({
        id: "new",
        price: 1,
        usableArea: 50,
        neighborhood: "X",
        businessType: "venda",
        capturedAt: "2026-07-01T00:00:00.000Z",
      }),
      snap({
        id: "old",
        price: 1,
        usableArea: 50,
        neighborhood: "X",
        businessType: "venda",
        capturedAt: "2025-01-01T00:00:00.000Z",
      }),
    ];
    const kept = filterTemporalWindow(items, now);
    assert.equal(kept.length, 1);
    assert.equal(kept[0].id, "new");
  });
});

describe("flagStaleListings", () => {
  it("marca listedAt > 180 dias como encalhada", () => {
    const now = new Date("2026-08-11T12:00:00.000Z");
    const flagged = flagStaleListings(
      [
        snap({
          id: "stale",
          price: 1,
          usableArea: 50,
          neighborhood: "X",
          businessType: "venda",
          listedAt: "2025-01-01T00:00:00.000Z",
        }),
        snap({
          id: "fresh",
          price: 1,
          usableArea: 50,
          neighborhood: "X",
          businessType: "venda",
          listedAt: "2026-07-01T00:00:00.000Z",
        }),
      ],
      now,
    );
    assert.equal(flagged.find((f) => f.id === "stale")?.staleListing, true);
    assert.equal(flagged.find((f) => f.id === "fresh")?.staleListing, false);
  });
});

describe("pickBucketWithFallback", () => {
  it("faz fallback quando n < 8 no bairro", () => {
    const few = Array.from({ length: 3 }, (_, i) =>
      snap({
        id: `n${i}`,
        price: 7000 * 70,
        usableArea: 70,
        neighborhood: "Pituba",
        businessType: "venda",
        bedrooms: 2,
      }),
    );
    const city = Array.from({ length: 12 }, (_, i) =>
      snap({
        id: `c${i}`,
        price: (6800 + i * 20) * 70,
        usableArea: 70,
        neighborhood: i < 3 ? "Pituba" : "Barra",
        businessType: "venda",
        bedrooms: 2,
      }),
    );
    const bench = pickBucketWithFallback({
      neighborhoodItems: few,
      regionItems: few,
      cityItems: city,
      neighborhoodId: "pituba",
      regionId: "pituba",
      cityId: "salvador",
      propertyType: "apartamento",
      bedrooms: 2,
      businessType: "venda",
      previousByKey: new Map(),
      collectionCountByKey: new Map(),
      computedAt: new Date().toISOString(),
    });
    assert.ok(bench);
    assert.equal(bench!.bucketLevel, "city");
    assert.ok(bench!.n >= 8);
  });
});

describe("withAskingPriceBasis", () => {
  it("grava priceBasis asking", () => {
    const row = withAskingPriceBasis({ priceBasis: "transaction" as string });
    assert.equal(row.priceBasis, "asking");
  });
});
