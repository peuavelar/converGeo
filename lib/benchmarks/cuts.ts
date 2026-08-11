/**
 * Recortes fixos de coleta — Salvador (BA) + Região Metropolitana (Lauro de Freitas).
 * Job semanal varre só esta lista. Versionado no repo.
 */

import type { BusinessType, PropertyTypeBand } from "./types";
import { cityToRegionId } from "./metro";

export type CollectionCut = {
  id: string;
  neighborhoodId: string;
  neighborhoodName: string;
  /** Agregado regional: salvador | lauro-de-freitas */
  regionId: "salvador" | "lauro-de-freitas";
  city: "Salvador" | "Lauro de Freitas";
  propertyType: PropertyTypeBand;
  businessType: BusinessType;
  priceMin: number;
  priceMax: number;
  /** R$/m² de referência pública para simulação. */
  referencePricePerM2: number;
};

function cut(
  partial: Omit<CollectionCut, "id" | "regionId" | "propertyType" | "businessType"> & {
    propertyType?: PropertyTypeBand;
    businessType?: BusinessType;
  },
): CollectionCut {
  return {
    ...partial,
    id: `${partial.neighborhoodId}-apto-venda`,
    regionId: cityToRegionId(partial.city),
    propertyType: partial.propertyType ?? "apartamento",
    businessType: partial.businessType ?? "venda",
  };
}

/** Salvador — cobertura ampla (marketplace + bairros de referência). */
const SALVADOR_CUTS: CollectionCut[] = [
  cut({
    neighborhoodId: "pituba",
    neighborhoodName: "Pituba",
    city: "Salvador",
    priceMin: 350_000,
    priceMax: 1_500_000,
    referencePricePerM2: 9100,
  }),
  cut({
    neighborhoodId: "barra",
    neighborhoodName: "Barra",
    city: "Salvador",
    priceMin: 400_000,
    priceMax: 2_500_000,
    referencePricePerM2: 11500,
  }),
  cut({
    neighborhoodId: "ondina",
    neighborhoodName: "Ondina",
    city: "Salvador",
    priceMin: 400_000,
    priceMax: 2_000_000,
    referencePricePerM2: 9800,
  }),
  cut({
    neighborhoodId: "rio-vermelho",
    neighborhoodName: "Rio Vermelho",
    city: "Salvador",
    priceMin: 350_000,
    priceMax: 1_300_000,
    referencePricePerM2: 8500,
  }),
  cut({
    neighborhoodId: "caminho-das-arvores",
    neighborhoodName: "Caminho das Árvores",
    city: "Salvador",
    priceMin: 500_000,
    priceMax: 2_000_000,
    referencePricePerM2: 10500,
  }),
  cut({
    neighborhoodId: "itaigara",
    neighborhoodName: "Itaigara",
    city: "Salvador",
    priceMin: 400_000,
    priceMax: 1_500_000,
    referencePricePerM2: 9700,
  }),
  cut({
    neighborhoodId: "horto",
    neighborhoodName: "Horto Florestal",
    city: "Salvador",
    priceMin: 300_000,
    priceMax: 1_100_000,
    referencePricePerM2: 7800,
  }),
  cut({
    neighborhoodId: "imibui",
    neighborhoodName: "Imbuí",
    city: "Salvador",
    priceMin: 300_000,
    priceMax: 1_200_000,
    referencePricePerM2: 7200,
  }),
  cut({
    neighborhoodId: "patamares",
    neighborhoodName: "Patamares",
    city: "Salvador",
    priceMin: 280_000,
    priceMax: 1_000_000,
    referencePricePerM2: 6900,
  }),
  cut({
    neighborhoodId: "itapua",
    neighborhoodName: "Itapuã",
    city: "Salvador",
    priceMin: 300_000,
    priceMax: 1_400_000,
    referencePricePerM2: 6500,
  }),
  cut({
    neighborhoodId: "stella-maris",
    neighborhoodName: "Stella Maris",
    city: "Salvador",
    priceMin: 350_000,
    priceMax: 1_400_000,
    referencePricePerM2: 8200,
  }),
  cut({
    neighborhoodId: "paralela",
    neighborhoodName: "Paralela",
    city: "Salvador",
    priceMin: 350_000,
    priceMax: 1_800_000,
    referencePricePerM2: 6800,
  }),
  cut({
    neighborhoodId: "boca-do-rio",
    neighborhoodName: "Boca do Rio",
    city: "Salvador",
    priceMin: 280_000,
    priceMax: 1_100_000,
    referencePricePerM2: 6400,
  }),
  cut({
    neighborhoodId: "centro",
    neighborhoodName: "Centro Histórico",
    city: "Salvador",
    priceMin: 200_000,
    priceMax: 900_000,
    referencePricePerM2: 5200,
  }),
  cut({
    neighborhoodId: "liberdade",
    neighborhoodName: "Liberdade",
    city: "Salvador",
    priceMin: 180_000,
    priceMax: 700_000,
    referencePricePerM2: 4800,
  }),
  cut({
    neighborhoodId: "sao-cristovao",
    neighborhoodName: "São Cristóvão",
    city: "Salvador",
    priceMin: 220_000,
    priceMax: 850_000,
    referencePricePerM2: 5800,
  }),
  cut({
    neighborhoodId: "cabula",
    neighborhoodName: "Cabula",
    city: "Salvador",
    priceMin: 220_000,
    priceMax: 900_000,
    referencePricePerM2: 5600,
  }),
  cut({
    neighborhoodId: "brotas",
    neighborhoodName: "Brotas",
    city: "Salvador",
    priceMin: 250_000,
    priceMax: 950_000,
    referencePricePerM2: 6100,
  }),
  cut({
    neighborhoodId: "federacao",
    neighborhoodName: "Federação",
    city: "Salvador",
    priceMin: 280_000,
    priceMax: 1_100_000,
    referencePricePerM2: 7000,
  }),
  cut({
    neighborhoodId: "graca",
    neighborhoodName: "Graça",
    city: "Salvador",
    priceMin: 450_000,
    priceMax: 2_200_000,
    referencePricePerM2: 10800,
  }),
  cut({
    neighborhoodId: "vitoria",
    neighborhoodName: "Vitória",
    city: "Salvador",
    priceMin: 500_000,
    priceMax: 2_800_000,
    referencePricePerM2: 12000,
  }),
  cut({
    neighborhoodId: "costa-azul",
    neighborhoodName: "Costa Azul",
    city: "Salvador",
    priceMin: 320_000,
    priceMax: 1_200_000,
    referencePricePerM2: 7400,
  }),
  cut({
    neighborhoodId: "pato",
    neighborhoodName: "Pituaçu",
    city: "Salvador",
    priceMin: 260_000,
    priceMax: 1_000_000,
    referencePricePerM2: 6200,
  }),
  cut({
    neighborhoodId: "cajazeiras",
    neighborhoodName: "Cajazeiras",
    city: "Salvador",
    priceMin: 150_000,
    priceMax: 550_000,
    referencePricePerM2: 4200,
  }),
];

