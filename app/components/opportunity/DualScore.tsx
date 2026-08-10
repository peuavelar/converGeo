"use client";

type Props = {
  opportunityScore: number;
  matchScore: number;
  compact?: boolean;
};

export default function DualScore({
  opportunityScore,
  matchScore,
  compact = false,
}: Props) {
  if (compact) {
    return (
      <div className="flex gap-1.5 text-[11px]">
        <span className="rounded-full bg-[var(--zg-canvas)] px-2 py-0.5 font-bold text-[var(--zg-ink)]">
          Opp {opportunityScore}
        </span>
        <span className="rounded-full bg-[var(--zg-blue-soft)] px-2 py-0.5 font-bold text-[var(--zg-blue)]">
          Match {matchScore}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="zg-card p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--zg-muted)]">
          Opportunity Score
        </p>
        <p className="mt-1 text-2xl font-black tabular-nums text-[var(--zg-navy)]">
          {opportunityScore}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--zg-muted)]">
          Vale a pena comprar nessa região?
        </p>
      </div>
      <div className="rounded-xl border border-[var(--zg-blue)]/30 bg-[var(--zg-blue-soft)] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--zg-blue)]">
          Match Score
        </p>
        <p className="mt-1 text-2xl font-black tabular-nums text-[var(--zg-blue)]">
          {matchScore}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--zg-blue)]/80">
          Essa região é boa para você?
        </p>
      </div>
    </div>
  );
}
