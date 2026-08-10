"use client";

import { useEffect, useMemo, useState } from "react";
import type { BuyerAmenity, BuyerProfile } from "../../types/region";
import {
  BUYER_AMENITIES,
  analyzeBudgetRegions,
} from "../../utils/budgetAnalysis";
import { formatBRL, RESIDENTIAL_PROPERTY_TYPES } from "../../utils/realEstate";
import ZillowListingCard from "../zillow/ZillowListingCard";
import DualScore from "../opportunity/DualScore";
import BuyingPowerBars from "../opportunity/BuyingPowerBars";

type Props = {
  budget: number;
  setBudget: (v: number) => void;
  quartos: number;
  setQuartos: (v: number) => void;
  triggerSearch: number;
  onSelectRegion: (id: string) => void;
  onHighlightRegions?: (ids: string[]) => void;
  selectedRegionId?: string | null;
};

export default function ViewBudgetFirst({
  budget,
  setBudget,
  quartos,
  setQuartos,
  triggerSearch,
  onSelectRegion,
  onHighlightRegions,
  selectedRegionId,
}: Props) {
  const [step, setStep] = useState<"form" | "results">("form");
  const [propertyType, setPropertyType] = useState("apartamento");
  const [areaMin, setAreaMin] = useState(60);
  const [amenities, setAmenities] = useState<BuyerAmenity[]>([
    "Elevador",
    "Portaria",
    "Garagem",
  ]);
  const [preference, setPreference] = useState(55);
  const [submitted, setSubmitted] = useState<BuyerProfile | null>(null);

  const draft: BuyerProfile = useMemo(
    () => ({
      budget,
      propertyType,
      quartos,
      areaMin,
      amenities,
      preference,
    }),
    [budget, propertyType, quartos, areaMin, amenities, preference],
  );

  const analysis = useMemo(
    () => (submitted ? analyzeBudgetRegions(submitted) : null),
    [submitted],
  );

  const runSearch = () => {
    const profile = { ...draft, budget, quartos };
    setSubmitted(profile);
    setStep("results");
    const next = analyzeBudgetRegions(profile);
    onHighlightRegions?.(next.matches.map((m) => m.regionId));
  };

  useEffect(() => {
    if (triggerSearch > 0) runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSearch]);

  const toggleAmenity = (a: BuyerAmenity) => {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  };

  if (step === "results" && analysis) {
    const list = analysis.matches.slice(0, 8);
    return (
      <div className="animate-fade-in">
        <div className="sticky top-0 z-10 border-b border-[#d1d1d5] bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-[#2a2a33]">
                {list.length} regiões em Salvador, BA
              </p>
              <p className="text-xs text-[#6a6a72]">
                {formatBRL(analysis.profile.budget)} · {analysis.profileSummary}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                onHighlightRegions?.([]);
              }}
              className="text-xs font-semibold text-[#006aff] hover:underline"
            >
              Editar
            </button>
          </div>
        </div>

        <div className="space-y-3 p-3">
          {list.map((row, i) => (
            <ZillowListingCard
              key={row.regionId}
              row={row}
              rank={i}
              selected={selectedRegionId === row.regionId}
              onSelect={onSelectRegion}
            />
          ))}

          {analysis.topMatch && (
            <div className="space-y-3 pt-2">
              <DualScore
                opportunityScore={analysis.topMatch.opportunityScore}
                matchScore={analysis.topMatch.matchScore}
              />
              <BuyingPowerBars
                budget={analysis.profile.budget}
                rows={analysis.byBuyingPower}
                maxAreaM2={analysis.maxAreaM2}
                areaGainPct={analysis.areaGainPct}
                onSelect={onSelectRegion}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4">
      <h2 className="text-2xl font-bold tracking-tight text-[#2a2a33]">
        Encontre onde seu dinheiro compra melhor
      </h2>
      <p className="mt-1 text-sm text-[#6a6a72]">
        Salvador, BA · filtre pelo seu perfil e veja as regiões no mapa
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#6a6a72]">
            Orçamento
          </p>
          <p className="text-2xl font-bold text-[#2a2a33]">{formatBRL(budget)}</p>
          <input
            type="range"
            min={200000}
            max={2000000}
            step={10000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-2 w-full accent-[#006aff]"
          />
        </div>

        <label className="block text-xs font-bold uppercase tracking-wide text-[#6a6a72]">
          Tipo
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#c3c3c8] px-3 py-2.5 text-sm font-semibold text-[#2a2a33] outline-none focus:border-[#006aff]"
          >
            {RESIDENTIAL_PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#6a6a72]">
            Quartos
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQuartos(n)}
                className={`flex-1 rounded-full border py-2.5 text-sm font-bold ${
                  quartos === n
                    ? "border-[#006aff] bg-[#e8f1ff] text-[#006aff]"
                    : "border-[#c3c3c8] text-[#2a2a33]"
                }`}
              >
                {n === 4 ? "4+" : n}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-xs font-bold uppercase tracking-wide text-[#6a6a72]">
          Área mínima (m²)
          <input
            type="number"
            min={30}
            max={300}
            value={areaMin}
            onChange={(e) => setAreaMin(Number(e.target.value) || 60)}
            className="mt-1 w-full rounded-lg border border-[#c3c3c8] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#006aff]"
          />
        </label>

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#6a6a72]">
            Características
          </p>
          <div className="flex flex-wrap gap-2">
            {BUYER_AMENITIES.map((a) => {
              const on = amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    on
                      ? "border-[#006aff] bg-[#e8f1ff] text-[#006aff]"
                      : "border-[#c3c3c8] text-[#2a2a33]"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs font-bold text-[#6a6a72]">
            <span>Preço</span>
            <span>Valorização</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={preference}
            onChange={(e) => setPreference(Number(e.target.value))}
            className="w-full accent-[#006aff]"
          />
        </div>

        <button
          type="button"
          onClick={runSearch}
          className="w-full rounded-full bg-[#006aff] py-3.5 text-sm font-bold text-white hover:bg-[#0058d6]"
        >
          Encontrar oportunidades
        </button>
      </div>
    </div>
  );
}
