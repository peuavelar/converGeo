"use client";

import { useState } from "react";
import ScoreProgressBar from "../ScoreProgressBar";
import { METRIC_LABELS, type Neighborhood } from "../../data/neighborhoods";
import {
  formatBRL,
  livabilityScore,
  metricTone,
  priceIndexForBudget,
  referencePrice,
  toneClass,
  type PropertyType,
} from "../../utils/realEstate";

type Props = {
  neighborhood: Neighborhood;
  budget: number;
  propertyType: PropertyType;
};

export default function ViewNeighborhood({
  neighborhood,
  budget,
  propertyType,
}: Props) {
  const [showMetrics, setShowMetrics] = useState(false);
  const score = livabilityScore(neighborhood);
  const index = priceIndexForBudget(neighborhood, budget, propertyType);
  const price = referencePrice(neighborhood, propertyType);

  return (
    <div className="mt-3 space-y-3 animate-fade-in">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <p className="text-xs font-semibold text-slate-500">Bairro</p>
        <h3 className="text-lg font-extrabold text-slate-900">
          {neighborhood.name}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
          <p className="text-xs font-semibold text-slate-500">Qualidade de vida</p>
          <p className="mt-0.5 text-2xl font-black text-slate-900">
            {score.toFixed(1)}
            <span className="text-sm font-semibold text-slate-400">/10</span>
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-2.5">
          <p className="text-xs font-semibold text-slate-500">Preço estimado</p>
          <p className="mt-0.5 text-base font-black text-blue-700">
            {formatBRL(price)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-2.5">
        <p className="text-xs font-semibold text-slate-500">
          Em relação ao seu orçamento
        </p>
        <p className="mt-0.5 text-sm font-bold text-slate-900">
          {index <= 100 ? "Cabe no orçamento" : "Acima do orçamento"}
          <span className="ml-1.5 font-semibold text-slate-500">
            (índice {index})
          </span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatBRL(neighborhood.precoM2)} por m²
        </p>
      </div>

      <details
        open={showMetrics}
        onToggle={(e) => setShowMetrics((e.target as HTMLDetailsElement).open)}
        className="rounded-lg border border-slate-200 bg-white p-2.5"
      >
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          Ver indicadores do bairro
        </summary>
        <div className="mt-3 space-y-2">
          {(
            [
              "consumo",
              "transporte",
              "educacao",
              "seguranca",
              "rouboFurto",
            ] as const
          ).map((key) => {
            const value = neighborhood.metrics[key];
            const tone = metricTone(key, value);
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {METRIC_LABELS[key]}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-bold ${toneClass(tone)}`}
                  >
                    {value.toFixed(1)}
                  </span>
                </div>
                <ScoreProgressBar
                  label=""
                  value={key === "rouboFurto" ? 10 - value : value}
                  colorClass={
                    key === "rouboFurto"
                      ? "bg-rose-500"
                      : key === "seguranca"
                        ? "bg-emerald-500"
                        : key === "educacao"
                          ? "bg-indigo-500"
                          : key === "transporte"
                            ? "bg-sky-500"
                            : "bg-amber-500"
                  }
                />
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
