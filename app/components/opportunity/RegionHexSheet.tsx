"use client";

import { useEffect, useState } from "react";
import { getRegionById } from "../../services/regionsApi";
import type { RegionDetail } from "../../types/region";
import { formatPct, scoreCss, bandLabel } from "../../utils/opportunity";
import DualScore from "./DualScore";
import {
  NEARBY_CATEGORY_META,
  formatDistance,
  formatRadiusLabel,
  NEARBY_RADIUS_STEPS_M,
  type NearbyCategory,
  type NearbyFilters,
  type NearbyPlace,
} from "../../services/nearbyPlaces";

type Props = {
  regionId: string | null;
  onClose: () => void;
  onOpenFull?: (id: string) => void;
  nearbyPlaces: NearbyPlace[];
  nearbyLoading: boolean;
  nearbyFilters: NearbyFilters;
  setNearbyFilters: (f: NearbyFilters) => void;
  nearbySource: "osm" | "mock" | null;
  nearbyRadiusM: number;
  onNearbyRadiusChange: (dir: 1 | -1) => void;
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Ficha da região selecionada + serviços próximos (2 km). */
export default function RegionHexSheet({
  regionId,
  onClose,
  onOpenFull,
  nearbyPlaces,
  nearbyLoading,
  nearbyFilters,
  setNearbyFilters,
  nearbySource,
  nearbyRadiusM,
  onNearbyRadiusChange,
}: Props) {
  const [region, setRegion] = useState<RegionDetail | null>(null);

  const canShrink = nearbyRadiusM > NEARBY_RADIUS_STEPS_M[0];
  const canGrow =
    nearbyRadiusM < NEARBY_RADIUS_STEPS_M[NEARBY_RADIUS_STEPS_M.length - 1];

  useEffect(() => {
    let cancelled = false;
    if (!regionId) {
      setRegion(null);
      return;
    }
    getRegionById(regionId).then((r) => {
      if (!cancelled) setRegion(r);
    });
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  if (!regionId || !region) return null;

  const visible = nearbyPlaces.filter((p) => nearbyFilters[p.category]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex max-h-[min(72dvh,560px)] w-full flex-col overflow-hidden rounded-t-2xl border border-[#d1d1d5] border-b-0 bg-white shadow-2xl animate-fade-in sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-h-[min(78vh,560px)] sm:w-[min(100%-2rem,380px)] sm:rounded-xl sm:border-b">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[#e8e8ed] px-3.5 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#6a6a72]">
            Região selecionada
          </p>
          <h3 className="text-lg font-bold text-[#2a2a33]">{region.name}</h3>
          <p
            className="text-xs font-semibold"
            style={{ color: scoreCss(region.score) }}
          >
            {bandLabel(region.band)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-sm font-bold text-[#6a6a72] hover:bg-[#f5f5f7]"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto p-3.5 custom-scrollbar">
        <DualScore
          opportunityScore={region.score}
          matchScore={Math.round(
            region.score * 0.55 + region.breakdown.preco * 0.45,
          )}
        />

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-[#f5f5f7] p-2">
            <p className="text-[#6a6a72]">Preço/m²</p>
            <p className="font-bold text-[#2a2a33]">
              {formatBRL(region.precoM2)}
            </p>
          </div>
          <div className="rounded-lg bg-[#f5f5f7] p-2">
            <p className="text-[#6a6a72]">Valorização</p>
            <p className="font-bold text-[#1a7f37]">
              {formatPct(region.valorizacao12m)}
            </p>
          </div>
          <div className="rounded-lg bg-[#f5f5f7] p-2">
            <p className="text-[#6a6a72]">Lançamentos</p>
            <p className="font-bold text-[#2a2a33]">
              {region.novosEmpreendimentos}
            </p>
          </div>
          <div className="rounded-lg bg-[#f5f5f7] p-2">
            <p className="text-[#6a6a72]">Oferta</p>
            <p className="font-bold text-[#2a2a33]">{region.oferta}</p>
          </div>
        </div>

        <p className="text-[11px] leading-snug text-[#6a6a72]">
          {region.summary}
        </p>

        {/* Perto — integrado */}
        <div className="rounded-xl border border-[#d1d1d5] bg-[#f8fafc] p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#2a2a33]">
                Perto do ponto · raio {formatRadiusLabel(nearbyRadiusM)}
              </p>
              <p className="mt-0.5 text-[10px] text-[#6a6a72]">
                Farmácias, mercados, restaurantes e shoppings no mapa
                {nearbyLoading
                  ? " · atualizando…"
                  : nearbySource === "mock"
                    ? " (estimativa)"
                    : nearbySource === "osm"
                      ? " (OpenStreetMap)"
                      : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#c3c3c8] bg-white p-0.5">
              <button
                type="button"
                onClick={() => onNearbyRadiusChange(-1)}
                disabled={!canShrink || nearbyLoading}
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-[#2a2a33] hover:bg-[#e8f1ff] hover:text-[#006aff] disabled:opacity-40"
                aria-label="Diminuir raio"
                title="Diminuir raio"
              >
                −
              </button>
              <span className="min-w-[3.25rem] text-center text-[11px] font-bold tabular-nums text-[#006aff]">
                {formatRadiusLabel(nearbyRadiusM)}
              </span>
              <button
                type="button"
                onClick={() => onNearbyRadiusChange(1)}
                disabled={!canGrow || nearbyLoading}
                className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-[#2a2a33] hover:bg-[#e8f1ff] hover:text-[#006aff] disabled:opacity-40"
                aria-label="Aumentar raio"
                title="Aumentar raio"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(NEARBY_CATEGORY_META) as NearbyCategory[]).map(
              (key) => {
                const meta = NEARBY_CATEGORY_META[key];
                const count = nearbyPlaces.filter(
                  (p) => p.category === key,
                ).length;
                const on = nearbyFilters[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setNearbyFilters({ ...nearbyFilters, [key]: !on })
                    }
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      on
                        ? "border-[#006aff] bg-[#e8f1ff] text-[#006aff]"
                        : "border-[#c3c3c8] bg-white text-[#6a6a72]"
                    }`}
                  >
                    {meta.symbol} {meta.label} ({count})
                  </button>
                );
              },
            )}
          </div>

          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {visible.slice(0, 12).map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span aria-hidden>
                    {NEARBY_CATEGORY_META[p.category].symbol}
                  </span>
                  <span className="truncate font-semibold text-[#2a2a33]">
                    {p.name}
                  </span>
                </span>
                <span className="shrink-0 font-bold text-[#006aff]">
                  {formatDistance(p.distanceM)}
                </span>
              </li>
            ))}
            {!visible.length && (
              <li className="py-2 text-center text-[#6a6a72]">
                {nearbyLoading
                  ? "Carregando lugares próximos…"
                  : "Nenhum lugar com os filtros atuais."}
              </li>
            )}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => onOpenFull?.(region.id)}
          className="w-full rounded-full bg-[#006aff] py-2.5 text-sm font-bold text-white hover:bg-[#0058d6]"
        >
          Ver análise completa
        </button>
      </div>
    </div>
  );
}
