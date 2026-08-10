import { REGIONS } from "../data/regions.mock";
import type {
  BuyerAmenity,
  BuyerProfile,
  BudgetRegionAnalysis,
  ProfileMatchCheck,
  RegionBudgetRow,
  RegionDetail,
} from "../types/region";

const AMENITY_THRESHOLDS: Record<
  BuyerAmenity,
  (r: RegionDetail) => boolean
> = {
  Elevador: (r) => r.breakdown.infraestrutura >= 72,
  Portaria: (r) =>
    r.breakdown.mercado >= 75 || r.breakdown.infraestrutura >= 78,
  Garagem: (r) => r.oferta !== "Baixa" || r.breakdown.infraestrutura >= 70,
  Varanda: (r) => r.breakdown.desenvolvimento >= 70 || r.precoM2 >= 6500,
  Piscina: (r) =>
    r.breakdown.desenvolvimento >= 80 || r.score >= 82 || r.tags.includes("lazer"),
};

function premiumFactor(profile: BuyerProfile): number {
  let factor = 1;
  for (const a of profile.amenities) {
    if (a === "Elevador") factor -= 0.04;
    if (a === "Portaria") factor -= 0.03;
    if (a === "Garagem") factor -= 0.03;
    if (a === "Varanda") factor -= 0.02;
    if (a === "Piscina") factor -= 0.035;
  }
  if (profile.quartos >= 3) factor -= 0.04;
  else if (profile.quartos === 1) factor += 0.05;
  if (profile.propertyType === "cobertura") factor -= 0.08;
  if (profile.propertyType === "casa" || profile.propertyType === "sobrado")
    factor -= 0.06;
  return Math.max(0.72, factor);
}

function buildReason(r: RegionDetail, area: number, matchScore: number): string {
  if (matchScore >= 90) {
    return `Encaixa muito bem no seu perfil: ~${area}m² estimados, com forte alinhamento ao que você pediu.`;
  }
  if (r.score >= 85 && r.indicators.novosEmpreendimentos >= 10) {
    return `Seu orçamento permite aproximadamente ${area}m². A região apresenta forte crescimento e novos empreendimentos.`;
  }
  if (r.breakdown.infraestrutura >= 80) {
    return `Você consegue aproximadamente ${area}m², com boa infraestrutura e potencial de valorização.`;
  }
  return `Com o perfil selecionado, estimamos ~${area}m² nesta região. ${r.motivo}`;
}

function matchChecks(
  r: RegionDetail,
  profile: BuyerProfile,
  area: number,
  fits: boolean,
): ProfileMatchCheck[] {
  const checks: ProfileMatchCheck[] = [
    {
      id: "budget",
      label: "Cabe no orçamento",
      ok: fits,
      kind: "must",
    },
    {
      id: "tipo",
      label:
        profile.propertyType === "apartamento"
          ? "Apartamento"
          : profile.propertyType,
      ok: true,
      kind: "must",
    },
    {
      id: "quartos",
      label:
        profile.quartos >= 4
          ? "4+ quartos"
          : `${profile.quartos} quarto${profile.quartos > 1 ? "s" : ""}`,
      ok: area >= profile.areaMin * 0.85,
      kind: "must",
    },
    {
      id: "area",
      label: `Área mínima ${profile.areaMin}m²`,
      ok: area >= profile.areaMin,
      kind: "must",
    },
  ];

  for (const a of profile.amenities) {
    checks.push({
      id: a.toLowerCase(),
      label: a,
      ok: AMENITY_THRESHOLDS[a](r),
      kind: "amenity",
    });
  }

  checks.push({
    id: "valorizacao",
    label: "Alto potencial de valorização",
    ok: r.score >= 80 || r.valorizacao12m >= 11,
    kind: "opportunity",
  });

  return checks;
}

/**
 * Match Score 0–100: quão boa a região é PARA o perfil do usuário.
 * Opportunity Score permanece nos dados da região (r.score).
 */
