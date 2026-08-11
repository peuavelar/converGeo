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
  /** Características vindas do modal Filtros (barra superior). */
  advancedAmenities?: string[];
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
  advancedAmenities = [],
  triggerSearch,
  onSelectRegion,
  onHighlightRegions,
  selectedRegionId,
}: Props) {
  const [step, setStep] = useState<"form" | "results">("form");
  const [propertyType, setPropertyType] = useState("apartamento");
  const [areaMin, setAreaMin] = useState(60);
  const [preference, setPreference] = useState(55);
  const [submitted, setSubmitted] = useState<BuyerProfile | null>(null);

  const amenities = useMemo(
    () =>
      advancedAmenities.filter((a): a is BuyerAmenity =>
        (BUYER_AMENITIES as readonly string[]).includes(a),
      ),
    [advancedAmenities],
  );

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

  if (step === "results" && analysis) {
    const list = analysis.matches.slice(0, 8);
    return (
      <div className="min-h-full animate-fade-in bg-white">
        <div className="sticky top-0 z-10 border-b border-[#d1d1d5] bg-white px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#2a2a33]">
                {list.length} regiões em Salvador, BA
              </p>
              <p className="truncate text-xs text-[#6a6a72]">
                {formatBRL(analysis.profile.budget)} · {analysis.profileSummary}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                onHighlightRegions?.([]);
              }}
              className="shrink-0 text-xs font-semibold text-[#006aff] hover:underline"
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
    <div className="flex min-h-0 flex-1 flex-col animate-fade-in overflow-x-hidden bg-white px-3 pb-3 pt-2">
      <h2 className="text-[0.95rem] font-bold leading-snug tracking-tight text-[#2a2a33] sm:text-lg">
        Encontre onde seu dinheiro compra melhor
      </h2>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3.5">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#6a6a72]">
            Orçamento
          </p>
          <p className="text-base font-bold tabular-nums text-[#2a2a33]">
            {formatBRL(budget)}
          </p>
          <input
            type="range"
            min={200000}
            max={2000000}
            step={10000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-1.5 w-full accent-[#006aff]"
          />
        </div>

        <label className="block min-w-0 text-[11px] font-bold uppercase tracking-wide text-[#6a6a72]">
          Tipo
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="mt-1 w-full max-w-full rounded-lg border border-[#c3c3c8] px-2.5 py-2 text-sm font-semibold text-[#2a2a33] outline-none focus:border-[#006aff]"
          >
            {RESIDENTIAL_PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="min-w-0">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#6a6a72]">
            Quartos
          </p>
          <div className="grid w-full min-w-0 grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQuartos(n)}
                className={`min-w-0 rounded-full border py-2 text-xs font-bold ${
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

        <label className="block min-w-0 text-[11px] font-bold uppercase tracking-wide text-[#6a6a72]">
          Área mínima (m²)
          <input
            type="number"
            min={30}
            max={300}
            value={areaMin}
            onChange={(e) => setAreaMin(Number(e.target.value) || 60)}
            className="mt-1 w-full max-w-full rounded-lg border border-[#c3c3c8] px-2.5 py-2 text-sm font-semibold outline-none focus:border-[#006aff]"
          />
        </label>

        {amenities.length > 0 && (
          <p className="rounded-lg border border-[#e8f1ff] bg-[#f5f9ff] px-2.5 py-1.5 text-[10px] leading-snug text-[#3a5a8a]">
            Características via <strong>Filtros</strong>: {amenities.join(", ")}.
          </p>
        )}

        <div>
          <div className="mb-1 flex justify-between text-[11px] font-bold text-[#6a6a72]">
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
          className="mt-1 w-full rounded-full bg-[#006aff] py-2.5 text-sm font-bold text-white hover:bg-[#0058d6]"
        >
          Encontrar oportunidades
        </button>
      </div>
    </div>
  );
}
