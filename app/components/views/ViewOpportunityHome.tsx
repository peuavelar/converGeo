"use client";

import { useEffect, useState } from "react";
import {
  compareRegions,
  getRanking,
  getRegionById,
  searchRegions,
} from "../../services/regionsApi";
import type { RegionDetail, RegionSummary } from "../../types/region";
import OpportunityHero from "../opportunity/OpportunityHero";
import RegionRanking from "../opportunity/RegionRanking";
import ScoreFactors from "../opportunity/ScoreFactors";
import ComparisonTable from "../opportunity/ComparisonTable";
import RegionAnalysis from "../opportunity/RegionAnalysis";

type Props = {
  activeRegionId: string | null;
  compareIds: string[];
  onSelectRegion: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onClearRegion: () => void;
};

export default function ViewOpportunityHome({
  activeRegionId,
  compareIds,
  onSelectRegion,
  onToggleCompare,
  onClearRegion,
}: Props) {
  const [ranking, setRanking] = useState<RegionSummary[]>([]);
  const [detail, setDetail] = useState<RegionDetail | null>(null);
  const [compareDetails, setCompareDetails] = useState<RegionDetail[]>([]);

  useEffect(() => {
    getRanking(6).then(setRanking);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!activeRegionId) {
      setDetail(null);
      return;
    }
    getRegionById(activeRegionId).then((r) => {
      if (!cancelled) setDetail(r);
    });
    return () => {
      cancelled = true;
    };
  }, [activeRegionId]);

  useEffect(() => {
    compareRegions(compareIds).then(setCompareDetails);
  }, [compareIds]);

  if (detail) {
    return (
      <RegionAnalysis
        region={detail}
        onBack={onClearRegion}
        onSelectRegion={onSelectRegion}
      />
    );
  }

  return (
    <div className="mt-3 space-y-4 animate-fade-in">
      <OpportunityHero onSelectRegion={onSelectRegion} />

      <RegionRanking
        regions={ranking}
        selectedId={activeRegionId}
        compareIds={compareIds}
        onSelect={onSelectRegion}
        onCompareToggle={onToggleCompare}
      />

      <ScoreFactors />

      <ComparisonTable regions={compareDetails} />

      <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-500">
        Não estamos apenas mostrando imóveis. Ajudamos a descobrir onde o
        dinheiro compra mais e onde existe maior potencial de valorização.
      </p>
    </div>
  );
}

/** Resolve texto de busca para o primeiro id de região (mock). */
export async function resolveRegionFromQuery(
  query: string,
): Promise<string | null> {
  const hits = await searchRegions(query);
  return hits[0]?.id ?? null;
}
