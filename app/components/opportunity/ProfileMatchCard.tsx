"use client";

import type { RegionBudgetRow } from "../../types/region";

type Props = {
  row: RegionBudgetRow;
  onSelect?: (id: string) => void;
};

export default function ProfileMatchCard({ row, onSelect }: Props) {
  return (
    <section className="zg-card border-[var(--zg-blue)]/25 bg-[var(--zg-blue-soft)]/40 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--zg-blue)]">
            Match Score
          </p>
          <p className="mt-0.5 text-3xl font-black tabular-nums text-[var(--zg-navy)]">
            {row.matchScore}
            <span className="text-base font-bold text-[var(--zg-muted)]">
              /100
            </span>
          </p>
          <p className="text-xs font-semibold text-[var(--zg-muted)]">
            Boa para o seu perfil · {row.regionName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect?.(row.regionId)}
          className="zg-btn-primary px-3 py-2 text-[11px]"
        >
          Ver no mapa
        </button>
      </div>

      <ul className="mt-3 space-y-1.5">
        {row.matchChecks.map((c) => (
          <li
            key={c.id}
            className={`flex items-center gap-2 text-xs font-medium ${
              c.ok ? "text-[var(--zg-ink)]" : "text-[var(--zg-muted)]"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                c.ok
                  ? "bg-[var(--zg-blue)] text-white"
                  : "bg-[var(--zg-line)] text-[var(--zg-muted)]"
              }`}
            >
              {c.ok ? "✓" : "·"}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
