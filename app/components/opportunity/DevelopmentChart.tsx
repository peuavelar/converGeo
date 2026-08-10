"use client";

import type { DevelopmentHistoryPoint } from "../../types/region";

type Props = {
  data: DevelopmentHistoryPoint[];
};

const SERIES: {
  key: keyof Omit<DevelopmentHistoryPoint, "year">;
  label: string;
  color: string;
}[] = [
  { key: "empresas", label: "Empresas", color: "#2563eb" },
  { key: "populacao", label: "População", color: "#059669" },
  { key: "empreendimentos", label: "Empreendimentos", color: "#d97706" },
  { key: "oferta", label: "Oferta", color: "#7c3aed" },
];

export default function DevelopmentChart({ data }: Props) {
  if (!data.length) return null;
  const w = 280;
  const h = 130;
  const pad = 16;

  const normalize = (key: (typeof SERIES)[number]["key"]) => {
    const vals = data.map((d) => d[key]);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    return vals.map((v) => (v - min) / (max - min || 1));
  };

  const x = (i: number) =>
    pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
  const y = (t: number) => h - pad - t * (h - pad * 2);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
      <p className="text-xs font-bold text-slate-800">Desenvolvimento da região</p>
      <p className="text-[10px] text-slate-400">
        Empresas, população, empreendimentos e oferta
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 w-full" role="img">
        {SERIES.map((s) => {
          const pts = normalize(s.key);
          const d = pts
            .map((t, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(t)}`)
            .join(" ");
          return (
            <path
              key={s.key}
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
            />
          );
        })}
        {data.map((d, i) => (
          <text
            key={d.year}
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
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1">
            <span
              className="h-0.5 w-3"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
