import { COLLECTION_CUTS } from "./cuts";
import {
  BENCHMARK_METRO_ID,
  cityToRegionId,
  isAllowedBenchmarkCity,
  normalizePlace,
} from "./metro";
import {
  bedroomsBand,
  filterTemporalWindow,
  pickBucketWithFallback,
  requirePriceAndArea,
  separateByBusinessType,
} from "./rules";
import type {
  ExternalListingSnapshot,
  PriceBenchmark,
  PropertyTypeBand,
} from "./types";

function matchesNeighborhood(
  snapshot: ExternalListingSnapshot,
  cutName: string,
  cutId: string,
): boolean {
  const n = normalizePlace(snapshot.neighborhood);
  const name = normalizePlace(cutName);
  const id = normalizePlace(cutId.replace(/-/g, " "));
  return n === name || n === id || n.includes(name.split(" ")[0]);
}

/**
 * Recomputa price_benchmarks a partir dos snapshots (regras R3).
 * Escopo: Salvador + Lauro de Freitas (RMS).
 */
export function computePriceBenchmarks(
  snapshots: ExternalListingSnapshot[],
  opts?: {
    previous?: PriceBenchmark[];
    now?: Date;
  },
): PriceBenchmark[] {
  const now = opts?.now ?? new Date();
  const computedAt = now.toISOString();
  const windowed = filterTemporalWindow(requirePriceAndArea(snapshots), now);

  const previousByKey = new Map(
    (opts?.previous ?? []).map((b) => [b.bucketKey, b.medianPricePerM2]),
  );
  const collectionCountByKey = new Map(
    (opts?.previous ?? []).map((b) => [b.bucketKey, b.collectionCount]),
  );

  const out: PriceBenchmark[] = [];
  const seen = new Set<string>();

  const inMetro = windowed.filter((s) => isAllowedBenchmarkCity(s.city));

  for (const cut of COLLECTION_CUTS) {
    const saleOnly = separateByBusinessType(inMetro, cut.businessType);
    const sameCity = saleOnly.filter(
      (s) => normalizePlace(s.city) === normalizePlace(cut.city),
    );
    const sameRegion = saleOnly.filter(
      (s) => cityToRegionId(s.city) === cut.regionId,
    );
    const inNeighborhood = sameCity.filter((s) =>
      matchesNeighborhood(s, cut.neighborhoodName, cut.neighborhoodId),
    );

    const bands = new Set(inNeighborhood.map((s) => bedroomsBand(s.bedrooms)));
    if (bands.size === 0) {
      bands.add("2");
      bands.add("3");
    }

    for (const band of bands) {
      const sampleBeds =
        band === "0" ? 0 : band === "4plus" ? 4 : Number(band);
      const bench = pickBucketWithFallback({
        neighborhoodItems: inNeighborhood,
        // região = município (Salvador ou Lauro de Freitas)
        regionItems: sameRegion.filter(
          (s) => s.propertyType === cut.propertyType,
        ),
        // city level = RMS inteira (fallback amplo)
        cityItems: saleOnly.filter((s) => s.propertyType === cut.propertyType),
        neighborhoodId: cut.neighborhoodId,
        regionId: cut.regionId,
        cityId: BENCHMARK_METRO_ID,
        propertyType: cut.propertyType,
        bedrooms: sampleBeds,
        businessType: cut.businessType,
        previousByKey,
        collectionCountByKey,
        computedAt,
      });
      if (!bench || seen.has(bench.bucketKey)) continue;
      seen.add(bench.bucketKey);
      out.push(bench);
    }
  }

  // Buckets município + RMS por tipo/quarto
  for (const businessType of ["venda"] as const) {
    for (const propertyType of ["apartamento"] as const) {
      for (const band of ["1", "2", "3", "4plus"] as const) {
        const beds = band === "4plus" ? 4 : Number(band);
        for (const regionId of ["salvador", "lauro-de-freitas"] as const) {
          const regionItems = separateByBusinessType(inMetro, businessType).filter(
            (s) =>
              cityToRegionId(s.city) === regionId &&
              s.propertyType === propertyType,
          );
          const bench = pickBucketWithFallback({
            neighborhoodItems: [],
            regionItems,
            cityItems: separateByBusinessType(inMetro, businessType).filter(
              (s) => s.propertyType === propertyType,
            ),
            neighborhoodId: "_",
            regionId,
            cityId: BENCHMARK_METRO_ID,
            propertyType,
            bedrooms: beds,
            businessType,
            previousByKey,
            collectionCountByKey,
            computedAt,
          });
          if (!bench || seen.has(bench.bucketKey)) continue;
          seen.add(bench.bucketKey);
          out.push(bench);
        }
      }
    }
  }

  return out;
}

export function findBenchmarkForListing(
  benches: PriceBenchmark[],
  input: {
    neighborhoodId: string;
    propertyType: PropertyTypeBand;
    bedrooms: number;
    businessType?: "venda" | "aluguel";
    /** Default Salvador (marketplace próprio). */
    city?: string;
  },
): PriceBenchmark | null {
  const businessType = input.businessType ?? "venda";
  const band = bedroomsBand(input.bedrooms);
  const regionId = cityToRegionId(input.city ?? "Salvador");

  const match = (
    level: PriceBenchmark["bucketLevel"],
    placeId: string,
  ): PriceBenchmark | undefined =>
    benches.find(
      (b) =>
        b.bucketLevel === level &&
        b.bucketKey.includes(`:${placeId}:`) &&
        b.propertyType === input.propertyType &&
        b.bedroomsBand === band &&
        b.businessType === businessType,
    );

  return (
    match("neighborhood", input.neighborhoodId) ||
    match("region", regionId) ||
    match("city", BENCHMARK_METRO_ID) ||
    benches.find(
      (b) =>
        b.bucketLevel === "city" &&
        b.propertyType === input.propertyType &&
        b.bedroomsBand === band &&
        b.businessType === businessType,
    ) ||
    null
  );
}
