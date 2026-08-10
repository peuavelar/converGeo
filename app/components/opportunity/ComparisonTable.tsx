"use client";

import type { RegionDetail } from "../../types/region";
import { formatPct, scoreCss } from "../../utils/opportunity";

type Props = {
  regions: RegionDetail[];
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

function bestIdx(values: number[], higherIsBetter = true) {
  if (!values.length) return -1;
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (higherIsBetter ? values[i] > values[best] : values[i] < values[best]) {
      best = i;
    }
  }
  return best;
}

export default function ComparisonTable({ regions }: Props) {
  if (regions.length < 2) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-600">
        Selecione 2 ou 3 bairros para comparar.
      </p>
    );
  }

  const rows: {
    label: string;
    values: (string | number)[];
    numeric: number[];
    higherIsBetter?: boolean;
  }[] = [
    {
      label: "Score",
      values: regions.map((r) => r.score),
      numeric: regions.map((r) => r.score),
    },
    {
      label: "Preço/m²",
      values: regions.map((r) => formatBRL(r.precoM2)),
      numeric: regions.map((r) => r.precoM2),
      higherIsBetter: false,
    },
    {
      label: "Valorização",
      values: regions.map((r) => formatPct(r.valorizacao12m, 0)),
      numeric: regions.map((r) => r.valorizacao12m),
    },
    {
      label: "Lançamentos",
      values: regions.map((r) => r.indicators.lancamentos),
      numeric: regions.map((r) => r.indicators.lancamentos),
    },
    {
      label: "Infraestrutura",
      values: regions.map((r) => r.breakdown.infraestrutura),
      numeric: regions.map((r) => r.breakdown.infraestrutura),
    },
    {
      label: "Oferta",
      values: regions.map((r) => r.oferta),
      numeric: regions.map((r) =>
        r.oferta === "Alta" ? 3 : r.oferta === "Média" ? 2 : 1,
      ),
    },
  ];

  const title = regions.map((r) => r.name).join(" vs. ");

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-slate-900">Compare regiões</h2>
      <p className="mb-2 text-xs font-semibold text-slate-500">{title}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[280px] border-collapse text-left text-[11px]">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-2 py-2 font-semibold text-slate-500">Indicador</th>
              {regions.map((r) => (
                <th
                  key={r.id}
                  className="px-2 py-2 text-right font-bold text-slate-800"
                >
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hi = bestIdx(row.numeric, row.higherIsBetter !== false);
              return (
                <tr key={row.label} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-medium text-slate-600">
                    {row.label}
                  </td>
                  {row.values.map((v, i) => (
                    <td
                      key={`${row.label}-${i}`}
                      className={`px-2 py-2 text-right tabular-nums ${
                        i === hi
                          ? "font-bold text-emerald-700"
                          : "font-semibold text-slate-800"
                      }`}
                      style={
                        row.label === "Score" && typeof v === "number"
                          ? { color: scoreCss(v) }
                          : undefined
                      }
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
