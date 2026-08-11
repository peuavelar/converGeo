/**
 * Regras estatísticas obrigatórias (R3).
 * Cada função é pura e coberta por teste unitário.
 */

import type { BusinessType, ExternalListingSnapshot } from "../types";
import {
  areaBucket,
  bedroomsBand,
  daysBetween,
  median,
  normalizeText,
  percentile,
  priceBand,
} from "../stats";
import { scoringConfig } from "../scoring.config";
import type { PriceBenchmark, PropertyTypeBand, BucketLevel } from "../types";

export { bedroomsBand };

/** 1) Separe venda de aluguel — nunca no mesmo bucket. */
export function separateByBusinessType(
  items: ExternalListingSnapshot[],
  businessType: BusinessType,
): ExternalListingSnapshot[] {
  return items.filter((i) => i.businessType === businessType);
}

export type DedupeCanonical = ExternalListingSnapshot & {
  sources: ExternalListingSnapshot["source"][];
};

/** 2) Deduplique antes de calcular. */
export function dedupeSnapshots(
  items: ExternalListingSnapshot[],
): DedupeCanonical[] {
  const map = new Map<string, DedupeCanonical>();
  for (const item of items) {
    const key = [
      normalizeText(item.neighborhood),
      areaBucket(item.usableArea),
      priceBand(item.price),
      item.businessType,
    ].join("|");
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item, sources: [item.source] });
      continue;
    }
    if (!existing.sources.includes(item.source)) {
      existing.sources.push(item.source);
    }
    // Mantém o mais recente como canônico
    if (item.capturedAt > existing.capturedAt) {
      Object.assign(existing, item, { sources: existing.sources });
    }
  }
  return [...map.values()];
}

/** 3) Descarte outlier por IQR em R$/m². */
export function discardIqrOutliers(
  items: ExternalListingSnapshot[],
): {
  kept: ExternalListingSnapshot[];
  discarded: ExternalListingSnapshot[];
  p25: number;
  p75: number;
  iqr: number;
} {
  const ppm2 = items.map((i) => i.price / i.usableArea).sort((a, b) => a - b);
  const p25 = percentile(ppm2, 25);
  const p75 = percentile(ppm2, 75);
  const iqr = p75 - p25;
  const lo = p25 - 1.5 * iqr;
  const hi = p75 + 1.5 * iqr;
  const kept: ExternalListingSnapshot[] = [];
  const discarded: ExternalListingSnapshot[] = [];
  for (const item of items) {
    const v = item.price / item.usableArea;
    if (v < lo || v > hi) discarded.push(item);
    else kept.push(item);
  }
  return { kept, discarded, p25, p75, iqr };
}

/** 4) Descarte item sem price ou sem usableArea — não estime área. */
export function requirePriceAndArea(
  items: ExternalListingSnapshot[],
): ExternalListingSnapshot[] {
  return items.filter(
    (i) =>
      typeof i.price === "number" &&
      Number.isFinite(i.price) &&
      i.price > 0 &&
      typeof i.usableArea === "number" &&
      Number.isFinite(i.usableArea) &&
      i.usableArea > 0,
  );
}

/** 5) Janela temporal: capturedAt ≤ 90 dias. */
export function filterTemporalWindow(
  items: ExternalListingSnapshot[],
  now = new Date(),
): ExternalListingSnapshot[] {
  const cutoff = now.getTime() - scoringConfig.snapshotWindowDays * 86_400_000;
  return items.filter((i) => {
    const t = Date.parse(i.capturedAt);
    return Number.isFinite(t) && t >= cutoff;
  });
}

export type StaleFlagged = ExternalListingSnapshot & {
  staleListing: boolean;
  daysOnMarket: number | null;
};

