"use client";

import { useId, useState } from "react";
import type { RegionSummary } from "../../types/region";
import { scoreCss } from "../../utils/opportunity";

type Props = {
  regions: RegionSummary[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  /** Aberto por padrão? Default: fechado. */
  defaultOpen?: boolean;
};

/** Menu suspenso com ranking compacto de oportunidades. */
export default function RegionRanking({
  regions,
  selectedId,
  onSelect,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="overflow-hidden rounded-xl border border-[#d1d1d5] bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-[#f8f9fb]"
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
              ? "Toque numa região para ver no mapa"
              : `Top ${regions.length} · abra para ver o ranking`}
          </p>
        </div>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d1d1d5] bg-white text-[#2a2a33] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M5.5 7.5 10 12l4.5-4.5" />
          </svg>
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="border-t border-[#e8e8ed]"
      >
        <ol className="divide-y divide-[#eef0f3]">
          {regions.map((r, idx) => {
            const selected = selectedId === r.id;
            const accent = scoreCss(r.score);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                    selected
                      ? "bg-[#e8f1ff]"
                      : "bg-white hover:bg-[#f8f9fb]"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                      idx === 0
                        ? "bg-[#006aff] text-white"
                        : idx === 1
                          ? "bg-[#4d9aff] text-white"
                          : idx === 2
                            ? "bg-[#a8cdff] text-[#0a3d8f]"
                            : "bg-[#f0f1f4] text-[#6a6a72]"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#2a2a33]">
                      {r.name}
                    </p>
                    <p
                      className="truncate text-[11px] font-semibold"
                      style={{ color: accent }}
                    >
                      {r.potencial}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a93]">
                      Score
                    </p>
                    <p
                      className="text-base font-black tabular-nums"
                      style={{ color: accent }}
                    >
                      {r.score}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="border-t border-[#eef0f3] bg-[#f8f9fb] px-3 py-2 text-[11px] leading-snug text-[#6a6a72]">
          Peça detalhes ao <strong className="text-[#006aff]">Sino Mobile</strong>{" "}
          (ex.: “me fala da Paralela” ou “compare Imbuí e Pituba”).
        </p>
      </div>
    </section>
  );
}
