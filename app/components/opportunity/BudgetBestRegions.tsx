"use client";

import type { RegionBudgetRow } from "../../types/region";

type Props = {
  rows: RegionBudgetRow[];
  onSelect?: (id: string) => void;
};

export default function BudgetBestRegions({ rows, onSelect }: Props) {
  const top = rows.slice(0, 3);

  return (
    <section>
      <h3 className="mb-2 text-sm font-bold text-slate-900">
        🎯 Melhores regiões para o seu orçamento
      </h3>
      <ol className="space-y-2">
        {top.map((r, i) => (
          <li key={r.regionId}>
            <button
              type="button"
              onClick={() => onSelect?.(r.regionId)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-blue-300 hover:shadow-sm"
            >
              <p className="text-sm font-extrabold text-slate-900">
                {i + 1}. {r.regionName}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
                📈 Opportunity {r.opportunityScore} · 🎯 Match {r.matchScore}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-slate-600">
                {r.reason}
              </p>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