/** Lauro de Freitas — RMS. */
const LAURO_CUTS: CollectionCut[] = [
  cut({
    neighborhoodId: "lauro-centro",
    neighborhoodName: "Centro",
    city: "Lauro de Freitas",
    priceMin: 220_000,
    priceMax: 900_000,
    referencePricePerM2: 5800,
  }),
  cut({
    neighborhoodId: "vilas-do-atlantico",
    neighborhoodName: "Vilas do Atlântico",
    city: "Lauro de Freitas",
    priceMin: 400_000,
    priceMax: 1_800_000,
    referencePricePerM2: 8500,
  }),
  cut({
    neighborhoodId: "buraquinho",
    neighborhoodName: "Buraquinho",
    city: "Lauro de Freitas",
    priceMin: 280_000,
    priceMax: 1_200_000,
    referencePricePerM2: 6200,
  }),
  cut({
    neighborhoodId: "portao",
    neighborhoodName: "Portão",
    city: "Lauro de Freitas",
    priceMin: 250_000,
    priceMax: 1_000_000,
    referencePricePerM2: 5600,
  }),
  cut({
    neighborhoodId: "ipitanga",
    neighborhoodName: "Ipitanga",
    city: "Lauro de Freitas",
    priceMin: 230_000,
    priceMax: 950_000,
    referencePricePerM2: 5400,
  }),
  cut({
    neighborhoodId: "itinga",
    neighborhoodName: "Itinga",
    city: "Lauro de Freitas",
    priceMin: 200_000,
    priceMax: 800_000,
    referencePricePerM2: 5000,
  }),
  cut({
    neighborhoodId: "vida-nova",
    neighborhoodName: "Vida Nova",
    city: "Lauro de Freitas",
    priceMin: 180_000,
    priceMax: 700_000,
    referencePricePerM2: 4700,
  }),
  cut({
    neighborhoodId: "jardim-aeroporto",
    neighborhoodName: "Jardim Aeroporto",
    city: "Lauro de Freitas",
    priceMin: 210_000,
    priceMax: 850_000,
    referencePricePerM2: 5200,
  }),
  cut({
    neighborhoodId: "caminhos-do-mar",
    neighborhoodName: "Caminhos do Mar",
    city: "Lauro de Freitas",
    priceMin: 350_000,
    priceMax: 1_400_000,
    referencePricePerM2: 7200,
  }),
  cut({
    neighborhoodId: "parque-hangar",
    neighborhoodName: "Parque Hangar",
    city: "Lauro de Freitas",
    priceMin: 240_000,
    priceMax: 950_000,
    referencePricePerM2: 5500,
  }),
];

export const COLLECTION_CUTS: CollectionCut[] = [
  ...SALVADOR_CUTS,
  ...LAURO_CUTS,
];
