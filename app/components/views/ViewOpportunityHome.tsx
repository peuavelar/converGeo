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
    <div className="flex min-h-0 flex-1 flex-col gap-3 animate-fade-in px-3 pb-3 pt-2">
      <div className="shrink-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-[#e8f1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#006aff]">
            Regiões
          </span>
          <span className="text-[11px] font-medium text-[#6a6a72]">
            Explore oportunidades em Salvador
          </span>
        </div>
      </div>

      <OpportunityHero onSelectRegion={onSelectRegion} />

      <RegionRanking
        regions={ranking}
        selectedId={activeRegionId}
        onSelect={onSelectRegion}
        defaultOpen={false}
      />

      <p className="rounded-lg border border-[#eef1f6] bg-[#f8fafc] px-3 py-2 text-[11px] leading-snug text-[#6a6a72]">
        Informe bairro, orçamento e perfil no chat. O Sino devolve preço,
        infraestrutura e oportunidade.
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
