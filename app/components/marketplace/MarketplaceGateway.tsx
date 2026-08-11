"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MARKETPLACE_LISTINGS,
  marketplacePriceFull,
  type MarketplaceListing,
} from "../../data/marketplaceListings";
import { NEIGHBORHOODS } from "../../data/neighborhoods";
import { getRegionByIdSync } from "../../services/regionsApi";
import { FiltroPill, type AdvancedFilters } from "../zillow/FiltroSheet";
import {
  displayOppScore,
  useMarketplaceScores,
} from "../../hooks/useMarketplaceScores";

type MapTriggerProps = {
  hidden?: boolean;
  onRequestOpen: () => void;
};

/** Botão de acesso direto ao marketplace no mapa. */
export function MarketplaceMapTrigger({
  hidden,
  onRequestOpen,
}: MapTriggerProps) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onRequestOpen}
      className="absolute left-2 top-2 z-30 flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#0a1220] px-3 py-2 text-[11px] font-bold text-white shadow-lg ring-1 ring-[#006aff]/40 transition hover:bg-[#122038] active:scale-[0.98] animate-fade-in sm:left-4 sm:top-4 sm:gap-2 sm:px-3.5 sm:text-sm"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#006aff] text-[10px] sm:h-6 sm:w-6 sm:text-xs">
        ◇
      </span>
      Marketplace
      <span className="opacity-80">({MARKETPLACE_LISTINGS.length})</span>
    </button>
  );
}

type PanelProps = {
  selectedListingId?: string | null;
  focusListingId?: string | null;
  onFocusListingHandled?: () => void;
  onSelectListing?: (listing: MarketplaceListing) => void;
  onOpenDetail?: (listing: MarketplaceListing) => void;
  onClose: () => void;
  budget: number;
  quartos: number;
  advancedFilters: AdvancedFilters;
  setAdvancedFilters: (v: AdvancedFilters) => void;
  /** Pré-filtra marketplace por bairro/região (id). */
  regionFilterId?: string | null;
  regionFilterLabel?: string | null;
  onClearRegionFilter?: () => void;
};

/** Heurísticas mock para suítes / vagas a partir do anúncio. */
function listingSuites(l: MarketplaceListing) {
  return Math.max(0, Math.min(l.beds, l.baths >= 2 ? l.baths - 1 : 0));
}

function listingParking(l: MarketplaceListing) {
  if (l.beds >= 4 || l.price >= 1200000) return 2;
  if (l.beds >= 2 || l.area >= 70) return 1;
  return 0;
}

function listingAmenityTags(l: MarketplaceListing): string[] {
  const tags: string[] = [];
  if (l.score >= 75) tags.push("Elevador", "Portaria");
  if (listingParking(l) > 0) tags.push("Garagem");
  if (l.area >= 80) tags.push("Varanda");
  if (l.score >= 85) tags.push("Piscina", "Academia");
  if (l.price >= 900000) tags.push("Ar-condicionado", "Mobiliado");
  if (l.beds <= 2) tags.push("Aceita animais");
  return tags;
}

function matchesAdvanced(l: MarketplaceListing, adv: AdvancedFilters) {
  if (l.baths < adv.banheiros) return false;
  if (listingSuites(l) < adv.suites) return false;
  if (listingParking(l) < adv.vagas) return false;
  if (adv.amenities.length > 0) {
    const tags = listingAmenityTags(l);
    if (!adv.amenities.every((a) => tags.includes(a))) return false;
  }
  return true;
}

