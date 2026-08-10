import type {
  OpportunityBand,
  RegionDetail,
  RegionSummary,
  ScoreFactor,
} from "../types/region";

export const SCORE_FACTORS: ScoreFactor[] = [
  {
    id: "preco",
    title: "Preço",
    description: "Avalia o preço atual do m² em relação à região e à cidade.",
  },
  {
    id: "valorizacao",
    title: "Valorização",
    description: "Analisa o histórico de valorização dos imóveis.",
  },
  {
    id: "desenvolvimento",
    title: "Desenvolvimento",
    description: "Novos empreendimentos, lançamentos e investimentos.",
  },
  {
    id: "infraestrutura",
    title: "Infraestrutura",
    description: "Comércio, serviços, transporte e infraestrutura urbana.",
  },
  {
    id: "demografia",
    title: "Demografia",
    description: "Crescimento populacional e expansão da região.",
  },
  {
    id: "mercado",
    title: "Mercado",
    description: "Oferta e dinâmica do mercado imobiliário.",
  },
];

export function opportunityBand(score: number): OpportunityBand {
  if (score >= 80) return "muito_alta";
  if (score >= 60) return "alta";
  if (score >= 40) return "moderada";
  if (score >= 20) return "baixa";
  return "muito_baixa";
}

export function bandLabel(band: OpportunityBand): string {
  switch (band) {
    case "muito_alta":
      return "Oportunidade muito alta";
    case "alta":
      return "Oportunidade alta";
    case "moderada":
      return "Oportunidade moderada";
    case "baixa":
      return "Oportunidade baixa";
    case "muito_baixa":
      return "Oportunidade muito baixa";
  }
}

/** Cor do mapa / badges por faixa de score — paleta próxima a portais imobiliários. */
export function scoreColor(score: number): [number, number, number, number] {
  if (score >= 80) return [0, 106, 255, 220];
  if (score >= 60) return [77, 154, 255, 200];
  if (score >= 40) return [245, 166, 35, 200];
  if (score >= 20) return [249, 115, 22, 190];
  return [239, 68, 68, 180];
}

export function scoreCss(score: number): string {
  if (score >= 80) return "#006aff";
  if (score >= 60) return "#4d9aff";
  if (score >= 40) return "#f5a623";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

export function formatPct(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function toSummary(r: RegionDetail): RegionSummary {
  return {
    id: r.id,
    name: r.name,
    lat: r.lat,
    lng: r.lng,
    score: r.score,
    band: r.band,
    precoM2: r.precoM2,
    valorizacao12m: r.valorizacao12m,
    oferta: r.oferta,
    potencial: r.potencial,
    motivo: r.motivo,
    novosEmpreendimentos: r.novosEmpreendimentos,
  };
}
