"use client";

import type { RegionSummary } from "../../types/region";
import { formatPct, scoreCss } from "../../utils/opportunity";
import OpportunityScore from "./OpportunityScore";

type Props = {
  region: RegionSummary;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onCompareToggle?: (id: string) => void;
  comparing?: boolean;
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function RegionCard({
  region,
  selected,
  onSelect,
  onCompareToggle,
  comparing,
}: Props) {
  const accent = scoreCss(region.score);

  return (
    <article
      className={`rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md ${
        selected ? "border-blue-500 ring-1 ring-blue-200" : "border-slate-200"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect?.(region.id)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{region.name}</h3>
            <p className="mt-0.5 text-[11px] font-semibold" style={{ color: accent }}>
              Potencial: {region.potencial}
            </p>
          </div>
          <OpportunityScore score={region.score} size="sm" showLabel={false} />
        </div>

        <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div>
            <dt className="text-slate-400">Preço médio</dt>
            <dd className="font-semibold text-slate-800">
              {formatBRL(region.precoM2)}/m²
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Valorização</dt>
            <dd className="font-semibold text-emerald-700">
              {formatPct(region.valorizacao12m)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Oferta</dt>
            <dd className="font-semibold text-slate-800">{region.oferta}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Score</dt>
            <dd className="font-semibold text-slate-800">{region.score}/100</dd>
          </div>
        </dl>

        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-slate-500">
          {region.motivo}
        </p>
      </button>

      {onCompareToggle && (
        <button
          type="button"
          onClick={() => onCompareToggle(region.id)}
          className={`mt-2 w-full rounded-md px-2 py-1.5 text-[11px] font-semibold ${
            comparing
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {comparing ? "No comparador" : "Comparar"}
        </button>
      )}
    </article>
  );
}
