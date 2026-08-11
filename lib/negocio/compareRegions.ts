/**
 * Resolve texto → região completa (bairro/município) para comparação A/B.
 */

import {
  NEIGHBORHOODS,
  neighborhoodCity,
  type Neighborhood,
} from "@/app/data/neighborhoods";
import { buildAddressSuggestions } from "@/app/data/streets";
import { findNearestNeighborhood, livabilityScore } from "@/app/utils/realEstate";
import { getRegionByIdSync } from "@/app/services/regionsApi";

export type CompareRegionPoint = {
  lat: number;
  lng: number;
  label: string;
  neighborhoodId: string;
  neighborhoodName: string;
  city: string;
  /** Score local da região (0–10 livability). */
  regionScore: number;
  precoM2: number;
  tags: string[];
  metrics: {
    consumo: number;
    transporte: number;
    educacao: number;
    seguranca: number;
    rouboFurto: number;
  };
};

function fromNeighborhood(n: Neighborhood, label?: string): CompareRegionPoint {
  const city = neighborhoodCity(n);
  return {
    lat: n.lat,
    lng: n.lng,
    label: label || `${n.name} · ${city}`,
    neighborhoodId: n.id,
    neighborhoodName: n.name,
    city,
    regionScore: Math.round(livabilityScore(n) * 10) / 10,
    precoM2: n.precoM2,
    tags: n.tags,
    metrics: { ...n.metrics },
  };
}

/** Prioriza bairro/região completa — não um ponto solto de rua. */
export async function resolveCompareRegion(
  text: string,
): Promise<CompareRegionPoint | null> {
  const q = text.trim();
  if (q.length < 2) return null;

  const suggestions = buildAddressSuggestions(q, 5);
  if (suggestions[0]) {
    const n = NEIGHBORHOODS.find(
      (x) => x.id === suggestions[0].neighborhoodId,
    );
    if (n) {
      return fromNeighborhood(
        n,
        `${n.name} · ${neighborhoodCity(n)}`,
      );
    }
  }

  const exact = NEIGHBORHOODS.find(
    (n) =>
      n.name.toLowerCase() === q.toLowerCase() ||
      n.name.toLowerCase().includes(q.toLowerCase()) ||
      neighborhoodCity(n).toLowerCase().includes(q.toLowerCase()),
  );
  if (exact) return fromNeighborhood(exact);

  try {
    const res = await fetch(
      `/api/geo/geocode?q=${encodeURIComponent(`${q}, Bahia, Brasil`)}&limit=1`,
    );
    const data = await res.json();
    const hit = Array.isArray(data) ? data[0] : data?.hits?.[0];
    if (hit?.lat != null && hit?.lng != null) {
      const nearest = findNearestNeighborhood(Number(hit.lat), Number(hit.lng));
      return fromNeighborhood(
        nearest,
        `${nearest.name} · ${neighborhoodCity(nearest)}`,
      );
    }
  } catch {
    /* ignore */
  }

  return null;
}

export function regionExtras(neighborhoodId: string) {
  const n = NEIGHBORHOODS.find((x) => x.id === neighborhoodId);
  const region = getRegionByIdSync(neighborhoodId);
  return { neighborhood: n ?? null, region };
}