/** listedAt > 180d → encalhada; ainda entra em medianDaysOnMarket. */
export function flagStaleListings(
  items: ExternalListingSnapshot[],
  now = new Date(),
): StaleFlagged[] {
  const nowIso = now.toISOString();
  return items.map((i) => {
    if (!i.listedAt) {
      return { ...i, staleListing: false, daysOnMarket: null };
    }
    const days = daysBetween(nowIso, i.listedAt);
    return {
      ...i,
      staleListing: days > scoringConfig.staleListingDays,
      daysOnMarket: days,
    };
  });
}

export function buildBucketKey(parts: {
  level: BucketLevel;
  placeId: string;
  propertyType: PropertyTypeBand;
  bedroomsBand: ReturnType<typeof bedroomsBand>;
  businessType: BusinessType;
}): string {
  return [
    parts.level,
    normalizeText(parts.placeId),
    parts.propertyType,
    parts.bedroomsBand,
    parts.businessType,
  ].join(":");
}

/**
 * 6) n mínimo = 8 com fallback neighborhood → region → city.
 * Retorna null se nem city atingir o mínimo.
 */
export function pickBucketWithFallback(input: {
  neighborhoodItems: ExternalListingSnapshot[];
  regionItems: ExternalListingSnapshot[];
  cityItems: ExternalListingSnapshot[];
  neighborhoodId: string;
  regionId: string;
  cityId: string;
  propertyType: PropertyTypeBand;
  bedrooms: number | null;
  businessType: BusinessType;
  previousByKey: Map<string, number>;
  collectionCountByKey: Map<string, number>;
  computedAt: string;
}): PriceBenchmark | null {
  const minN = scoringConfig.minBucketN;
  const band = bedroomsBand(input.bedrooms);
  const candidates: Array<{
    level: BucketLevel;
    placeId: string;
    items: ExternalListingSnapshot[];
  }> = [
    {
      level: "neighborhood",
      placeId: input.neighborhoodId,
      items: input.neighborhoodItems,
    },
    { level: "region", placeId: input.regionId, items: input.regionItems },
    { level: "city", placeId: input.cityId, items: input.cityItems },
  ];

  for (const c of candidates) {
    const typed = c.items.filter(
      (i) =>
        i.propertyType === input.propertyType &&
        i.businessType === input.businessType &&
        bedroomsBand(i.bedrooms) === band,
    );
    const valid = requirePriceAndArea(typed);
    const deduped = dedupeSnapshots(valid);
    if (deduped.length < minN) continue;

    const { kept, p25, p75, iqr } = discardIqrOutliers(deduped);
    if (kept.length < minN) continue;

    const ppm2 = kept.map((i) => i.price / i.usableArea);
    const prices = kept.map((i) => i.price);
    const flagged = flagStaleListings(kept);
    const dom = flagged
      .map((f) => f.daysOnMarket)
      .filter((d): d is number => d != null);

    const bucketKey = buildBucketKey({
      level: c.level,
      placeId: c.placeId,
      propertyType: input.propertyType,
      bedroomsBand: band,
      businessType: input.businessType,
    });

    const medianPpm2 = median(ppm2);
    const prev = input.previousByKey.get(bucketKey) ?? null;
    const collectionCount =
      (input.collectionCountByKey.get(bucketKey) ?? 0) + 1;

    return {
      bucketKey,
      bucketLevel: c.level,
      propertyType: input.propertyType,
      bedroomsBand: band,
      businessType: input.businessType,
      n: kept.length,
      medianPricePerM2: Math.round(medianPpm2),
      p25: Math.round(p25),
      p75: Math.round(p75),
      iqr: Math.round(iqr),
      medianPrice: Math.round(median(prices)),
      medianDaysOnMarket: dom.length ? Math.round(median(dom)) : 0,
      supplyCount: kept.length,
      computedAt: input.computedAt,
      previousMedianPricePerM2: prev,
      priceBasis: "asking",
      collectionCount,
    };
  }

  return null;
}

/** 7) priceBasis sempre "asking". */
export function withAskingPriceBasis<T extends { priceBasis?: string }>(
  row: T,
): T & { priceBasis: "asking" } {
  return { ...row, priceBasis: "asking" };
}
