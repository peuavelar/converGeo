"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

/** Filtros avançados — distintos da tela “Para você” (orçamento/tipo/quartos/área). */
export type AdvancedFilters = {
  banheiros: number;
  suites: number;
  vagas: number;
  amenities: string[];
};

/** @deprecated use AdvancedFilters */
export type QuickFilterValues = AdvancedFilters & {
  budget: number;
  quartos: number;
  areaMin: number;
};

export const ADVANCED_AMENITIES = [
  "Elevador",
  "Portaria",
  "Garagem",
  "Varanda",
  "Piscina",
  "Aceita animais",
  "Ar-condicionado",
  "Mobiliado",
  "Academia",
] as const;

export const ADVANCED_FILTER_OPEN: AdvancedFilters = {
  banheiros: 0,
  suites: 0,
  vagas: 0,
  amenities: [],
};

/** Baseline legado (compat). */
export const QUICK_FILTER_OPEN: QuickFilterValues = {
  budget: 2000000,
  quartos: 0,
  areaMin: 0,
  ...ADVANCED_FILTER_OPEN,
};

export function countActiveAdvancedFilters(f: AdvancedFilters): number {
  let n = 0;
  if (f.banheiros > 0) n += 1;
  if (f.suites > 0) n += 1;
  if (f.vagas > 0) n += 1;
  n += f.amenities.length;
  return n;
}

/** @deprecated */
export function countActiveQuickFilters(f: QuickFilterValues): number {
  return countActiveAdvancedFilters(f);
}

type SheetProps = {
  open: boolean;
  onClose: () => void;
  value: AdvancedFilters;
  onApply: (next: AdvancedFilters) => void;
};

function PlusRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-[#6a6a72]">{label}</p>
        {hint ? (
          <p className="text-[10px] font-medium text-[#9a9aa3]">{hint}</p>
        ) : null}
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 rounded-full py-2.5 text-xs font-bold transition ${
              value === n
                ? "bg-[#006aff] text-white shadow-sm shadow-[#006aff]/25"
                : "border border-[#c3c3c8] bg-white text-[#2a2a33] hover:border-[#006aff]"
            }`}
          >
            {n === 0 ? "Qualquer" : n === 4 ? "4+" : `${n}+`}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Modal estilo Airbnb: rascunho → OK aplica. */
export function FiltroSheet({ open, onClose, value, onApply }: SheetProps) {
  const titleId = useId();
  const [draft, setDraft] = useState(value);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const clearDraft = () => setDraft({ ...ADVANCED_FILTER_OPEN });

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fechar filtros"
        className="absolute inset-0 bg-black/45 animate-filtro-backdrop"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[101] flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-filtro-sheet sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[#e8e8ed] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm font-semibold text-[#6a6a72] hover:bg-[#f5f5f7]"
          >
            Fechar
          </button>
          <h2 id={titleId} className="text-base font-bold text-[#2a2a33]">
            Filtros do imóvel
          </h2>
          <button
            type="button"
            onClick={clearDraft}
            className="rounded-full px-2 py-1 text-sm font-semibold text-[#006aff] hover:bg-[#e8f1ff]"
          >
            Limpar
          </button>
        </header>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <p className="rounded-xl border border-[#e8f1ff] bg-[#f5f9ff] px-3 py-2.5 text-[11px] leading-snug text-[#3a5a8a]">
            Orçamento, tipo, quartos e área ficam na tela{" "}
            <strong>Para você</strong>. Aqui você afina o imóvel: banheiros,
            suítes, vagas e comodidades.
          </p>

          <PlusRow
            label="Banheiros"
            value={draft.banheiros}
            onChange={(banheiros) => setDraft((d) => ({ ...d, banheiros }))}
          />
          <PlusRow
            label="Suítes"
            hint="quartos com banheiro"
            value={draft.suites}
            onChange={(suites) => setDraft((d) => ({ ...d, suites }))}
          />
          <PlusRow
            label="Vagas"
            hint="garagem / estacionamento"
            value={draft.vagas}
            onChange={(vagas) => setDraft((d) => ({ ...d, vagas }))}
          />

          <div>
            <p className="mb-2 text-xs font-semibold text-[#6a6a72]">
              Características
            </p>
            <div className="flex flex-wrap gap-2">
              {ADVANCED_AMENITIES.map((a) => {
                const on = draft.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        amenities: on
                          ? d.amenities.filter((x) => x !== a)
                          : [...d.amenities, a],
                      }))
                    }
                    className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                      on
                        ? "bg-[#e8f1ff] text-[#006aff] ring-1 ring-[#006aff]"
                        : "border border-[#c3c3c8] bg-white text-[#2a2a33] hover:border-[#006aff]"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="safe-pb flex shrink-0 items-center gap-3 border-t border-[#e8e8ed] bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-3 text-sm font-semibold text-[#2a2a33] underline-offset-2 hover:underline"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="ml-auto flex-1 rounded-full bg-[#006aff] py-3 text-sm font-bold text-white shadow-lg shadow-[#006aff]/30 transition hover:bg-[#0058d6] sm:flex-none sm:px-10"
          >
            OK
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

type PillProps = {
  value: AdvancedFilters;
  onChange: (next: AdvancedFilters) => void;
  compact?: boolean;
  label?: string;
};

/** Botão Filtro / Filtro (N). */
export function FiltroPill({
  value,
  onChange,
  compact = false,
  label = "Filtros",
}: PillProps) {
  const [open, setOpen] = useState(false);
  const count = countActiveAdvancedFilters(value);
  const active = count > 0;
  const base = label.replace(/s$/i, "") || "Filtro";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex shrink-0 items-center gap-1 rounded-full border transition ${
          compact
            ? "px-2.5 py-1.5 text-[11px] font-bold"
            : "gap-1.5 px-3.5 py-1.5 text-sm font-semibold"
        } ${
          active
            ? "border-[#006aff] bg-[#e8f1ff] text-[#006aff]"
            : "border-[#c3c3c8] bg-white text-[#2a2a33] hover:border-[#006aff]"
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 24 24"
          className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
        </svg>
        {active ? `${base} (${count})` : base}
      </button>

      <FiltroSheet
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onApply={onChange}
      />
    </>
  );
}
