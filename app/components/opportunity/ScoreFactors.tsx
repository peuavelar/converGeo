"use client";

import { SCORE_FACTORS } from "../../utils/opportunity";

export default function ScoreFactors() {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-slate-900">
        Como calculamos a oportunidade?
      </h2>
      <p className="mb-2 text-xs text-slate-500">
        O Score combina preço, valorização, desenvolvimento, infraestrutura,
        demografia e dinâmica de mercado.
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {SCORE_FACTORS.map((f) => (
          <div
            key={f.id}
            className="rounded-lg border border-slate-200 bg-white p-2"
          >
            <p className="text-xs font-bold text-slate-800">{f.title}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
