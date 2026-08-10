"use client";

import type { RegionBudgetRow } from "../../types/region";

type Props = {
  rows: RegionBudgetRow[];
  onSelect?: (id: string) => void;
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BudgetRegionTable({ rows, onSelect }: Props) {
  const top = rows.slice(0, 6);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[300px] border-collapse text-left text-[11px]">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-2 py-2 font-semibold text-slate-500">Região</th>
            <th className="px-2 py-2 text-right font-semibold text-slate-500">
              Preço
            </th>
            <th className="px-2 py-2 text-right font-semibold text-slate-500">
              Área
            </th>
            <th className="px-2 py-2 text-right font-semibold text-slate-500">
              📈
            </th>
            <th className="px-2 py-2 text-right font-semibold text-slate-500">
              🎯
            </th>
          </tr>
        </thead>
        <tbody>
          {top.map((r) => (
            <tr
              key={r.regionId}
              className="border-t border-slate-100 hover:bg-blue-50/50"
            >
              <td className="px-2 py-2">
                <button
                  type="button"
                  onClick={() => onSelect?.(r.regionId)}
                  className="font-bold text-slate-900 hover:text-blue-700"
                >
                  {r.regionName}
                </button>
              </td>
              <td className="px-2 py-2 text-right tabular-nums text-slate-700">
                {formatBRL(r.precoM2)}
              </td>
              <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-900">
                {r.areaEstimadaM2}m²
              </td>
              <td className="px-2 py-2 text-right font-bold tabular-nums text-slate-800">
                {r.opportunityScore}
              </td>
              <td className="px-2 py-2 text-right font-bold tabular-nums text-blue-700">
                {r.matchScore}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
