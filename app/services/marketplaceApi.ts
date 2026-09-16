export type MarketplaceSource = "mock" | "api";

export type BuyerScoreProfile = "moradia" | "investidor" | "incorporadora";

export type FairPriceSeal = {
  precoEstimado: number | null;
  desvioPct: number | null;
  faixa: "abaixo" | "justo" | "acima" | null;
  confianca: number | null;
};

export type ApiMarketplaceListing = {
  id: string;
  idExterno: string;
  finalidade: string;
  tipo: string;
  preco: number | null;
  areaUtil: number | null;
  quartos: number | null;
  lat: number | null;
  lng: number | null;
  h3Index: string | null;
  enderecoBairro: string | null;
  ocultarEndereco: boolean;
  fotos: string[];
  scoreRegiao: number | null;
  precoJusto: FairPriceSeal | null;
};

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "/backend").replace(/\/$/, "");
}

export function marketplaceSource(): MarketplaceSource {
  const raw = (process.env.NEXT_PUBLIC_MARKETPLACE_SOURCE || "mock").toLowerCase();
  return raw === "api" ? "api" : "mock";
}

function mapFair(
  raw: {
    preco_estimado?: number | null;
    desvio_pct?: number | null;
    faixa?: string | null;
    confianca?: number | null;
  } | null,
): FairPriceSeal | null {
  if (!raw) return null;
  const faixa = raw.faixa;
  return {
    precoEstimado: raw.preco_estimado ?? null,
    desvioPct: raw.desvio_pct ?? null,
    faixa:
      faixa === "abaixo" || faixa === "justo" || faixa === "acima" ? faixa : null,
    confianca: raw.confianca ?? null,
  };
}

export async function fetchMarketplaceListings(opts: {
  finalidade?: string;
  perfil?: BuyerScoreProfile;
  quartos?: number;
}): Promise<ApiMarketplaceListing[]> {
  const params = new URLSearchParams();
  params.set("finalidade", opts.finalidade || "venda");
  params.set("perfil", opts.perfil || "moradia");
  if (opts.quartos != null) params.set("quartos", String(opts.quartos));
  const res = await fetch(`${apiBase()}/v2/imoveis?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`marketplace ${res.status}`);
  const data = (await res.json()) as {
    imoveis?: Array<{
      id: string;
      id_externo: string;
      finalidade: string;
      tipo: string;
      preco: number | null;
      area_util: number | null;
      quartos: number | null;
      lat: number | null;
      lng: number | null;
      h3_index: string | null;
      endereco_bairro: string | null;
      ocultar_endereco: boolean;
      fotos: string[];
      score_regiao: number | null;
      preco_justo: {
        preco_estimado?: number | null;
        desvio_pct?: number | null;
        faixa?: string | null;
        confianca?: number | null;
      } | null;
    }>;
  };
  return (data.imoveis || []).map((i) => ({
    id: i.id,
    idExterno: i.id_externo,
    finalidade: i.finalidade,
    tipo: i.tipo,
    preco: i.preco,
    areaUtil: i.area_util,
    quartos: i.quartos,
    lat: i.lat,
    lng: i.lng,
    h3Index: i.h3_index,
    enderecoBairro: i.endereco_bairro,
    ocultarEndereco: i.ocultar_endereco,
    fotos: i.fotos || [],
    scoreRegiao: i.score_regiao,
    precoJusto: mapFair(i.preco_justo),
  }));
}

export function apiListingToMarketplace(
  a: ApiMarketplaceListing,
): import("../data/marketplaceListings").MarketplaceListing {
  const bairro = a.enderecoBairro || "Salvador";
  return {
    id: a.id,
    regionId: bairro.toLowerCase().replace(/\s+/g, "-"),
    title: `${a.tipo} · ${bairro}`,
    lat: a.lat ?? 0,
    lng: a.lng ?? 0,
    price: a.preco ?? 0,
    beds: a.quartos ?? 0,
    baths: 1,
    area: a.areaUtil ?? 0,
    precoM2:
      a.areaUtil && a.preco ? Math.round(a.preco / a.areaUtil) : 0,
    score: Math.round((a.scoreRegiao ?? 0) * 10),
    valorizacao12m: 0,
    photo: a.fotos[0] || "",
    precoJusto: a.precoJusto,
  };
}

export async function fetchRegionScoreV2(opts: {
  lat: number;
  lng: number;
  perfil: BuyerScoreProfile;
}): Promise<{
  scoreTotal: number | null;
  cobertura: Record<string, boolean>;
  breakdown: Record<string, number | null>;
  explicacaoBase: unknown[];
} | null> {
  const params = new URLSearchParams({
    lat: String(opts.lat),
    lng: String(opts.lng),
    perfil: opts.perfil,
  });
  const res = await fetch(`${apiBase()}/v2/score?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    score_total: number | null;
    cobertura: Record<string, boolean>;
    breakdown: Record<string, number | null>;
    explicacao_base: unknown[];
  };
  return {
    scoreTotal: data.score_total,
    cobertura: data.cobertura,
    breakdown: data.breakdown,
    explicacaoBase: data.explicacao_base,
  };
}
