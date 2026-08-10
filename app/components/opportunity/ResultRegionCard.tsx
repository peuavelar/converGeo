"use client";

import type { RegionBudgetRow } from "../../types/region";
import { formatPct } from "../../utils/opportunity";

type Props = {
  row: RegionBudgetRow;
  rank: number;
  onSelect?: (id: string) => void;
};

const MEDALS = ["🥇", "🥈", "🥉"];

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ResultRegionCard({ row, rank, onSelect }: Props) {
  const medal = MEDALS[rank] ?? `#${rank + 1}`;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(row.regionId)}
      className="zg-card group w-full overflow-hidden p-0 text-left"
    >
      <div className="flex">
        <div
          className="w-1.5 shrink-0 self-stretch"
          style={{
            background:
              rank === 0 ? "#006aff" : rank === 1 ? "#4d9aff" : "#a8cdff",
          }}
        />
        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--zg-muted)]">
                {medal} região
              </p>
              <h3 className="text-[15px] font-bold text-[var(--zg-navy)] group-hover:text-[var(--zg-blue)]">
                {row.regionName}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-[var(--zg-muted)]">
                Match
              </p>
              <p className="text-lg font-black tabular-nums text-[var(--zg-blue)]">
                {row.matchScore}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[var(--zg-canvas)] px-2 py-0.5 text-[11px] font-semibold text-[var(--zg-ink)]">
              ~{row.areaEstimadaM2} m²
            </span>
            <span className="rounded-full bg-[var(--zg-canvas)] px-2 py-0.5 text-[11px] font-semibold text-[var(--zg-ink)]">
              {formatBRL(row.precoM2)}/m²
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[var(--zg-success)]">
              {formatPct(row.valorizacao12m, 0)}
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-[var(--zg-line)] pt-2 text-[11px]">
            <span className="font-medium text-[var(--zg-muted)]">
              Opportunity{" "}
              <strong className="text-[var(--zg-ink)]">
                {row.opportunityScore}
              </strong>
            </span>
            <span className="font-semibold text-[var(--zg-blue)]">
              Ver no mapa →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
