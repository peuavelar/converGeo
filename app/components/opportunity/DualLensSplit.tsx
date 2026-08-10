"use client";

import type { RegionBudgetRow } from "../../types/region";

type Props = {
  byBuyingPower: RegionBudgetRow[];
  byOpportunity: RegionBudgetRow[];
  onSelect?: (id: string) => void;
};

function LensCard({
  title,
  subtitle,
  rows,
  metric,
  onSelect,
}: {
  title: string;
  subtitle: string;
  rows: RegionBudgetRow[];
  metric: "area" | "opp";
  onSelect?: (id: string) => void;
}) {
  const top = rows.slice(0, 3);

  return (
    <div className="zg-card p-3">
      <p className="text-sm font-bold text-[var(--zg-navy)]">{title}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-[var(--zg-muted)]">
        {subtitle}
      </p>
      <ul className="mt-2 space-y-1.5">
        {top.map((r) => (
          <li key={r.regionId}>
            <button
              type="button"
              onClick={() => onSelect?.(r.regionId)}
              className="flex w-full items-center justify-between rounded-lg border border-[var(--zg-line)] bg-white px-2.5 py-2 text-left text-xs hover:border-[var(--zg-blue)]"
            >
              <span className="font-semibold text-[var(--zg-ink)]">
                {r.regionName}
              </span>
              <span className="font-bold tabular-nums text-[var(--zg-blue)]">
                {metric === "area"
                  ? `~${r.areaEstimadaM2}m²`
                  : `${r.opportunityScore}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DualLensSplit({
  byBuyingPower,
  byOpportunity,
  onSelect,
}: Props) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold text-[var(--zg-navy)]">
        Duas leituras importantes
      </h3>
      <p className="text-[11px] leading-snug text-[var(--zg-muted)]">
        Comprar mais área não é a mesma coisa que a melhor oportunidade.
      </p>
      <div className="grid grid-cols-1 gap-2">
        <LensCard
          title="Onde consigo comprar?"
          subtitle="Mais metros pelo mesmo orçamento."
          rows={byBuyingPower}
          metric="area"
          onSelect={onSelect}
        />
        <LensCard
          title="Onde vale mais a pena?"
          subtitle="Maior Opportunity Score da região."
          rows={byOpportunity}
          metric="opp"
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}
