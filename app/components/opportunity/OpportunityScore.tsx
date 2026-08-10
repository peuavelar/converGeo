"use client";

import { bandLabel, scoreCss } from "../../utils/opportunity";
import type { OpportunityBand } from "../../types/region";

type Props = {
  score: number;
  band?: OpportunityBand;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

export default function OpportunityScore({
  score,
  band,
  size = "md",
  showLabel = true,
}: Props) {
  const color = scoreCss(score);
  const dim =
    size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-14 w-14 text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex ${dim} shrink-0 items-center justify-center rounded-full border-4 bg-white font-extrabold tabular-nums`}
        style={{ borderColor: color, color }}
        aria-label={`Score ${score} de 100`}
      >
        {score}
      </div>
      {showLabel && (
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Score
          </p>
          <p className="text-sm font-bold text-slate-900">
            {score}
            <span className="font-medium text-slate-400">/100</span>
          </p>
          {band && (
            <p className="text-xs font-semibold" style={{ color }}>
              {bandLabel(band)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
