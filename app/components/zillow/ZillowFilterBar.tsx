"use client";

import type { ImovelTool } from "../../utils/realEstate";
import { formatBRL } from "../../utils/realEstate";

type Props = {
  tool: ImovelTool;
  setTool: (t: ImovelTool) => void;
  budget: number;
  setBudget: (v: number) => void;
  quartos: number;
  setQuartos: (v: number) => void;
  onFind: () => void;
};

/** Painel compartilhado de filtros (preço + quartos). */
export function FilterPanelBody({
  budget,
  setBudget,
  quartos,
  setQuartos,
}: {
  budget: number;
  setBudget: (v: number) => void;
  quartos: number;
  setQuartos: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold text-[#6a6a72]">
          Orçamento máximo
        </p>
        <p className="mb-2 text-lg font-bold text-[#2a2a33]">
          {formatBRL(budget)}
        </p>
        <input
          type="range"
          min={200000}
          max={2000000}
          step={10000}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full accent-[#006aff]"
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-[#6a6a72]">Quartos</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuartos(n)}
              className={`flex-1 rounded-full py-2 text-xs font-bold ${
                quartos === n
                  ? "bg-[#006aff] text-white"
                  : "border border-[#c3c3c8] text-[#2a2a33]"
              }`}
            >
              {n === 4 ? "4+" : `${n}+`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Botão único "Filtro" com dropdown. */
export function FiltroPill({
  budget,
  setBudget,
  quartos,
  setQuartos,
  align = "left",
}: {
  budget: number;
  setBudget: (v: number) => void;
  quartos: number;
  setQuartos: (v: number) => void;
  align?: "left" | "right";
}) {
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full border border-[#c3c3c8] bg-white px-3.5 py-1.5 text-sm font-semibold text-[#2a2a33] hover:border-[#006aff] [&::-webkit-details-marker]:hidden">
        Filtro
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 text-[#6a6a72]"
          fill="currentColor"
        >
          <path d="M5.5 7.5 10 12l4.5-4.5" />
        </svg>
      </summary>
      <div
        className={`absolute top-full z-40 mt-1 min-w-[240px] rounded-xl border border-[#d1d1d5] bg-white p-3 shadow-xl ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        <FilterPanelBody
          budget={budget}
          setBudget={setBudget}
          quartos={quartos}
          setQuartos={setQuartos}
        />
      </div>
    </details>
  );
}

export default function ZillowFilterBar({
  tool,
  setTool,
  budget,
  setBudget,
  quartos,
  setQuartos,
  onFind,
}: Props) {
  return (
    <div className="z-20 flex h-12 shrink-0 items-center gap-2 overflow-x-auto border-b border-[#d1d1d5] bg-white px-4">
      <div className="flex items-center gap-1 rounded-full border border-[#c3c3c8] p-0.5">
        {(
          [
            { id: "orcamento" as const, label: "Para você" },
            { id: "rotas" as const, label: "Tempo de deslocamento" },
            { id: "explorar" as const, label: "Regiões" },
            { id: "comparar" as const, label: "Comparar" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTool(t.id)}
            className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${
              tool === t.id
                ? "bg-[#006aff] text-white"
                : "text-[#2a2a33] hover:bg-[#f5f5f7]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FiltroPill
        budget={budget}
        setBudget={setBudget}
        quartos={quartos}
        setQuartos={setQuartos}
      />

      <button
        type="button"
        onClick={onFind}
        className="ml-auto rounded-full bg-[#006aff] px-4 py-1.5 text-sm font-bold text-white hover:bg-[#0058d6] whitespace-nowrap"
      >
        Buscar
      </button>
    </div>
  );
}
