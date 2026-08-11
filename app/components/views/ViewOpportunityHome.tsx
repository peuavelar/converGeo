"use client";

import { useEffect, useState } from "react";
import {
  getRanking,
  searchRegions,
} from "../../services/regionsApi";
import type { RegionSummary } from "../../types/region";
import OpportunityHero from "../opportunity/OpportunityHero";
import RegionRanking from "../opportunity/RegionRanking";

type Props = {
  activeRegionId: string | null;
  compareIds: string[];
  onSelectRegion: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onClearRegion: () => void;
};

export default function ViewOpportunityHome({
  activeRegionId,
  onSelectRegion,
}: Props) {
  const [ranking, setRanking] = useState<RegionSummary[]>([]);

  useEffect(() => {
    getRanking(8).then(setRanking);
  }, []);

  return (
    <div className="mt-3 space-y-3 animate-fade-in pb-2">
      <OpportunityHero
        onSelectRegion={onSelectRegion}
        rankingHint={ranking.slice(0, 5).map((r) => r.name)}
      />

      <RegionRanking
        regions={ranking}
        selectedId={activeRegionId}
        onSelect={onSelectRegion}
        defaultOpen={false}
      />

      <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] leading-snug text-slate-500">
        O ranking mostra onde há mais oportunidade. Para preço, valorização e
        análise completa, converse com o Sino Mobile.
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
