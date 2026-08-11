/**
 * Simula snapshots realistas a partir dos recortes + R$/m² público do mock.
 * Usado quando GECKOAPI_KEY não está configurada — nunca expõe anúncios na UI.
 */

import { createHash } from "node:crypto";
import { COLLECTION_CUTS, type CollectionCut } from "./cuts";
import { snapshotRawHash } from "./store";
import type { ExternalListingSnapshot } from "./types";

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeId(source: string, sourceId: string) {
  return `${source}:${sourceId}`;
}

function simulateCut(
  cut: CollectionCut,
  capturedAt: string,
  seed: number,
  count = 14,
): ExternalListingSnapshot[] {
  const rand = mulberry32(seed);
  const out: ExternalListingSnapshot[] = [];

  for (let i = 0; i < count; i++) {
    const beds = i % 5 === 0 ? 1 : i % 3 === 0 ? 3 : 2;
    const area = Math.round((45 + beds * 22 + rand() * 25) / 5) * 5;
    // Ruído log-normal leve em torno da referência pública
    const noise = 0.85 + rand() * 0.35;
    let pricePerM2 = cut.referencePricePerM2 * noise;
    // Alguns outliers propositalmente (serão removidos pelo IQR)
    if (i === 0) pricePerM2 = 50;
    if (i === 1) pricePerM2 = cut.referencePricePerM2 * 8;
    const price = Math.round((pricePerM2 * area) / 1000) * 1000;
    if (price < cut.priceMin * 0.5 || price > cut.priceMax * 1.5) {
      // ainda gera, mas fora da faixa “anúncio típico”
    }

    const listedDaysAgo = Math.floor(10 + rand() * 200);
    const listedAt = new Date(
      Date.parse(capturedAt) - listedDaysAgo * 86_400_000,
    ).toISOString();

    const sourceId = `${cut.neighborhoodId}-${seed}-${i}`;
    const source: ExternalListingSnapshot["source"] =
      i % 3 === 0 ? "olx" : i % 3 === 1 ? "vivareal" : "zap";

    // Duplicata cross-portal ocasional (mesma área/preço band)
    const dup = i > 0 && i % 7 === 0;
    const base = dup ? out[i - 1] : null;

    const rowBase: Omit<ExternalListingSnapshot, "rawHash" | "id"> & {
      sourceId: string;
    } = {
      source: dup ? "zap" : source,
      sourceUrl: `https://example.invalid/${cut.neighborhoodId}/${sourceId}`,
      capturedAt,
      price: base?.price ?? price,
      usableArea: base?.usableArea ?? area,
      bedrooms: base?.bedrooms ?? beds,
      bathrooms: beds >= 2 ? beds - 1 : 1,
      propertyType: cut.propertyType,
      city: cut.city,
      neighborhood: cut.neighborhoodName,
      listedAt,
      businessType: cut.businessType,
      sourceId: dup ? `${sourceId}-dup` : sourceId,
    };

    out.push({
      id: makeId(rowBase.source, rowBase.sourceId),
      source: rowBase.source,
      sourceUrl: rowBase.sourceUrl,
      capturedAt: rowBase.capturedAt,
      price: rowBase.price,
      usableArea: rowBase.usableArea,
      bedrooms: rowBase.bedrooms,
      bathrooms: rowBase.bathrooms,
      propertyType: rowBase.propertyType,
      city: rowBase.city,
      neighborhood: rowBase.neighborhood,
      listedAt: rowBase.listedAt,
      businessType: rowBase.businessType,
      rawHash: snapshotRawHash(rowBase),
      requestId: createHash("sha1").update(sourceId).digest("hex").slice(0, 12),
      executionId: `sim-${seed}`,
    });
  }

  return out;
}

export function simulateCollectionSnapshots(opts?: {
  capturedAt?: string;
  seed?: number;
}): ExternalListingSnapshot[] {
  const capturedAt = opts?.capturedAt ?? new Date().toISOString();
  const seed = opts?.seed ?? 42;
  return COLLECTION_CUTS.flatMap((cut, idx) =>
    simulateCut(cut, capturedAt, seed + idx * 97, 14),
  );
}
