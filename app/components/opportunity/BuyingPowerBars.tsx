"use client";

import type { RegionBudgetRow } from "../../types/region";

type Props = {
  budget: number;
  rows: RegionBudgetRow[];
  maxAreaM2: number;
  areaGainPct: number;
  onSelect?: (id: string) => void;
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BuyingPowerBars({
  budget,
  rows,
  maxAreaM2,
  areaGainPct,
  onSelect,
}: Props) {
  const top = rows.slice(0, 5);

  return (
    <section className="zg-card p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--zg-muted)]">
        Onde meu dinheiro compra mais?
      </p>
      <p className="mt-1 text-sm font-bold text-[var(--zg-navy)]">
        Orçamento {formatBRL(budget)}
      </p>

      <div className="mt-3 space-y-2.5">
        {top.map((r) => {
          const pct = maxAreaM2 > 0 ? (r.areaEstimadaM2 / maxAreaM2) * 100 : 0;
          return (
            <button
              key={r.regionId}
              type="button"
              onClick={() => onSelect?.(r.regionId)}
              className="block w-full text-left"
            >
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-[var(--zg-ink)]">
                  {r.regionName}
                </span>
                <span className="text-xs font-black tabular-nums text-[var(--zg-blue)]">
                  {r.areaEstimadaM2}m²
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--zg-canvas)]">
                <div
                  className="h-full rounded-full bg-[var(--zg-blue)] transition-all"
                  style={{ width: `${Math.max(8, pct)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {areaGainPct > 0 && (
        <p className="mt-3 rounded-xl bg-[var(--zg-blue-soft)] px-3 py-2 text-[11px] leading-snug text-[var(--zg-ink)]">
          Seu dinheiro compra até{" "}
          <strong className="text-[var(--zg-blue)]">{areaGainPct}% mais área</strong>{" "}
          em determinadas regiões.
        </p>
      )}
    </section>
  );
}
