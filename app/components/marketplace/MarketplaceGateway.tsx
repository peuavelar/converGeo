"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  filterMarketplaceListings,
  MARKETPLACE_LISTINGS,
  marketplacePriceFull,
  type MarketplaceListing,
} from "../../data/marketplaceListings";
import { NEIGHBORHOODS } from "../../data/neighborhoods";
import { getRegionByIdSync } from "../../services/regionsApi";
import { FiltroPill } from "../zillow/ZillowFilterBar";

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
      className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-full bg-[#0a1220] px-4 py-2.5 text-sm font-bold text-white shadow-xl shadow-[#006aff]/25 ring-1 ring-[#006aff]/40 transition hover:bg-[#122038] hover:ring-[#006aff] animate-fade-in"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006aff] text-sm">
        ◇
      </span>
      Marketplace ({MARKETPLACE_LISTINGS.length})
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
  setBudget: (v: number) => void;
  quartos: number;
  setQuartos: (v: number) => void;
};

/** Painel estilo Zillow — lista de imóveis na coluna ao lado do mapa. */
export default function MarketplaceListPanel({
  selectedListingId,
  focusListingId,
  onFocusListingHandled,
  onSelectListing,
  onOpenDetail,
  onClose,
  budget,
  setBudget,
  quartos,
  setQuartos,
}: PanelProps) {
  const [filter, setFilter] = useState<"todos" | "alto" | "medio">("todos");
  const [query, setQuery] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedRef = useRef<HTMLDivElement | null>(null);

  const { listings, filterRelaxed } = useMemo(() => {
    const pool = filterMarketplaceListings(filter);
    const q = query.trim().toLowerCase();
    const bySearch = !q
      ? pool
      : pool.filter((l) => {
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

    const byFiltro = bySearch.filter(
      (l) => l.price <= budget && l.beds >= quartos,
    );
    // Se o filtro zerar a lista, mostra todos da busca (evita marketplace vazio)
    const relaxed = byFiltro.length === 0 && bySearch.length > 0;
    let result = relaxed ? bySearch : byFiltro;

    // Prioriza imóveis dentro do orçamento/quartos
    result = [...result].sort((a, b) => {
      const aOk = a.price <= budget && a.beds >= quartos ? 0 : 1;
      const bOk = b.price <= budget && b.beds >= quartos ? 0 : 1;
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
  }, [filter, focusedId, query, budget, quartos]);

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
      {/* Orçamento encolhido */}
      <button
        type="button"
        onClick={onClose}
        className="flex shrink-0 items-center gap-3 border-b border-[#d1d1d5] bg-white px-3 py-2 text-left transition hover:bg-[#f8fafc]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-sm font-bold text-[#006aff]">
          ←
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-[#6a6a72]">
            Encontre onde seu dinheiro compra melhor
          </p>
          <p className="truncate text-xs font-semibold text-[#2a2a33]">
            Toque para voltar ao orçamento · Salvador, BA
          </p>
        </div>
      </button>

      <header className="shrink-0 border-b border-[#e8e8ed] bg-white px-3 py-2.5">
        <h2 className="text-base font-bold text-[#2a2a33]">
          Imóveis à venda em Salvador
        </h2>
        <p className="text-[11px] text-[#6a6a72]">
          {listings.length} anúncios · marketplace ConverGeo
        </p>
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
            budget={budget}
            setBudget={setBudget}
            quartos={quartos}
            setQuartos={setQuartos}
            align="right"
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
            Nenhum imóvel no filtro atual (orçamento/quartos). Mostrando todos os
            anúncios — ajuste em Filtro.
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
                Opp {focusedListing.score}
              </span>
            </div>
            <div className="p-3">
              <p className="text-xl font-bold tabular-nums text-[#2a2a33]">
                {marketplacePriceFull(focusedListing.price)}
              </p>
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
                      Opp {item.score}
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
