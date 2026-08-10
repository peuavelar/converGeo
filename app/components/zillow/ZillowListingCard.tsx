"use client";

import type { RegionBudgetRow } from "../../types/region";
import { formatPct } from "../../utils/opportunity";

type Props = {
  row: RegionBudgetRow;
  rank: number;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Card no formato listing do Zillow (foto + preço + fatos). */
export default function ZillowListingCard({
  row,
  rank,
  selected,
  onSelect,
}: Props) {
  const hues = [210, 200, 190, 180, 170, 160, 150, 140];
  const hue = hues[rank % hues.length];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(row.regionId)}
      className={`w-full overflow-hidden rounded-xl border bg-white text-left transition hover:shadow-lg ${
        selected
          ? "border-[#006aff] shadow-md ring-2 ring-[#006aff]/25"
          : "border-[#d1d1d5] shadow-sm"
      }`}
    >
      <div
        className="relative h-36 w-full"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${hue + 20} 45% 28%))`,
        }}
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=40')] bg-cover bg-center opacity-50 mix-blend-overlay" />
        <div className="absolute left-2 top-2 rounded bg-white/95 px-2 py-0.5 text-[11px] font-bold text-[#2a2a33]">
          Match {row.matchScore}
        </div>
        <div className="absolute bottom-2 left-2 rounded bg-[#006aff] px-2 py-0.5 text-[11px] font-bold text-white">
          Opp {row.opportunityScore}
        </div>
      </div>

      <div className="p-3">
        <p className="text-xl font-bold tabular-nums text-[#2a2a33]">
          {formatBRL(row.precoM2)}
          <span className="text-sm font-semibold text-[#6a6a72]">/m²</span>
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[#2a2a33]">
          {row.regionName}, Salvador
        </p>
        <p className="mt-1 text-xs text-[#6a6a72]">
          <span className="font-semibold text-[#2a2a33]">
            ~{row.areaEstimadaM2}
          </span>{" "}
          m² · Valorização{" "}
          <span className="font-semibold text-[#1a7f37]">
            {formatPct(row.valorizacao12m, 0)}
          </span>{" "}
          · {row.estimatedOptions} opções est.
        </p>
      </div>
    </button>
  );
}
