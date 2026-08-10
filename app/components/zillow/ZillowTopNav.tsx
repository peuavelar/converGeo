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
    <header className="z-30 flex h-14 shrink-0 items-center gap-4 border-b border-[#d1d1d5] bg-white px-4">
      <div className="flex shrink-0 items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#006aff] text-sm font-black text-white">
          ◇
        </span>
        <span className="text-xl font-bold tracking-tight text-[#006aff]">
          ConverGeo
        </span>
      </div>

      <nav className="hidden items-center gap-1 md:flex">
        {(
          [
            { id: "imovel" as const, label: "Comprar" },
            { id: "negocio" as const, label: "Empreender" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAppMode(item.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
              appMode === item.id
                ? "bg-[#e8f1ff] text-[#006aff]"
                : "text-[#2a2a33] hover:bg-[#f5f5f7]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <form onSubmit={onSearch} className="mx-auto flex min-w-0 max-w-xl flex-1">
        <div className="flex w-full overflow-hidden rounded-full border border-[#c3c3c8] bg-white shadow-sm focus-within:border-[#006aff] focus-within:ring-2 focus-within:ring-[#006aff]/30">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Digite um bairro, região ou endereço em Salvador"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-[#2a2a33] outline-none placeholder:text-[#8a8a93]"
            aria-label="Buscar região"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#006aff] text-white hover:bg-[#0058d6] disabled:opacity-60"
            aria-label="Buscar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </div>
      </form>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
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
    </header>
  );
}
