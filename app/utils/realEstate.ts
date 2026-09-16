import {
  NEIGHBORHOODS,
  type Neighborhood,
  type NeighborhoodMetrics,
} from "../data/neighborhoods";

export type AppMode = "imovel" | "negocio";
export type ImovelTool = "explorar" | "comparar" | "orcamento" | "rotas";

export type PropertyType =
  // Residencial
  | "apartamento"
  | "casa"
  | "casa_condominio"
  | "chacara"
  | "cobertura"
  | "flat"
  | "kitnet"
  | "lote_terreno"
  | "sobrado"
  | "edificio_residencial"
  | "fazenda_sitio"
  // Comercial
  | "consultorio"
  | "galpao"
  | "imovel_comercial"
  | "lote_terreno_comercial"
  | "ponto_comercial"
  | "sala_conjunto"
  | "predio_inteiro";

export type PropertyTypeOption = {
  value: PropertyType;
  label: string;
  category: "residencial" | "comercial";
};

export const RESIDENTIAL_PROPERTY_TYPES: PropertyTypeOption[] = [
  { value: "apartamento", label: "Apartamento", category: "residencial" },
  { value: "casa", label: "Casa", category: "residencial" },
  {
    value: "casa_condominio",
    label: "Condominio de Casas",
    category: "residencial",
  },
  { value: "chacara", label: "Chácara", category: "residencial" },
  { value: "kitnet", label: "Kitnet", category: "residencial" },
  {
    value: "lote_terreno",
    label: "Terreno e Lote",
    category: "residencial",
  },
  {
    value: "edificio_residencial",
    label: "Empreendimento",
    category: "residencial",
  },
  {
    value: "fazenda_sitio",
    label: "Fazendas/Sítios",
    category: "residencial",
  },
];

export const COMMERCIAL_PROPERTY_TYPES: PropertyTypeOption[] = [
  { value: "consultorio", label: "Consultório", category: "comercial" },
  {
    value: "galpao",
    label: "Galpão/Depósito/Armazém",
    category: "comercial",
  },
  {
    value: "imovel_comercial",
    label: "Imóvel Comercial",
    category: "comercial",
  },
  {
    value: "lote_terreno_comercial",
    label: "Lote/Terreno",
    category: "comercial",
  },
  {
    value: "ponto_comercial",
    label: "Ponto Comercial/Loja/Box",
    category: "comercial",
  },
  { value: "sala_conjunto", label: "Sala/Conjunto", category: "comercial" },
  {
    value: "predio_inteiro",
    label: "Prédio/Edifício Inteiro",
    category: "comercial",
  },
];

/** @deprecated use RESIDENTIAL_PROPERTY_TYPES / COMMERCIAL_PROPERTY_TYPES */
export const PROPERTY_TYPES = RESIDENTIAL_PROPERTY_TYPES;

export function propertyTypesForMode(mode: AppMode): PropertyTypeOption[] {
  return mode === "imovel"
    ? RESIDENTIAL_PROPERTY_TYPES
    : COMMERCIAL_PROPERTY_TYPES;
}

export function defaultPropertyType(mode: AppMode): PropertyType {
  return mode === "imovel" ? "apartamento" : "ponto_comercial";
}

export function livabilityScore(n: Neighborhood): number {
  const m = n.metrics;
  const crimePenalty = 10 - m.rouboFurto;
  return (
    m.consumo * 0.18 +
    m.transporte * 0.2 +
    m.educacao * 0.22 +
    m.seguranca * 0.25 +
    crimePenalty * 0.15
  );
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Fator de área/preço relativo ao m² do bairro. */
function areaFactor(type: PropertyType): number {
  switch (type) {
    case "kitnet":
    case "flat":
      return 32;
    case "apartamento":
      return 60;
    case "cobertura":
      return 110;
    case "casa":
    case "casa_condominio":
      return 120;
    case "sobrado":
      return 140;
    case "chacara":
      return 220;
    case "fazenda_sitio":
      return 800;
    case "lote_terreno":
    case "lote_terreno_comercial":
      return 180;
    case "edificio_residencial":
      return 900;
    case "consultorio":
    case "sala_conjunto":
      return 45;
    case "ponto_comercial":
      return 70;
    case "imovel_comercial":
      return 95;
    case "galpao":
      return 350;
    case "predio_inteiro":
      return 1200;
    default:
      return 60;
  }
}

/** Preço de referência por tipo de imóvel no bairro. */
export function referencePrice(
  neighborhood: Neighborhood,
  type: PropertyType,
): number {
  return Math.round(neighborhood.precoM2 * areaFactor(type));
}

export function priceIndexForBudget(
  neighborhood: Neighborhood,
  budget: number,
  type: PropertyType = "apartamento",
): number {
  const price = referencePrice(neighborhood, type);
  if (budget <= 0) return 0;
  return Math.min(100, Math.round((price / budget) * 100));
}

export function fitsBudget(
  neighborhood: Neighborhood,
  budget: number,
  type: PropertyType,
): boolean {
  return referencePrice(neighborhood, type) <= budget;
}

export function neighborhoodsInBudget(
  budget: number,
  type: PropertyType,
): Neighborhood[] {
  return NEIGHBORHOODS.filter((n) => fitsBudget(n, budget, type)).sort(
    (a, b) => livabilityScore(b) - livabilityScore(a),
  );
}

export function findNearestNeighborhood(
  lat: number,
  lng: number,
): Neighborhood {
  let best = NEIGHBORHOODS[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const n of NEIGHBORHOODS) {
    const d = (n.lat - lat) ** 2 + (n.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best;
}

export function metricTone(
  key: keyof NeighborhoodMetrics,
  value: number,
): "good" | "mid" | "bad" {
  if (key === "rouboFurto") {
    if (value <= 3.5) return "good";
    if (value <= 5.5) return "mid";
    return "bad";
  }
  if (value >= 7.5) return "good";
  if (value >= 5.5) return "mid";
  return "bad";
}

export function toneClass(tone: "good" | "mid" | "bad"): string {
  if (tone === "good") return "text-emerald-700 bg-emerald-50";
  if (tone === "mid") return "text-amber-700 bg-amber-50";
  return "text-rose-700 bg-rose-50";
}
