/** Tipos alinhados ao motor FastAPI em `engine/` (v1 negócio + v2 marketplace). */

export type OpportunityBand =
  | "muito_alta"
  | "alta"
  | "moderada"
  | "baixa"
  | "muito_baixa";

export type OfferLevel = "Alta" | "Média" | "Baixa";

export type ScoreBreakdown = {
  preco: number;
  valorizacao: number;
  desenvolvimento: number;
  infraestrutura: number;
  demografia: number;
  mercado: number;
};

export type RegionIndicators = {
  precoM2: number;
  precoVsMediaSalvador: number;
  valorizacao12m: number;
  novosEmpreendimentos: number;
  oferta: OfferLevel;
  crescimentoEmpresarial: number;
  crescimentoPopulacional: number;
  distanciaPraiaKm: number;
  lancamentos: number;
};

export type PriceHistoryPoint = {
  year: number;
  precoM2: number;
};

export type DevelopmentHistoryPoint = {
  year: number;
  empresas: number;
  populacao: number;
  empreendimentos: number;
  oferta: number;
};

export type RegionSummary = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  score: number;
  band: OpportunityBand;
  precoM2: number;
  valorizacao12m: number;
  oferta: OfferLevel;
  potencial: string;
  motivo: string;
  novosEmpreendimentos: number;
};

export type RegionDetail = RegionSummary & {
  summary: string;
  breakdown: ScoreBreakdown;
  indicators: RegionIndicators;
  priceHistory: PriceHistoryPoint[];
  developmentHistory: DevelopmentHistoryPoint[];
  tags: string[];
};

export type BudgetOpportunity = {
  regionId: string;
  regionName: string;
  score: number;
  areaEstimadaM2: number;
  propertyLabel: string;
  estimatedOptions: number;
};

export type BuyerAmenity =
  | "Elevador"
  | "Portaria"
  | "Garagem"
  | "Varanda"
  | "Piscina";

/**
 * Preferência 0 = prioriza preço/área · 100 = prioriza valorização.
 */
export type BuyerProfile = {
  budget: number;
  propertyType: string;
  quartos: number;
  areaMin: number;
  amenities: BuyerAmenity[];
  /** 0 preço ←→ 100 valorização */
  preference: number;
};

export type ProfileMatchCheck = {
  id: string;
  label: string;
  ok: boolean;
  kind: "must" | "amenity" | "opportunity";
};

export type RegionBudgetRow = {
  regionId: string;
  regionName: string;
  precoM2: number;
  areaEstimadaM2: number;
  /** 📈 Vale a pena comprar nessa região? (dados da região) */
  opportunityScore: number;
  /** 🎯 Essa região é boa PARA VOCÊ? (perfil do usuário) */
  matchScore: number;
  valorizacao12m: number;
  estimatedOptions: number;
  /** @deprecated use matchScore */
  compatibility: number;
  /** @deprecated use opportunityScore */
  score: number;
  reason: string;
  matchChecks: ProfileMatchCheck[];
  fitsBudget: boolean;
};

export type BudgetRegionAnalysis = {
  profile: BuyerProfile;
  rows: RegionBudgetRow[];
  matches: RegionBudgetRow[];
  byBuyingPower: RegionBudgetRow[];
  byOpportunity: RegionBudgetRow[];
  byMatch: RegionBudgetRow[];
  maxAreaM2: number;
  minAreaAmongCandidates: number;
  areaGainPct: number;
  topMatch: RegionBudgetRow | null;
  profileSummary: string;
};

export type ScoreFactor = {
  id: keyof ScoreBreakdown;
  title: string;
  description: string;
};
