"use client";

import type { ScoreBreakdown } from "../../types/region";
import { SCORE_FACTORS } from "../../utils/opportunity";

type Props = {
  breakdown: ScoreBreakdown;
};

export default function ScoreBreakdownBars({ breakdown }: Props) {
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2.5">
      <p className="text-xs font-bold text-slate-800">Composição do score</p>
      {SCORE_FACTORS.map((f) => {
        const value = breakdown[f.id];
        return (
          <div key={f.id}>
            <div className="mb-0.5 flex justify-between text-[11px]">
              <span className="font-medium text-slate-600">{f.title}</span>
              <span className="font-bold tabular-nums text-slate-900">
                {value}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
