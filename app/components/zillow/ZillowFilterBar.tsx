"use client";

import type { FormEvent } from "react";
import { useTypewriterPlaceholder } from "../../hooks/useTypewriterPlaceholder";
import type { ImovelTool } from "../../utils/realEstate";
import {
  FiltroPill,
  type AdvancedFilters,
} from "./FiltroSheet";

export {
  FiltroPill,
  countActiveAdvancedFilters,
  countActiveQuickFilters,
  type AdvancedFilters,
  type QuickFilterValues,
} from "./FiltroSheet";

type Props = {
  tool: ImovelTool;
  setTool: (t: ImovelTool) => void;
  filters: AdvancedFilters;
  setFilters: (v: AdvancedFilters) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSearch: (e: FormEvent) => void;
  isSearching: boolean;
};

export default function ZillowFilterBar({
  tool,
  setTool,
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  onSearch,
  isSearching,
}: Props) {
  const typedPlaceholder = useTypewriterPlaceholder(
    "Busque um endereço",
    tool,
  );
  const showTyped = !searchQuery;

  return (
    <div className="relative z-30 flex shrink-0 flex-col gap-1.5 border-b border-[#d1d1d5] bg-white px-2 py-1.5 sm:px-3 md:h-12 md:flex-row md:items-center md:gap-2 md:py-0">
      <div className="flex min-w-0 items-center gap-1">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-none">
          {(
            [
              { id: "orcamento" as const, label: "Para você" },
              { id: "rotas" as const, label: "Tempo" },
              { id: "explorar" as const, label: "Regiões" },
              { id: "comparar" as const, label: "Comparar" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTool(t.id)}
              className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap sm:px-3 sm:text-xs ${
                tool === t.id
                  ? "bg-[#006aff] text-white"
                  : "bg-[#f5f5f7] text-[#2a2a33] hover:bg-[#e8e8ed]"
              }`}
            >
              {t.id === "rotas" ? (
                <>
                  <span className="lg:hidden">Tempo</span>
                  <span className="hidden lg:inline">Tempo de deslocamento</span>
                </>
              ) : (
                t.label
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto shrink-0 md:hidden">
          <FiltroPill value={filters} onChange={setFilters} compact label="Filtro" />
        </div>
      </div>

      <form
        onSubmit={onSearch}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <div className="group flex min-w-0 flex-1 items-center gap-2 rounded-md border border-transparent bg-transparent px-1.5 py-1 transition-[border-color,box-shadow,background-color] duration-200 ease-out hover:bg-[#f5f5f7]/80 focus-within:border-[#006aff] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(0,106,255,0.18)]">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 text-[#8a8a93] transition-colors duration-200 group-focus-within:text-[#006aff]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <div className="relative min-w-0 flex-1">
            {showTyped && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center text-sm text-[#8a8a93]"
              >
                {typedPlaceholder}
                <span className="ml-px inline-block h-4 w-px animate-pulse bg-[#006aff]/70" />
              </span>
            )}
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=""
              className="relative z-[1] min-w-0 w-full bg-transparent py-1 text-sm text-[#2a2a33] outline-none md:py-1.5"
              aria-label="Busque um endereço"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold text-[#006aff] transition-opacity duration-150 hover:bg-[#e8f1ff] disabled:pointer-events-none disabled:opacity-0"
            aria-label="Buscar"
          >
            Buscar
          </button>
        </div>

        <div className="hidden shrink-0 md:block">
          <FiltroPill value={filters} onChange={setFilters} compact label="Filtro" />
        </div>
      </form>
    </div>
  );
}
