"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { RegionSummary } from "../../types/region";
import { scoreCss } from "../../utils/opportunity";

type Props = {
  regions: RegionSummary[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  /** Aberto por padrão? Default: fechado. */
  defaultOpen?: boolean;
};

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** Ranking Top 3 em comparação: o painel sobe ao clicar. */
export default function RegionRanking({
  regions,
  selectedId,
  onSelect,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const top3 = regions.slice(0, 3);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <section ref={rootRef} className="relative z-20 shrink-0">
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Comparação Top 3 oportunidades"
          className="absolute bottom-[calc(100%+8px)] left-0 right-0 overflow-hidden rounded-xl border border-[#d1d1d5] bg-white shadow-[0_-12px_32px_rgba(15,40,80,0.14)]"
        >
          <div className="border-b border-[#eef0f3] bg-[#f8f9fb] px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6a6a72]">
              Comparação · Top 3
            </p>
            <p className="text-[11px] text-[#8a8a93]">
              Score, preço e valorização lado a lado
            </p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-[#eef0f3]">
            {top3.map((r, idx) => {
              const selected = selectedId === r.id;
              const accent = scoreCss(r.score);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onSelect(r.id);
                    setOpen(false);
                  }}
                  className={`flex flex-col gap-1.5 px-2.5 py-3 text-left transition ${
                    selected ? "bg-[#e8f1ff]" : "bg-white hover:bg-[#f8f9fb]"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                      idx === 0
                        ? "bg-[#006aff] text-white"
                        : idx === 1
                          ? "bg-[#4d9aff] text-white"
                          : "bg-[#a8cdff] text-[#0a3d8f]"
                    }`}
                  >
                    {idx + 1}º
                  </span>
                  <p className="truncate text-[12px] font-bold text-[#2a2a33]">
                    {r.name}
                  </p>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8a8a93]">
                      Score
                    </p>
                    <p
                      className="text-base font-black tabular-nums"
                      style={{ color: accent }}
                    >
                      {r.score}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8a8a93]">
                      Preço
                    </p>
                    <p className="text-[11px] font-bold tabular-nums text-[#2a2a33]">
                      {brl.format(r.precoM2)}
                      <span className="font-medium text-[#8a8a93]">/m²</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8a8a93]">
                      Valorização
                    </p>
                    <p className="text-[11px] font-bold tabular-nums text-emerald-600">
                      +{r.valorizacao12m.toFixed(1)}%
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {top3.length === 0 && (
            <p className="px-3 py-4 text-center text-[12px] text-[#6a6a72]">
              Ranking indisponível no momento.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-[#d1d1d5] bg-white px-3 py-2.5 text-left shadow-sm transition hover:bg-[#f8f9fb]"
      >
        <span className="text-base leading-none" aria-hidden>
          🔥
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[#2a2a33]">
            Regiões com maior oportunidade
          </h2>
          <p className="text-[11px] text-[#6a6a72]">
            {open
              ? "Comparação Top 3 aberta"
              : "Top 3 · toque para subir o ranking"}
          </p>
        </div>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d1d1d5] bg-white text-[#2a2a33] transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M5.5 12.5 10 8l4.5 4.5" />
          </svg>
        </span>
      </button>
    </section>
  );
}
