"use client";

import { useEffect, useState } from "react";
import { getBudgetOpportunities } from "../../services/regionsApi";
import type { BudgetOpportunity } from "../../types/region";
import PropertyOpportunityCard from "./PropertyOpportunityCard";

const AMENITY_OPTS = ["Elevador", "Portaria", "Garagem", "Varanda"];

type Props = {
  regionId?: string;
  regionName?: string;
  initialBudget?: number;
  onSelectRegion?: (id: string) => void;
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BudgetSimulator({
  regionId,
  regionName,
  initialBudget = 500000,
  onSelectRegion,
}: Props) {
  const [budget, setBudget] = useState(initialBudget);
  const [quartos, setQuartos] = useState(2);
  const [amenities, setAmenities] = useState<string[]>(["Elevador", "Garagem"]);
  const [localOptions, setLocalOptions] = useState(0);
  const [alts, setAlts] = useState<BudgetOpportunity[]>([]);

  useEffect(() => {
    let cancelled = false;
    getBudgetOpportunities(budget, quartos, amenities).then((res) => {
      if (cancelled) return;
      setAlts(res.alternatives);
      setLocalOptions(regionId ? res.optionsInRegion(regionId) : 0);
    });
    return () => {
      cancelled = true;
    };
  }, [budget, quartos, amenities, regionId]);

  const toggle = (a: string) => {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  return (
    <section className="space-y-2.5">
      <h2 className="text-sm font-bold text-slate-900">
        O que você consegue comprar nessa região?
      </h2>

      <label className="block text-xs font-semibold text-slate-600">
        Meu orçamento
        <input
          type="range"
          min={200000}
          max={2000000}
          step={10000}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="mt-1 w-full accent-blue-600"
        />
        <span className="mt-0.5 block text-base font-extrabold text-slate-900">
          {formatBRL(budget)}
        </span>
      </label>

      <div>
        <p className="mb-1 text-xs font-semibold text-slate-600">Quartos</p>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuartos(n)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                quartos === n
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold text-slate-600">
          Características
        </p>
        <div className="space-y-1">
          {AMENITY_OPTS.map((a) => (
            <label
              key={a}
              className="flex items-center gap-2 text-xs text-slate-700"
            >
              <input
                type="checkbox"
                checked={amenities.includes(a)}
                onChange={() => toggle(a)}
                className="rounded border-slate-300"
              />
              {a}
            </label>
          ))}
        </div>
      </div>

      {regionName && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs leading-snug text-slate-700">
          Com {formatBRL(budget)}, você encontra aproximadamente{" "}
          <strong>{localOptions} opções</strong> dentro desses critérios em{" "}
          <strong>{regionName}</strong>.
        </p>
      )}

      <div>
        <p className="mb-1.5 text-xs font-bold text-slate-800">
          Com {formatBRL(budget)}
        </p>
        <p className="mb-2 text-[11px] text-slate-500">
          Onde o mesmo orçamento compra mais área e oportunidade.
        </p>
        <div className="space-y-1.5">
          {alts.map((a) => (
            <PropertyOpportunityCard
              key={a.regionId}
              item={a}
              onSelect={onSelectRegion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
