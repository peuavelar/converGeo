import { REGIONS } from "./regions.mock";
import { neighborhoodPhoto } from "./neighborhoodPhotos";

import type { FairPriceSeal } from "../services/marketplaceApi";

export type MarketplaceListing = {
  id: string;
  regionId: string;
  title: string;
  lat: number;
  lng: number;
  /** Preço de venda exibido no mapa (estilo Airbnb). */
  price: number;
  beds: number;
  baths: number;
  area: number;
  precoM2: number;
  score: number;
  valorizacao12m: number;
  photo: string;
  precoJusto?: FairPriceSeal | null;
};

function formatMapPrice(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Offset em graus (~metros) para espalhar anúncios no mapa. */
function offset(
  lat: number,
  lng: number,
  dLat: number,
  dLng: number,
): { lat: number; lng: number } {
  return { lat: lat + dLat, lng: lng + dLng };
}

/**
 * Casas/apartamentos à venda no marketplace (mock).
 * Mesma fonte para o mapa (pills) e a grade do marketplace.
 */
export const MARKETPLACE_LISTINGS: MarketplaceListing[] = [
  // Pituba
  {
    id: "mkt-pituba-1",
    regionId: "pituba",
    title: "Apto 2q · Pituba",
    ...offset(-13.0058, -38.4601, 0.004, -0.003),
    price: 589000,
    beds: 2,
    baths: 2,
    area: 68,
    precoM2: 9200,
    score: 78,
    valorizacao12m: 8.4,
    photo: neighborhoodPhoto("pituba"),
  },
  {
    id: "mkt-pituba-2",
    regionId: "pituba",
    title: "Cobertura · Pituba",
    ...offset(-13.0058, -38.4601, -0.005, 0.006),
    price: 1100000,
    beds: 3,
    baths: 3,
    area: 120,
    precoM2: 9200,
    score: 82,
    valorizacao12m: 8.4,
    photo: neighborhoodPhoto("pituba"),
  },
  // Barra
  {
    id: "mkt-barra-1",
    regionId: "barra",
    title: "Vista mar · Barra",
    ...offset(-13.0105, -38.5329, 0.003, 0.004),
    price: 1774000,
    beds: 3,
    baths: 3,
    area: 145,
    precoM2: 11500,
    score: 74,
    valorizacao12m: 6.2,
    photo: neighborhoodPhoto("barra"),
  },
  {
    id: "mkt-barra-2",
    regionId: "barra",
    title: "Studio · Barra",
    ...offset(-13.0105, -38.5329, -0.006, -0.002),
    price: 760000,
    beds: 1,
    baths: 1,
    area: 42,
    precoM2: 11500,
    score: 71,
    valorizacao12m: 6.2,
    photo: neighborhoodPhoto("barra"),
  },
  // Imbuí
  {
    id: "mkt-imibui-1",
    regionId: "imibui",
    title: "Apto novo · Imbuí",
    ...offset(-12.9378, -38.4265, 0.005, 0.003),
    price: 876000,
    beds: 3,
    baths: 2,
    area: 92,
    precoM2: 7200,
    score: 86,
    valorizacao12m: 11.5,
    photo: neighborhoodPhoto("imibui"),
  },
  {
    id: "mkt-imibui-2",
    regionId: "imibui",
    title: "Casa · Imbuí",
    ...offset(-12.9378, -38.4265, -0.004, -0.005),
    price: 590000,
    beds: 2,
    baths: 2,
    area: 78,
    precoM2: 7200,
    score: 84,
    valorizacao12m: 11.5,
    photo: neighborhoodPhoto("imibui"),
  },
  // Paralela
  {
    id: "mkt-paralela-1",
    regionId: "paralela",
    title: "Lançamento · Paralela",
    ...offset(-12.9225, -38.4128, 0.006, -0.004),
    price: 1364000,
    beds: 3,
    baths: 3,
    area: 110,
    precoM2: 6800,
    score: 91,
    valorizacao12m: 15.2,
    photo: neighborhoodPhoto("paralela"),
  },
  {
    id: "mkt-paralela-2",
    regionId: "paralela",
    title: "Apto 2q · Paralela",
    ...offset(-12.9225, -38.4128, -0.003, 0.007),
    price: 712000,
    beds: 2,
    baths: 2,
    area: 70,
    precoM2: 6800,
    score: 91,
    valorizacao12m: 15.2,
    photo: neighborhoodPhoto("paralela"),
  },
  // Itapuã
  {
    id: "mkt-itapua-1",
    regionId: "itapua",
    title: "Perto da praia · Itapuã",
    ...offset(-12.9456, -38.3621, 0.004, 0.005),
    price: 964000,
    beds: 3,
    baths: 2,
    area: 98,
    precoM2: 6500,
    score: 72,
    valorizacao12m: 9.1,
    photo: neighborhoodPhoto("itapua"),
  },
  {
    id: "mkt-itapua-2",
    regionId: "itapua",
    title: "Casa térrea · Itapuã",
    ...offset(-12.9456, -38.3621, -0.005, -0.003),
    price: 912000,
    beds: 3,
    baths: 2,
    area: 105,
    precoM2: 6500,
    score: 70,
    valorizacao12m: 9.1,
    photo: neighborhoodPhoto("itapua"),
  },
  // Horto
  {
    id: "mkt-horto-1",
    regionId: "horto",
    title: "Apto verde · Horto",
    ...offset(-12.9985, -38.4842, 0.003, -0.004),
    price: 757000,
    beds: 2,
    baths: 2,
    area: 75,
    precoM2: 7800,
    score: 76,
    valorizacao12m: 7.8,
    photo: neighborhoodPhoto("horto"),
  },
  // Itaigara
  {
    id: "mkt-itaigara-1",
    regionId: "itaigara",
    title: "Apto · Itaigara",
    ...offset(-12.9942, -38.4648, -0.004, 0.003),
    price: 845000,
    beds: 2,
    baths: 2,
    area: 80,
    precoM2: 9700,
    score: 80,
    valorizacao12m: 7.2,
    photo: neighborhoodPhoto("itaigara"),
  },
  // Rio Vermelho
  {
    id: "mkt-rv-1",
    regionId: "rio-vermelho",
    title: "Apto · Rio Vermelho",
    ...offset(-13.0118, -38.4915, 0.002, 0.005),
    price: 698000,
    beds: 2,
    baths: 1,
    area: 62,
    precoM2: 8800,
    score: 73,
    valorizacao12m: 6.8,
    photo: neighborhoodPhoto("rio-vermelho"),
  },
  // Caminho das Árvores
  {
    id: "mkt-cda-1",
    regionId: "caminho-das-arvores",
    title: "Alto padrão · Caminho das Árvores",
    ...offset(-12.9814, -38.4589, 0.005, -0.002),
    price: 1290000,
    beds: 3,
    baths: 3,
    area: 130,
    precoM2: 10500,
    score: 81,
    valorizacao12m: 8.9,
    photo: neighborhoodPhoto("caminho-das-arvores"),
  },
  // Stella Maris
  {
    id: "mkt-stella-1",
    regionId: "stella-maris",
    title: "Casa · Stella Maris",
    ...offset(-12.9381, -38.3304, 0.003, 0.004),
    price: 820000,
    beds: 3,
    baths: 2,
    area: 110,
    precoM2: 6100,
    score: 75,
    valorizacao12m: 10.2,
    photo: neighborhoodPhoto("stella-maris"),
  },
  // Patamares
  {
    id: "mkt-pat-1",
    regionId: "patamares",
    title: "Apto · Patamares",
    ...offset(-12.9386, -38.3982, -0.003, 0.005),
    price: 548000,
    beds: 2,
    baths: 2,
    area: 70,
    precoM2: 6900,
    score: 79,
    valorizacao12m: 9.6,
    photo: neighborhoodPhoto("patamares"),
  },
];

/** Texto no pin estilo Airbnb, em milhares/milhões (ex.: R$ 400k, R$ 1.1M). */
export function marketplacePriceLabel(price: number): string {
  if (price >= 1_000_000) {
    const mi = price / 1_000_000;
    const text =
      mi % 1 === 0 ? String(mi) : mi.toFixed(1).replace(".", ",");
    return `R$ ${text}M`;
  }
  const k = Math.round(price / 1000);
  return `R$ ${k}k`;
}

export function marketplacePriceFull(price: number): string {
  return formatMapPrice(price);
}

/** Lista filtrada por potencial (para a grade do marketplace). */
export function filterMarketplaceListings(
  filter: "todos" | "alto" | "medio",
): MarketplaceListing[] {
  if (filter === "alto")
    return MARKETPLACE_LISTINGS.filter((l) => l.score >= 80);
  if (filter === "medio")
    return MARKETPLACE_LISTINGS.filter((l) => l.score >= 65 && l.score < 80);
  return MARKETPLACE_LISTINGS;
}

/** Garante que regiões do mock existam — evita ids órfãos. */
export function marketplaceRegionIds(): string[] {
  const known = new Set(REGIONS.map((r) => r.id));
  return [
    ...new Set(
      MARKETPLACE_LISTINGS.map((l) => l.regionId).filter((id) => known.has(id)),
    ),
  ];
}
