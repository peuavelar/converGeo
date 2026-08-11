"use client";

import type { AppMode } from "../../utils/realEstate";

type Props = {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
};

export default function ZillowTopNav({ appMode, setAppMode }: Props) {
  return (
    <header className="safe-pt z-30 flex h-12 shrink-0 items-center gap-2 border-b border-[#d1d1d5] bg-white px-3 md:h-14 md:gap-4 md:px-4">
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#006aff] text-xs font-black text-white md:h-8 md:w-8 md:text-sm">
          ◇
        </span>
        <span className="text-base font-bold tracking-tight text-[#006aff] md:text-xl">
          ConverGeo
        </span>
      </div>

      <nav className="flex items-center gap-0.5 rounded-lg bg-[#f5f5f7] p-0.5 md:bg-transparent md:p-0">
        {(
          [
            {
              id: "imovel" as const,
              label: "Comprar",
              short: "Comprar",
            },
            {
              id: "negocio" as const,
              label: "Abrir meu Negócio",
              short: "Negócio",
            },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAppMode(item.id)}
            className={`rounded-md px-2 py-1 text-[11px] font-semibold whitespace-nowrap md:px-3 md:py-1.5 md:text-sm ${
              appMode === item.id
                ? "bg-white text-[#006aff] shadow-sm md:bg-[#e8f1ff] md:shadow-none"
                : "text-[#2a2a33] hover:bg-[#f5f5f7]"
            }`}
          >
            <span className="md:hidden">{item.short}</span>
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
        <button
          type="button"
          className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-[#2a2a33] hover:bg-[#f5f5f7] md:inline-flex"
        >
          Ajuda
        </button>
        <button
          type="button"
          className="rounded-full bg-[#006aff] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#0058d6] md:px-4 md:py-1.5 md:text-sm"
        >
          Entrar
        </button>
      </div>
    </header>
  );
}
