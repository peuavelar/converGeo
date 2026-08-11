"use client";

import { useMemo, useState } from "react";
import type { MarketplaceListing } from "../../data/marketplaceListings";
import { marketplacePriceFull } from "../../data/marketplaceListings";
import { neighborhoodPhoto } from "../../data/neighborhoodPhotos";
import { NEIGHBORHOODS } from "../../data/neighborhoods";
import { getRegionByIdSync } from "../../services/regionsApi";
import { NearbyCategoryIcon } from "../map/NearbyCategoryIcon";
import {
  NEARBY_CATEGORY_META,
  formatDistance,
  type NearbyPlace,
} from "../../services/nearbyPlaces";

type Props = {
  listing: MarketplaceListing;
  onClose: () => void;
  onAskSino?: (question: string) => void;
  nearbyPlaces?: NearbyPlace[];
  nearbyLoading?: boolean;
};

const EXTRA_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=60",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=60",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=60",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1200&q=60",
];

const GALLERY_TABS = [
  "Fotos",
  "Planta",
  "Vídeo",
  "Tour 3D",
  "Mapa",
] as const;

/** Modal de detalhe do imóvel (estilo ficha Zillow). */
export default function PropertyDetailOverlay({
  listing,
  onClose,
  onAskSino,
  nearbyPlaces = [],
  nearbyLoading = false,
}: Props) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [tab, setTab] = useState<(typeof GALLERY_TABS)[number]>("Fotos");
  const [ask, setAsk] = useState("");

  const neighborhood =
    NEIGHBORHOODS.find((n) => n.id === listing.regionId)?.name ||
    getRegionByIdSync(listing.regionId)?.name ||
    "Salvador";

  const region = getRegionByIdSync(listing.regionId);

  const photos = useMemo(() => {
    const main = listing.photo || neighborhoodPhoto(listing.regionId);
    return [main, ...EXTRA_PHOTOS.filter((p) => p !== main)].slice(0, 5);
  }, [listing]);

  const monthly = Math.round(listing.price * 0.0075);
  const address = `${listing.title.replace("·", "—")} · ${neighborhood}, Salvador — BA`;
  const nearbyPreview = nearbyPlaces.slice(0, 8);

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/55 p-0 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={listing.title}
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white shadow-2xl animate-market-pop sm:h-auto sm:max-h-[min(94vh,920px)] sm:rounded-2xl"
      >
        <div className="relative shrink-0 bg-[#0a1220]">
          <div className="relative h-[min(38vh,340px)] w-full sm:h-[min(42vh,380px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[photoIdx]}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />

            <button
              type="button"
              onClick={onClose}
              className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-lg font-bold text-[#2a2a33] shadow hover:bg-white"
              aria-label="Voltar"
            >
              ←
            </button>

            <div className="absolute right-3 top-3 flex items-center gap-2">
              <button
                type="button"
                className="rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-[#2a2a33] shadow hover:bg-white"
              >
                ♡ Salvar
              </button>
              <button
                type="button"
                className="rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-[#2a2a33] shadow hover:bg-white"
              >
                Compartilhar
              </button>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto pb-1">
              {GALLERY_TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-bold shadow ${
                    tab === t
                      ? "bg-white text-[#2a2a33]"
                      : "bg-black/45 text-white hover:bg-black/60"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1 bg-[#0a1220] px-3 py-2">
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setPhotoIdx(i)}
                className={`h-1.5 flex-1 rounded-full transition ${
                  i === photoIdx ? "bg-[#006aff]" : "bg-white/30"
                }`}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className="flex shrink-0 items-center justify-between border-b border-[#e8e8ed] bg-white px-4 py-3 text-left hover:bg-[#f8fafc]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006aff] text-sm font-bold text-white">
              CG
            </span>
            <div>
              <p className="text-sm font-bold text-[#2a2a33]">
                ConverGeo Corretor
              </p>
              <p className="text-xs text-[#006aff]">
                Clique aqui para entrar em contato!
              </p>
            </div>
          </div>
          <span className="text-[#6a6a72]">›</span>
        </button>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-3xl font-bold tabular-nums text-[#2a2a33]">
                {marketplacePriceFull(listing.price)}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#2a2a33]">
                {address}
              </p>
              <p className="mt-1 text-xs text-[#6a6a72]">
                {listing.beds} quartos · {listing.baths} banheiros ·{" "}
                {listing.area} m² · {marketplacePriceFull(listing.precoM2)}/m²
              </p>
              <p className="mt-2 text-xs text-[#6a6a72]">
                Est. parcela:{" "}
                <span className="font-semibold text-[#2a2a33]">
                  {marketplacePriceFull(monthly)}/mês
                </span>
                {region && (
                  <>
                    {" "}
                    · Opp{" "}
                    <span className="font-bold text-[#006aff]">
                      {listing.score}
                    </span>{" "}
                    · Valorização +{listing.valorizacao12m.toFixed(1)}%
                  </>
                )}
              </p>
              {region && (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#6a6a72]">
                  {region.summary}
                </p>
              )}

              <div className="mt-4 rounded-xl border border-[#e0e7f1] bg-[#f8fafc] p-3">
                <p className="text-xs font-bold text-[#2a2a33]">
                  Locais próximos
                </p>
                <p className="mt-0.5 text-[11px] text-[#6a6a72]">
                  Restaurantes, hospitais, delegacias e escolas ao redor. No
                  mapa, toque nos ícones ou abra a legenda.
                </p>
                {nearbyLoading && (
                  <p className="mt-2 text-[11px] font-medium text-[#006aff]">
                    Carregando vizinhança…
                  </p>
                )}
                <ul className="mt-2 space-y-1">
                  {nearbyPreview.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white"
                          style={{
                            backgroundColor: `rgb(${NEARBY_CATEGORY_META[p.category].color.join(",")})`,
                          }}
                          title={NEARBY_CATEGORY_META[p.category].label}
                        >
                          <NearbyCategoryIcon
                            category={p.category}
                            className="h-3.5 w-3.5"
                          />
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
                  {!nearbyLoading && !nearbyPreview.length && (
                    <li className="py-2 text-center text-[11px] text-[#6a6a72]">
                      Nenhum ponto próximo carregado ainda.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="w-full shrink-0 rounded-xl border border-[#d1d1d5] bg-[#f8fafc] p-3 sm:w-48">
              <div className="flex items-center gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0a1220] text-xs font-bold text-white">
                  SA
                </span>
                <div>
                  <p className="text-xs font-bold text-[#2a2a33]">
                    Sino Analytics
                  </p>
                  <p className="text-[10px] text-[#6a6a72]">
                    Assistente ConverGeo
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="mt-3 w-full rounded-full bg-[#006aff] py-2 text-xs font-bold text-white hover:bg-[#0058d6]"
              >
                Pedir análise
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#e8e8ed] bg-white px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!ask.trim()) return;
              onAskSino?.(ask.trim());
              setAsk("");
            }}
            className="mx-auto max-w-2xl"
          >
            <div className="flex items-center gap-2 rounded-full border border-[#c3c3c8] bg-[#f8fafc] px-3 py-2 focus-within:border-[#006aff] focus-within:ring-2 focus-within:ring-[#006aff]/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sino-mobile-avatar.png"
                alt=""
                className="h-7 w-7 rounded-full bg-white object-contain"
              />
              <input
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                placeholder="Pergunte ao Sino Analytics sobre este imóvel..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9a9aa3]"
              />
              <button
                type="submit"
                className="rounded-full bg-[#006aff] px-3 py-1.5 text-xs font-bold text-white"
              >
                Enviar
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                "Contatar corretor",
                "Vale a pena comprar aqui?",
                "O que tem perto?",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onAskSino?.(q)}
                  className="rounded-full border border-[#c3c3c8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2a2a33] hover:border-[#006aff] hover:bg-[#e8f1ff]"
                >
                  {q}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
