"use client";

import { useMemo, useState } from "react";
import type { MarketplaceListing } from "../../data/marketplaceListings";
import { marketplacePriceFull } from "../../data/marketplaceListings";
import { neighborhoodPhoto } from "../../data/neighborhoodPhotos";
import { NEIGHBORHOODS } from "../../data/neighborhoods";
import { getRegionByIdSync } from "../../services/regionsApi";

type Props = {
  listing: MarketplaceListing;
  onClose: () => void;
  onAskSino?: (question: string) => void;
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

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/55 p-0 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={listing.title}
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white shadow-2xl animate-market-pop sm:h-auto sm:max-h-[min(94vh,920px)] sm:rounded-2xl"
      >
        {/* Hero / galeria */}
        <div className="relative shrink-0 bg-[#0a1220]">
          <div className="relative h-[min(42vh,380px)] w-full">
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
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-[#2a2a33] shadow"
                aria-label="Mais"
              >
                ···
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

        {/* Contato corretor */}
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

        {/* Dados */}
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
            </div>

            <div className="w-full shrink-0 rounded-xl border border-[#d1d1d5] bg-[#f8fafc] p-3 sm:w-48">
              <div className="flex items-center gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0a1220] text-xs font-bold text-white">
                  SM
                </span>
                <div>
                  <p className="text-xs font-bold text-[#2a2a33]">Sino Mobile</p>
                  <p className="text-[10px] text-[#6a6a72]">Assistente ConverGeo</p>
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

        {/* Pergunte / chips */}
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
                placeholder="Pergunte ao Sino Mobile sobre este imóvel..."
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
                "Há estacionamento?",
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
