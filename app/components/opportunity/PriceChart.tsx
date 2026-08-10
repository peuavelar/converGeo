"use client";

import type { PriceHistoryPoint } from "../../types/region";
import { getSalvadorAvgPrecoM2 } from "../../services/regionsApi";

type Props = {
  data: PriceHistoryPoint[];
  regionName: string;
};

export default function PriceChart({ data, regionName }: Props) {
  if (!data.length) return null;
  const avg = getSalvadorAvgPrecoM2();
  const max = Math.max(...data.map((d) => d.precoM2), avg) * 1.05;
  const min = Math.min(...data.map((d) => d.precoM2), avg) * 0.92;
  const w = 280;
  const h = 120;
  const pad = 16;

  const x = (i: number) =>
    pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
  const y = (v: number) =>
    h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.precoM2)}`)
    .join(" ");
  const avgY = y(avg);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
      <p className="text-xs font-bold text-slate-800">Evolução do preço/m²</p>
      <p className="text-[10px] text-slate-400">
        {regionName} vs. média Salvador
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 w-full" role="img">
        <line
          x1={pad}
          x2={w - pad}
          y1={avgY}
          y2={avgY}
          stroke="#94a3b8"
          strokeDasharray="4 3"
          strokeWidth="1"
        />
        <path d={line} fill="none" stroke="#2563eb" strokeWidth="2.5" />
        {data.map((d, i) => (
          <circle key={d.year} cx={x(i)} cy={y(d.precoM2)} r="3" fill="#1d4ed8" />
        ))}
        {data.map((d, i) => (
          <text
            key={`y-${d.year}`}
            x={x(i)}
            y={h - 2}
            textAnchor="middle"
            className="fill-slate-400"
            fontSize="9"
          >
            {d.year}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex gap-3 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-3 bg-blue-600" /> Região
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-px w-3 border-t border-dashed border-slate-400" />{" "}
          Média Salvador
        </span>
      </div>
    </div>
  );
}