/** Painel estilo Zillow — lista de imóveis na coluna ao lado do mapa. */
export default function MarketplaceListPanel({
  selectedListingId,
  focusListingId,
  onFocusListingHandled,
  onSelectListing,
  onOpenDetail,
  onClose,
  budget,
  quartos,
  advancedFilters,
  setAdvancedFilters,
  regionFilterId = null,
  regionFilterLabel = null,
  onClearRegionFilter,
}: PanelProps) {
  const [filter, setFilter] = useState<"todos" | "alto" | "medio">("todos");
  const [query, setQuery] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedRef = useRef<HTMLDivElement | null>(null);
  const { enabled: benchEnabled, byId: scoreById } = useMarketplaceScores();

  useEffect(() => {
    if (regionFilterLabel) {
      setQuery(regionFilterLabel);
      setFilter("todos");
    }
  }, [regionFilterId, regionFilterLabel]);

  const { listings, filterRelaxed } = useMemo(() => {
    // Custo-benefício: com flag, usa percentil real; sem flag, heurística antiga por score.
    let pool = MARKETPLACE_LISTINGS;
    if (filter === "alto") {
      pool = MARKETPLACE_LISTINGS.filter((l) => {
        const s = displayOppScore(l.id, l.score, scoreById);
        return s >= 80;
      });
    } else if (filter === "medio") {
      pool = MARKETPLACE_LISTINGS.filter((l) => {
        if (benchEnabled && scoreById[l.id]?.benchmarkAvailable) {
          const pct = scoreById[l.id].pricePositionPercentile;
          return pct != null && pct <= 45;
        }
        return l.score >= 65 && l.score < 80;
      });
    }
    const q = query.trim().toLowerCase();

    let bySearch = pool;
    if (regionFilterId) {
      bySearch = pool.filter((l) => l.regionId === regionFilterId);
    } else if (q) {
      bySearch = pool.filter((l) => {
        const n = NEIGHBORHOODS.find((x) => x.id === l.regionId);
        const region = getRegionByIdSync(l.regionId);
        const hay = [
          l.title,
          l.regionId,
          l.regionId.replace(/-/g, " "),
          n?.name,
          region?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const byFiltro = bySearch.filter(
      (l) =>
        l.price <= budget &&
        l.beds >= Math.max(quartos, 0) &&
        matchesAdvanced(l, advancedFilters),
    );
    const relaxed = byFiltro.length === 0 && bySearch.length > 0;
    let result = relaxed ? bySearch : byFiltro;

    result = [...result].sort((a, b) => {
      const aOk =
        a.price <= budget &&
        a.beds >= quartos &&
        matchesAdvanced(a, advancedFilters)
          ? 0
          : 1;
      const bOk =
        b.price <= budget &&
        b.beds >= quartos &&
        matchesAdvanced(b, advancedFilters)
          ? 0
          : 1;
      if (aOk !== bOk) return aOk - bOk;
      return a.price - b.price;
    });

    if (focusedId) {
      const focused = MARKETPLACE_LISTINGS.find((l) => l.id === focusedId);
      if (focused) {
        const rest = result.filter((l) => l.id !== focusedId);
        if (result.some((l) => l.id === focusedId) || !q) {
          result = [focused, ...rest.filter((l) => l.id !== focused.id)];
        }
      }
    }

    return { listings: result, filterRelaxed: relaxed };
  }, [
    filter,
    focusedId,
    query,
    budget,
    quartos,
    advancedFilters,
    regionFilterId,
    scoreById,
    benchEnabled,
  ]);

  const focusedListing =
    MARKETPLACE_LISTINGS.find((l) => l.id === focusedId) ?? null;

  useEffect(() => {
    if (!focusListingId) return;
    setFilter("todos");
    setFocusedId(focusListingId);
    onFocusListingHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusListingId]);

  useEffect(() => {
    if (!focusedId) return;
    const t = window.setTimeout(() => {
      focusedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [focusedId]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f5f6f8] animate-fade-in">
      <div className="flex shrink-0 items-center border-b border-[#d1d1d5] bg-white px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 rounded-full border border-[#d1d1d5] bg-white px-2.5 py-1 text-[11px] font-bold text-[#006aff] transition hover:bg-[#e8f1ff]"
        >
          <span className="text-xs leading-none">←</span>
          Voltar ao mapa
        </button>
      </div>

      <header className="shrink-0 border-b border-[#e8e8ed] bg-white px-3 py-2.5">
        <h2 className="text-base font-bold text-[#2a2a33]">
          {regionFilterLabel
            ? `Imóveis em ${regionFilterLabel}`
            : "Imóveis à venda em Salvador"}
        </h2>
        <p className="text-[11px] text-[#6a6a72]">
          {listings.length} anúncio{listings.length === 1 ? "" : "s"} · marketplace
          ConverGeo
        </p>
        {regionFilterId && regionFilterLabel && (
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f1ff] px-2.5 py-1 text-[11px] font-bold text-[#006aff]">
              Bairro: {regionFilterLabel}
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  onClearRegionFilter?.();
                }}
                className="ml-0.5 rounded-full px-1 hover:bg-white/80"
                aria-label="Remover filtro de bairro"
              >
                ✕
              </button>
            </span>
          </div>
        )}
      </header>

      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-[#e8e8ed] bg-white px-3 py-2">
        {(
          [
            { id: "todos" as const, label: "Todos" },
            { id: "alto" as const, label: "Alto potencial" },
            { id: "medio" as const, label: "Custo-benefício" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              filter === f.id
                ? "bg-[#006aff] text-white"
                : "bg-[#f5f5f7] text-[#2a2a33] hover:bg-[#e8f1ff]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto shrink-0">
          <FiltroPill
            value={advancedFilters}
            onChange={setAdvancedFilters}
            compact
            label="Filtro"
          />
        </div>
      </div>

      <div className="shrink-0 border-b border-[#e8e8ed] bg-white px-3 py-2.5">
        <label htmlFor="marketplace-search" className="sr-only">
          Pesquisar bairro ou região
        </label>
        <div className="flex items-center gap-2 rounded-full border border-[#c3c3c8] bg-[#f8fafc] px-3 py-2 focus-within:border-[#006aff] focus-within:ring-2 focus-within:ring-[#006aff]/20">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-[#6a6a72]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="marketplace-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar bairro, região ou imóvel..."
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#2a2a33] outline-none placeholder:text-[#9a9aa3]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs font-bold text-[#6a6a72] hover:text-[#2a2a33]"
              aria-label="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
        {filterRelaxed && (
          <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
            Nenhum imóvel no filtro atual. Mostrando todos os anúncios — ajuste em
            Filtros.
          </p>
        )}
        {listings.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#d1d1d5] bg-white px-3 py-6 text-center text-sm text-[#6a6a72]">
            Nenhum anúncio para “{query.trim() || "sua busca"}”. Tente outro
            bairro ou região.
          </p>
        )}
        {focusedListing && (
          <div
            ref={focusedRef}
            className="mb-3 overflow-hidden rounded-xl border-2 border-[#006aff] bg-white shadow-md"
          >
            <div className="relative h-56 w-full sm:h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={focusedListing.photo}
                alt={focusedListing.title}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-0.5 text-[11px] font-bold text-[#2a2a33]">
                Selecionado
              </span>
              <span className="absolute right-2 top-2 rounded bg-[#006aff] px-2 py-0.5 text-[11px] font-bold text-white">
                Opp{" "}
                {displayOppScore(
                  focusedListing.id,
                  focusedListing.score,
                  scoreById,
                )}
              </span>
            </div>
            <div className="p-3">
              <p className="text-xl font-bold tabular-nums text-[#2a2a33]">
                {marketplacePriceFull(focusedListing.price)}
              </p>
              {scoreById[focusedListing.id]?.explain && (
                <p className="mt-1 text-[10px] font-semibold leading-snug text-[#6a6a72]">
                  {scoreById[focusedListing.id].explain}
                </p>
              )}
              <p className="mt-1 text-xs text-[#6a6a72]">
                {focusedListing.beds} quartos · {focusedListing.baths} ba ·{" "}
                {focusedListing.area} m² · Apartamento
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#2a2a33]">
                {focusedListing.title}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelectListing?.(focusedListing)}
                  className="flex-1 rounded-full border border-[#006aff] py-2.5 text-sm font-bold text-[#006aff] hover:bg-[#e8f1ff]"
                >
                  Destacar no mapa
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDetail?.(focusedListing)}
                  className="flex-1 rounded-full bg-[#006aff] py-2.5 text-sm font-bold text-white hover:bg-[#0058d6]"
                >
                  Ver mais
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {listings
            .filter((item) => item.id !== focusedId)
            .map((item) => (
              <div
                key={item.id}
                className={`overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:shadow-md ${
                  selectedListingId === item.id
                    ? "border-[#006aff] ring-2 ring-[#006aff]/20"
                    : "border-[#d1d1d5]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setFocusedId(item.id);
                    onSelectListing?.(item);
                  }}
                  className="block w-full text-left"
                >
                  <div className="relative h-40 w-full sm:h-48">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.photo}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-[#2a2a33]">
                      Opp {displayOppScore(item.id, item.score, scoreById)}
                    </span>
                    {item.price > budget && (
                      <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Acima do orçamento
                      </span>
                    )}
                  </div>
                  <div className="p-2.5 pb-1">
                    <p className="text-sm font-bold tabular-nums text-[#2a2a33]">
                      {marketplacePriceFull(item.price)}
                    </p>
                    {scoreById[item.id]?.explain && (
                      <p className="mt-0.5 line-clamp-2 text-[9px] font-semibold leading-snug text-[#6a6a72]">
                        {scoreById[item.id].explain}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] leading-snug text-[#6a6a72]">
                      {item.beds} quartos · {item.baths} ba · {item.area} m²
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-[#2a2a33]">
                      {item.title}
                    </p>
                  </div>
                </button>
                <div className="px-2.5 pb-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenDetail?.(item)}
                    className="w-full rounded-full bg-[#006aff] py-2 text-xs font-bold text-white hover:bg-[#0058d6]"
                  >
                    Ver mais
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
