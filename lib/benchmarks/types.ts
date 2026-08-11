/** Tipos das “tabelas” JSON — nunca expostos crus em API pública de marketplace. */

export type ExternalSource = "olx" | "vivareal" | "zap" | "simulated";
export type BusinessType = "venda" | "aluguel";
export type BucketLevel = "neighborhood" | "region" | "city";
export type PropertyTypeBand =
  | "apartamento"
  | "casa"
  | "cobertura"
  | "terreno"
  | "outro";

export type BedroomsBand = "0" | "1" | "2" | "3" | "4plus";

export type ExternalListingSnapshot = {
  id: string; // source:sourceId
  source: ExternalSource;
  sourceUrl: string;
  capturedAt: string;
  requestId?: string;
  executionId?: string;
  price: number;
  usableArea: number;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: PropertyTypeBand;
  city: string;
  neighborhood: string;
  listedAt: string | null;
  businessType: BusinessType;
  rawHash: string;
};

export type PriceBenchmark = {
  bucketKey: string;
  bucketLevel: BucketLevel;
  propertyType: PropertyTypeBand;
  bedroomsBand: BedroomsBand;
  businessType: BusinessType;
  n: number;
  medianPricePerM2: number;
  p25: number;
  p75: number;
  iqr: number;
  medianPrice: number;
  medianDaysOnMarket: number;
  supplyCount: number;
  computedAt: string;
  previousMedianPricePerM2: number | null;
  /** Sempre "asking" — preço de pedido, não transação. */
  priceBasis: "asking";
  collectionCount: number;
};

export type CollectionRun = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  cutsProcessed: string[];
  itemsCollected: number;
  creditsEstimated: number;
  errors: string[];
  mode: "simulated" | "gecko" | "mixed";
};

export type ScoreBenchmarkExplain = {
  bucketKey: string;
  bucketLevel: BucketLevel;
  n: number;
  medianPricePerM2: number;
  computedAt: string;
  pricePositionPercentile: number;
  priceBasis: "asking";
  benchmarkAvailable: boolean;
};

export type CalibratedOpportunity = {
  baseScore: number;
  calibratedOpportunityScore: number;
  pricePositionPercentile: number | null;
  priceAdj: number;
  benchmarkAvailable: boolean;
  explain: ScoreBenchmarkExplain | null;
};
