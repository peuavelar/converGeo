import { REGIONS, SALVADOR_AVG_PRECO_M2 } from "../data/regions.mock";
import { analyzeBudgetRegions } from "../utils/budgetAnalysis";
import type {
  BudgetOpportunity,
  BuyerAmenity,
  BuyerProfile,
  RegionDetail,
  RegionSummary,
} from "../types/region";
import { toSummary } from "../utils/opportunity";

/**
 * Cliente de dados de regiões.
 * Hoje: mock local. Depois: trocar o corpo por fetch(`/api/...`).
 *
 * Contratos previstos:
 * GET /api/regioes
 * GET /api/regioes/{id}
 * GET /api/regioes/ranking
 * GET /api/regioes/{id}/indicadores
 * GET /api/imoveis
 * GET /api/oportunidades
 */
export async function getRegions(): Promise<RegionSummary[]> {
  return REGIONS.map(toSummary).sort((a, b) => b.score - a.score);
}

export async function getRegionById(id: string): Promise<RegionDetail | null> {
  return REGIONS.find((r) => r.id === id) ?? null;
}

export async function getRanking(limit = 6): Promise<RegionSummary[]> {
  const all = await getRegions();
  return all.slice(0, limit);
}

export async function getRegionIndicators(id: string) {
  const region = await getRegionById(id);
  return region?.indicators ?? null;
}

export async function searchRegions(query: string): Promise<RegionSummary[]> {
  const q = query.trim().toLowerCase();
  if (!q) return getRegions();
  const all = await getRegions();
  return all.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.id.includes(q.replace(/\s+/g, "-")),
  );
}

export async function compareRegions(
  ids: string[],
): Promise<RegionDetail[]> {
  return ids
    .map((id) => REGIONS.find((r) => r.id === id))
    .filter((r): r is RegionDetail => Boolean(r));
}

/** Simula quanto m² o orçamento compra e estima opções. */
export async function getBudgetOpportunities(
  budget: number,
  bedrooms = 2,
  amenities: string[] = [],
): Promise<{
  optionsInRegion: (regionId: string) => number;
  alternatives: BudgetOpportunity[];
}> {
  const amenityList = (
    ["Elevador", "Portaria", "Garagem", "Varanda", "Piscina"] as BuyerAmenity[]
  ).filter((a) => amenities.includes(a));

  const profile: BuyerProfile = {
    budget,
    propertyType: "apartamento",
    quartos: bedrooms,
    areaMin: bedrooms <= 1 ? 35 : bedrooms === 2 ? 55 : 70,
    amenities: amenityList,
    preference: 50,
  };
  const analysis = analyzeBudgetRegions(profile);
  const alternatives: BudgetOpportunity[] = analysis.byBuyingPower
    .slice(0, 5)
    .map((r) => ({
      regionId: r.regionId,
      regionName: r.regionName,
      score: r.opportunityScore,
      areaEstimadaM2: r.areaEstimadaM2,
      propertyLabel: `Apartamento de ~${r.areaEstimadaM2}m²`,
      estimatedOptions: r.estimatedOptions,
    }));

  return {
    optionsInRegion: (regionId: string) =>
      analysis.rows.find((a) => a.regionId === regionId)?.estimatedOptions ?? 0,
    alternatives,
  };
}

export function findNearestRegion(
  lat: number,
  lng: number,
): RegionSummary {
  const regions = getRegionsSync();
  let best = regions[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const r of regions) {
    const d = (r.lat - lat) ** 2 + (r.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best;
}

export function getSalvadorAvgPrecoM2() {
  return SALVADOR_AVG_PRECO_M2;
}

/** Sync helpers para camadas de mapa (sem async). */
export function getRegionsSync(): RegionSummary[] {
  return REGIONS.map(toSummary).sort((a, b) => b.score - a.score);
}

export function getRegionByIdSync(id: string): RegionDetail | null {
  return REGIONS.find((r) => r.id === id) ?? null;
}
