"use client";

import { useEffect, useMemo, useState } from "react";
import { WebMercatorViewport } from "@deck.gl/core";
import {
  MARKETPLACE_LISTINGS,
  marketplacePriceLabel,
  type MarketplaceListing,
} from "../../data/marketplaceListings";

type ViewLike = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;
  bearing?: number;
  width?: number;
  height?: number;
};

type Props = {
  lat: number;
  lng: number;
  regionId: string | null;
  regionName?: string | null;
  viewState: ViewLike;
  mapSize: { width: number; height: number };
  onSelect: (listing: MarketplaceListing) => void;
  onClose: () => void;
  onSeeAll?: () => void;
  onOpenNeighborhood?: () => void;
};

function dist2(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dLat = aLat - bLat;
  const dLng = aLng - bLng;
  return dLat * dLat + dLng * dLng;
}

/** Até 3 imóveis da região (completa com os mais próximos se faltar). */
export function pickListingsForPin(
  lat: number,
  lng: number,
  regionId: string | null,
  limit = 3,
): MarketplaceListing[] {
  const inRegion = regionId
    ? MARKETPLACE_LISTINGS.filter((l) => l.regionId === regionId)
    : [];

  const rank = (list: MarketplaceListing[]) =>
    [...list].sort(
      (a, b) =>
        dist2(lat, lng, a.lat, a.lng) - dist2(lat, lng, b.lat, b.lng),
    );

  if (inRegion.length >= limit) return rank(inRegion).slice(0, limit);

  const picked = new Set(inRegion.map((l) => l.id));
  const rest = rank(
    MARKETPLACE_LISTINGS.filter((l) => !picked.has(l.id)),
  );
  return [...rank(inRegion), ...rest].slice(0, limit);
}

/** Card flutuante acima do pino — desktop ancorado no mapa; mobile em folha estável. */
export default function MapPinListingsCard({
  lat,
  lng,
  regionId,
  regionName,
  viewState,
  mapSize,
  onSelect,
  onClose,
  onSeeAll,
  onOpenNeighborhood,
}: Props) {
  const listings = useMemo(
    () => pickListingsForPin(lat, lng, regionId, 3),
    [lat, lng, regionId],
  );

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const isMobile = mapSize.width > 0 && mapSize.width < 768;

  useEffect(() => {
    if (mapSize.width < 8 || mapSize.height < 8) {
      setPos(null);
      return;
    }
    try {
      const viewport = new WebMercatorViewport({
        longitude: viewState.longitude,
        latitude: viewState.latitude,
        zoom: viewState.zoom,
        pitch: viewState.pitch ?? 0,
        bearing: viewState.bearing ?? 0,
        width: mapSize.width,
        height: mapSize.height,
      });
      const [x, y] = viewport.project([lng, lat]);
      setPos({ x, y });
    } catch {
      setPos(null);
    }
  }, [lat, lng, viewState, mapSize]);

  if (listings.length === 0) return null;
  if (!isMobile && !pos) return null;

  const card = (
    <div className="overflow-hidden rounded-2xl border border-[#d1d1d5] bg-white shadow-[0_12px_40px_rgba(10,18,32,0.22)]">
      <div className="flex items-start justify-between gap-2 border-b border-[#eef1f6] px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#006aff]">
            À venda por aqui
          </p>
          <p className="truncate text-sm font-bold text-[#2a2a33]">
            {regionName || "Região"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-[#6a6a72] hover:bg-[#f5f5f7] active:bg-[#e8e8ed]"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <ul className="max-h-[min(42vh,280px)] divide-y divide-[#eef1f6] overflow-y-auto overscroll-contain">
        {listings.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => onSelect(l)}
              className="flex min-h-[56px] w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-[#f5f9ff] active:bg-[#e8f1ff]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={l.photo}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#2a2a33]">
                  {l.title}
                </p>
                <p className="text-[10px] text-[#6a6a72]">
                  {l.beds} qtos · {l.baths} ban · {l.area} m²
                </p>
                <p className="mt-0.5 text-xs font-bold text-[#006aff]">
                  {marketplacePriceLabel(l.price)}
                </p>
              </div>
              <span className="shrink-0 text-[#006aff]" aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="divide-y divide-[#eef1f6] border-t border-[#eef1f6]">
        {onOpenNeighborhood && (
          <button
            type="button"
            onClick={onOpenNeighborhood}
            className="min-h-[48px] w-full py-3 text-center text-xs font-bold text-[#2a2a33] hover:bg-[#f5f5f7] active:bg-[#e8e8ed]"
          >
            Oportunidades do bairro
          </button>
        )}
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="min-h-[48px] w-full py-3 text-center text-xs font-bold text-[#006aff] hover:bg-[#f5f9ff] active:bg-[#e8f1ff]"
          >
            Ver todos na região
          </button>
        )}
      </div>
    </div>
  );

  // iPhone / Android: folha estável no fundo do mapa (evita card fora da tela)
  if (isMobile) {
    return (
      <div
        className="pointer-events-auto absolute inset-x-2 z-30 animate-fade-in"
        style={{
          bottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
        }}
        role="dialog"
        aria-label={`Imóveis em ${regionName || "região"}`}
      >
        {card}
      </div>
    );
  }

  const cardW = Math.min(288, mapSize.width - 16);
  const left = Math.max(
    8,
    Math.min((pos?.x ?? 0) - cardW / 2, mapSize.width - cardW - 8),
  );
  const top = Math.max(8, (pos?.y ?? 0) - 12 - 210);

  return (
    <div
      className="pointer-events-auto absolute z-30 w-[min(288px,calc(100%-1rem))] animate-fade-in"
      style={{ left, top, width: cardW }}
      role="dialog"
      aria-label={`Imóveis em ${regionName || "região"}`}
    >
      {card}
      <div
        className="mx-auto -mt-px h-0 w-0 border-x-[8px] border-t-[9px] border-x-transparent border-t-white drop-shadow-sm"
        style={{
          marginLeft: Math.max(
            16,
            Math.min((pos?.x ?? 0) - left - 8, cardW - 24),
          ),
        }}
        aria-hidden
      />
    </div>
  );
}