function computeMatchScore(
  r: RegionDetail,
  profile: BuyerProfile,
  area: number,
  fits: boolean,
  checks: ProfileMatchCheck[],
): number {
  const pref = profile.preference / 100; // 0 preço, 1 valorização

  const budgetPart = fits ? 1 : Math.max(0, area / profile.areaMin) * 0.55;
  const areaPart = Math.min(1, area / Math.max(profile.areaMin, 1));
  const quartosPart = area >= profile.areaMin * 0.85 ? 1 : 0.45;

  const amenityChecks = checks.filter((c) => c.kind === "amenity");
  const amenityPart =
    amenityChecks.length === 0
      ? 1
      : amenityChecks.filter((c) => c.ok).length / amenityChecks.length;

  const locationPart = r.breakdown.infraestrutura / 100;

  // Preferência: preço favorece área relativa; valorização favorece score da região
  const maxAreaRef = 120;
  const pricePrefPart = Math.min(1, area / maxAreaRef);
  const valorizacaoPrefPart = Math.min(1, r.score / 100);
  const preferencePart = (1 - pref) * pricePrefPart + pref * valorizacaoPrefPart;

  const raw =
    budgetPart * 0.22 +
    0.08 + // tipo de imóvel (sempre aplicável no mock)
    quartosPart * 0.12 +
    areaPart * 0.15 +
    amenityPart * 0.15 +
    locationPart * 0.1 +
    preferencePart * 0.18;

  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

function profileSummary(profile: BuyerProfile): string {
  const bits = [
    profile.quartos >= 4 ? "4+ quartos" : `${profile.quartos} quartos`,
  ];
  if (profile.amenities.length) {
    bits.push(profile.amenities.slice(0, 2).join(" + ").toLowerCase());
  }
  return bits.join(" + ");
}

/**
 * Analisa regiões para um perfil de comprador.
 * Futuro: GET /api/oportunidades
 */
export function analyzeBudgetRegions(
  profile: BuyerProfile,
): BudgetRegionAnalysis {
  const premium = premiumFactor(profile);

  const rows: RegionBudgetRow[] = REGIONS.map((r) => {
    const effective = profile.budget * premium;
    const areaEstimadaM2 = Math.max(28, Math.round(effective / r.precoM2));
    const fitsBudget = areaEstimadaM2 >= profile.areaMin;
    const checks = matchChecks(r, profile, areaEstimadaM2, fitsBudget);
    const matchScore = computeMatchScore(
      r,
      profile,
      areaEstimadaM2,
      fitsBudget,
      checks,
    );
    const estimatedOptions = Math.max(
      1,
      Math.round(
        (effective / r.precoM2) *
          0.07 *
          (r.oferta === "Alta" ? 1.5 : r.oferta === "Média" ? 1 : 0.55),
      ),
    );

    return {
      regionId: r.id,
      regionName: r.name,
      precoM2: r.precoM2,
      areaEstimadaM2,
      opportunityScore: r.score,
      matchScore,
      valorizacao12m: r.valorizacao12m,
      estimatedOptions,
      compatibility: matchScore,
      score: r.score,
      reason: buildReason(r, areaEstimadaM2, matchScore),
      matchChecks: checks,
      fitsBudget,
    };
  });

  const matches = rows
    .filter((r) => r.fitsBudget && r.matchScore >= 55)
    .sort((a, b) => {
      const pref = profile.preference / 100;
      const blendA =
        a.matchScore * (0.55 + pref * 0.1) +
        a.opportunityScore * (0.45 - pref * 0.1);
      const blendB =
        b.matchScore * (0.55 + pref * 0.1) +
        b.opportunityScore * (0.45 - pref * 0.1);
      return blendB - blendA;
    });

  const pool = matches.length ? matches : [...rows].sort(
    (a, b) => b.matchScore - a.matchScore,
  );

  const byBuyingPower = [...pool].sort(
    (a, b) => b.areaEstimadaM2 - a.areaEstimadaM2,
  );
  const byOpportunity = [...pool].sort(
    (a, b) => b.opportunityScore - a.opportunityScore,
  );
  const byMatch = [...pool].sort((a, b) => b.matchScore - a.matchScore);

  const areas = pool.map((r) => r.areaEstimadaM2);
  const maxAreaM2 = Math.max(...areas, 1);
  const minAreaAmongCandidates = Math.min(...areas);
  const areaGainPct =
    minAreaAmongCandidates > 0
      ? Math.round(
          ((maxAreaM2 - minAreaAmongCandidates) / minAreaAmongCandidates) * 100,
        )
      : 0;

  return {
    profile,
    rows: [...rows].sort((a, b) => b.opportunityScore - a.opportunityScore),
    matches: pool,
    byBuyingPower,
    byOpportunity,
    byMatch,
    maxAreaM2,
    minAreaAmongCandidates,
    areaGainPct,
    topMatch: byMatch[0] ?? null,
    profileSummary: profileSummary(profile),
  };
}

export const BUYER_AMENITIES: BuyerAmenity[] = [
  "Elevador",
  "Portaria",
  "Garagem",
  "Varanda",
  "Piscina",
];
