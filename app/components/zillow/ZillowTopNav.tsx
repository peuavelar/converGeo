"use client";

import type { AppMode } from "../../utils/realEstate";

type Props = {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  isSearching: boolean;
};

export default function ZillowTopNav({
  appMode,
  setAppMode,
  searchQuery,
  setSearchQuery,
  onSearch,
  isSearching,
}: Props) {
  return (
    <header className="safe-pt z-30 flex shrink-0 flex-col gap-2 border-b border-[#d1d1d5] bg-white px-3 pb-2 pt-2 md:h-14 md:flex-row md:items-center md:gap-4 md:px-4 md:pb-0 md:pt-0">
      {/* Mobile: logo + modos + entrar */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#006aff] text-xs font-black text-white">
            ◇
          </span>
          <span className="text-base font-bold tracking-tight text-[#006aff]">
            ConverGeo
          </span>
        </div>
        <nav className="flex items-center gap-0.5 rounded-lg bg-[#f5f5f7] p-0.5">
          {(
            [
              { id: "imovel" as const, short: "Comprar" },
              { id: "negocio" as const, short: "Negócio" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAppMode(item.id)}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold whitespace-nowrap ${
                appMode === item.id
                  ? "bg-white text-[#006aff] shadow-sm"
                  : "text-[#2a2a33]"
              }`}
            >
              {item.short}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="ml-auto rounded-full bg-[#006aff] px-2.5 py-1 text-[11px] font-bold text-white"
        >
          Entrar
        </button>
      </div>

      <form onSubmit={onSearch} className="flex w-full min-w-0 md:hidden">
        <div className="flex w-full overflow-hidden rounded-full border border-[#c3c3c8] bg-white shadow-sm focus-within:border-[#006aff] focus-within:ring-2 focus-within:ring-[#006aff]/30">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Bairro ou endereço"
            className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm text-[#2a2a33] outline-none placeholder:text-[#8a8a93]"
            aria-label="Buscar região"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="m-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#006aff] text-white disabled:opacity-60"
            aria-label="Buscar"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </div>
      </form>

      {/* Desktop: logo | nav | busca central | Ajuda + Entrar à direita */}
      <div className="hidden min-w-0 flex-1 items-center gap-4 md:flex">
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#006aff] text-sm font-black text-white">
            ◇
          </span>
          <span className="text-xl font-bold tracking-tight text-[#006aff]">
            ConverGeo
          </span>
        </div>

        <nav className="flex shrink-0 items-center gap-1">
          {(
            [
              { id: "imovel" as const, label: "Comprar" },
              { id: "negocio" as const, label: "Abrir meu Negócio" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAppMode(item.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${
                appMode === item.id
                  ? "bg-[#e8f1ff] text-[#006aff]"
                  : "text-[#2a2a33] hover:bg-[#f5f5f7]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <form onSubmit={onSearch} className="mx-auto min-w-0 max-w-xl flex-1">
          <div className="flex w-full overflow-hidden rounded-full border border-[#c3c3c8] bg-white shadow-sm focus-within:border-[#006aff] focus-within:ring-2 focus-within:ring-[#006aff]/30">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bairro ou endereço em Salvador"
              className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-[#2a2a33] outline-none placeholder:text-[#8a8a93]"
              aria-label="Buscar região"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#006aff] text-white hover:bg-[#0058d6] disabled:opacity-60"
              aria-label="Buscar"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#2a2a33] hover:bg-[#f5f5f7]"
          >
            Ajuda
          </button>
          <button
            type="button"
            className="rounded-full bg-[#006aff] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#0058d6]"
          >
            Entrar
          </button>
        </div>
      </div>
    </header>
  );
}
