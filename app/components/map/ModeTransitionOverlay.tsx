"use client";

import type { AppMode } from "../../utils/realEstate";

type Props = {
  targetMode: AppMode | null;
  exiting?: boolean;
};

const COPY: Record<AppMode, { title: string; hint: string }> = {
  imovel: {
    title: "Carregando mapa de imóveis",
    hint: "Ajustando pins e regiões…",
  },
  negocio: {
    title: "Carregando mapa de negócios",
    hint: "Preparando camadas de oportunidade…",
  },
};

export default function ModeTransitionOverlay({ targetMode, exiting }: Props) {
  if (!targetMode) return null;
  const copy = COPY[targetMode];

  return (
    <div
      className={`pointer-events-auto absolute inset-0 z-[55] flex items-center justify-center bg-[#e8e8ed]/88 backdrop-blur-[3px] ${
        exiting ? "animate-mode-veil-out" : "animate-mode-veil-in"
      }`}
      aria-live="polite"
      aria-busy={!exiting}
      role="status"
    >
      <div className="mx-4 flex max-w-xs flex-col items-center gap-3 rounded-2xl border border-[#d1d1d5] bg-white/95 px-6 py-5 text-center shadow-lg">
        <div className="relative h-10 w-10">
          <span className="absolute inset-0 rounded-full border-[3px] border-[#e8e8ed]" />
          <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#0a0a0b]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0a0a0b]">{copy.title}</p>
          <p className="mt-1 text-[11px] font-medium text-[#6a6a72]">
            {copy.hint}
          </p>
        </div>
        <div className="flex gap-1 pt-0.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0a0a0b]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0a0a0b] [animation-delay:140ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0a0a0b] [animation-delay:280ms]" />
        </div>
      </div>
    </div>
  );
}
