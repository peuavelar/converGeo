"use client";

export default function OpportunityMapLegend() {
  const items = [
    { label: "80–100", color: "#006aff", desc: "Muito alta" },
    { label: "60–79", color: "#4d9aff", desc: "Alta" },
    { label: "40–59", color: "#f5a623", desc: "Moderada" },
    { label: "20–39", color: "#f97316", desc: "Baixa" },
    { label: "0–19", color: "#ef4444", desc: "Muito baixa" },
  ];

  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-10 rounded-xl border border-[var(--zg-line)] bg-white/95 px-3 py-2.5 text-[var(--zg-ink)] shadow-lg backdrop-blur-md print:hidden">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--zg-muted)]">
        Opportunity Score
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: i.color }}
            />
            <span className="font-semibold tabular-nums">{i.label}</span>
            <span className="text-[var(--zg-muted)]">{i.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
