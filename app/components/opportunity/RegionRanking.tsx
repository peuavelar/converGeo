"use client";

import type { RegionSummary } from "../../types/region";
import RegionCard from "./RegionCard";

type Props = {
  regions: RegionSummary[];
  selectedId?: string | null;
  compareIds?: string[];
  onSelect: (id: string) => void;
  onCompareToggle?: (id: string) => void;
};

export default function RegionRanking({
  regions,
  selectedId,
  compareIds = [],
  onSelect,
  onCompareToggle,
}: Props) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-base" aria-hidden>
          🔥
        </span>
        <h2 className="text-sm font-bold text-slate-900">
          Regiões com maior oportunidade
        </h2>
      </div>
      <div className="space-y-2">
        {regions.map((r) => (
          <RegionCard
            key={r.id}
            region={r}
            selected={selectedId === r.id}
            comparing={compareIds.includes(r.id)}
            onSelect={onSelect}
            onCompareToggle={onCompareToggle}
          />
        ))}
      </div>
    </section>
  );
}
