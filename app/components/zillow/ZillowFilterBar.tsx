"use client";

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
  onFind: () => void;
};

export default function ZillowFilterBar({
  tool,
  setTool,
  filters,
  setFilters,
  onFind,
}: Props) {
  return (
    <div className="relative z-30 flex h-10 shrink-0 items-center gap-1 border-b border-[#d1d1d5] bg-white px-2 sm:h-11 sm:gap-1.5 sm:px-3">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      <FiltroPill value={filters} onChange={setFilters} compact label="Filtro" />

      <button
        type="button"
        onClick={onFind}
        className="hidden shrink-0 rounded-full bg-[#006aff] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0058d6] sm:inline-flex"
      >
        Buscar
      </button>
    </div>
  );
}
