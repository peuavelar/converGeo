"use client";

import type { BudgetOpportunity } from "../../types/region";

type Props = {
  item: BudgetOpportunity;
  onSelect?: (id: string) => void;
};

export default function PropertyOpportunityCard({ item, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.regionId)}
      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:border-blue-300 hover:bg-blue-50/40"
    >
      <div>
        <p className="text-sm font-bold text-slate-900">{item.regionName}</p>
        <p className="text-[11px] text-slate-500">{item.propertyLabel}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-blue-700">{item.score}/100</p>
        <p className="text-[10px] text-slate-400">
          ~{item.estimatedOptions} opções
        </p>
      </div>
    </button>
  );
}
