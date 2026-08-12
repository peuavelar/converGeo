"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  buildAddressSuggestions,
  type AddressSuggestion,
} from "../../data/streets";
import { useTypewriterPlaceholder } from "../../hooks/useTypewriterPlaceholder";
import { getRegionByIdSync, searchRegions } from "../../services/regionsApi";
import type { RegionDetail } from "../../types/region";

type ChatMessage = {
  id: string;
  role: "sino" | "user";
  text: string;
};

/** Fluxo guiado até as métricas (preço · infra · oportunidade). */
type IntakeStep = "idle" | "place" | "budget" | "profile" | "done";

type Intake = {
  regionId: string | null;
  regionName: string | null;
  budget: number | null;
  quartos: number | null;
  goal: "morar" | "investir" | null;
};

type Props = {
  onSelectRegion: (id: string) => void;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function isGreeting(raw: string) {
  return /^(oi|ol[aá]|hey|hello|e a[ií]|bom dia|boa tarde|boa noite|tudo bem|fala|salve)\b/i.test(
    raw.trim(),
  );
}

function parseBudget(raw: string): number | null {
  const q = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return null;

  const milhao = q.match(/(\d+(?:[.,]\d+)?)\s*mi(?:lh[aã]o|lh[oõ]es)?/);
  if (milhao) {
    const n = Number(milhao[1].replace(",", "."));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 1_000_000);
  }

  const mil = q.match(/(\d+(?:[.,]\d+)?)\s*mil\b/);
  if (mil) {
    const n = Number(mil[1].replace(",", "."));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 1_000);
  }

  const digits = q.replace(/[^\d]/g, "");
  if (digits.length >= 4) {
    const n = Number(digits);
    if (Number.isFinite(n) && n >= 50_000) return n;
  }

  return null;
}

function parseProfile(raw: string): {
  quartos: number | null;
  goal: "morar" | "investir" | null;
} {
  const q = raw.toLowerCase();
  const goal: "morar" | "investir" | null = /invest/.test(q)
    ? "investir"
    : /morar|resid|moradia/.test(q)
      ? "morar"
      : null;

  const roomMatch = q.match(/(\d)\s*(?:q|quarto)/);
  const quartos = roomMatch
    ? Number(roomMatch[1])
    : /\bstudio\b|kitnet|1\s*dorm/.test(q)
      ? 1
      : null;

  return { quartos, goal };
}

function formatMetrics(region: RegionDetail, intake: Intake): string {
  const area =
    intake.budget && region.precoM2 > 0
      ? Math.max(20, Math.round(intake.budget / region.precoM2))
      : null;

  const goalLine =
    intake.goal === "investir"
      ? `Perfil investidor${intake.quartos ? ` · ${intake.quartos}q` : ""}.`
      : intake.goal === "morar"
        ? `Perfil moradia${intake.quartos ? ` · ${intake.quartos}q` : ""}.`
        : "";

  const budgetLine = intake.budget
    ? `Orçamento ${brl.format(intake.budget)}${area ? ` (~${area} m² aqui)` : ""}.`
    : "";

  return [
    `Pronto — aqui estão as métricas de ${region.name}:`,
    ``,
    `• Preço: ${brl.format(region.precoM2)}/m² · vs média Salvador ${region.indicators.precoVsMediaSalvador >= 0 ? "+" : ""}${region.indicators.precoVsMediaSalvador.toFixed(0)}%`,
    `• Infraestrutura: ${region.breakdown.infraestrutura}/100 · oferta ${region.oferta.toLowerCase()} · ${region.indicators.novosEmpreendimentos} lançamentos`,
    `• Oportunidade: score ${region.score}/100 · valorização +${region.valorizacao12m.toFixed(1)}% em 12 meses`,
    ``,
    [budgetLine, goalLine, region.motivo, "Marquei no mapa."]
      .filter(Boolean)
      .join(" "),
  ].join("\n");
}

async function resolvePlace(
  raw: string,
): Promise<{ id: string; name: string } | null> {
  const q = raw.trim().toLowerCase();
  if (!q) return null;

  const hits = await searchRegions(q);
  if (hits[0]) return { id: hits[0].id, name: hits[0].name };

  const suggestions = buildAddressSuggestions(raw, 1);
  if (suggestions[0]) {
    return {
      id: suggestions[0].neighborhoodId,
      name: suggestions[0].neighborhoodName,
    };
  }

  return null;
}

/** Assistente de regiões — Sino Analytics. */
export default function OpportunityHero({ onSelectRegion }: Props) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<IntakeStep>("idle");
  const [intake, setIntake] = useState<Intake>({
    regionId: null,
    regionName: null,
    budget: null,
    quartos: null,
    goal: null,
  });
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const typedPlaceholder = useTypewriterPlaceholder(
    "Converse com o Sino Analytics...",
    "sino-idle",
  );
  const showTyped = !draft.trim();
  const canSuggest = step === "idle" || step === "place" || step === "done";
  const addressHits = canSuggest ? buildAddressSuggestions(draft, 6) : [];
  const showList = suggestOpen && canSuggest && addressHits.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    setActiveIndex(0);
  }, [draft]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pushSino = (text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role: "sino", text }]);
  };

  const deliverMetrics = (regionId: string, nextIntake: Intake) => {
    const region = getRegionByIdSync(regionId);
    if (!region) {
      pushSino(
        "Não consegui carregar as métricas dessa região. Me diga outro bairro ou endereço.",
      );
      setStep("place");
      return;
    }
    pushSino(formatMetrics(region, nextIntake));
    onSelectRegion(regionId);
    setStep("done");
  };

  const askBudget = (name: string) => {
    setStep("budget");
    pushSino(
      `Ótimo — vou analisar ${name}.\n\nPara cruzar preço, infraestrutura e oportunidade, qual seu orçamento aproximado?`,
    );
  };

  const lockPlace = (id: string, name: string, greeted: boolean) => {
    const next: Intake = {
      regionId: id,
      regionName: name,
      budget: null,
      quartos: null,
      goal: null,
    };
    setIntake(next);
    onSelectRegion(id);
    if (!greeted) {
      pushSino(
        `Olá! Sou o Sino Analytics. Vamos olhar ${name} juntos.`,
      );
    } else {
      pushSino(`Perfeito, anotei ${name}.`);
    }
    askBudget(name);
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;

    setDraft("");
    setSuggestOpen(false);
    setMessages((prev) => [...prev, { id: uid(), role: "user", text }]);
    setBusy(true);

    try {
      // ── primeira interação / retomada ──────────────────────────
      if (step === "idle" || step === "done") {
        const match = await resolvePlace(text);
        if (match) {
          lockPlace(match.id, match.name, false);
          return;
        }

        setStep("place");
        setIntake({
          regionId: null,
          regionName: null,
          budget: null,
          quartos: null,
          goal: null,
        });
        pushSino(
          isGreeting(text)
            ? "Olá! Sou o Sino Analytics.\n\nCruzo preço, infraestrutura e oportunidade em Salvador e Lauro de Freitas.\n\nQual bairro ou endereço você quer analisar?"
            : "Olá! Sou o Sino Analytics.\n\nPara entregar preço, infraestrutura e oportunidade, preciso de alguns dados.\n\nQual bairro ou endereço você quer analisar?",
        );
        return;
      }

      // ── local ──────────────────────────────────────────────────
      if (step === "place") {
        const match = await resolvePlace(text);
        if (!match) {
          pushSino(
            "Ainda não achei esse local. Digite um bairro ou rua em Salvador / Lauro de Freitas — por exemplo Pituba ou Av. Paulo VI.",
          );
          return;
        }
        lockPlace(match.id, match.name, true);
        return;
      }

      // ── orçamento ──────────────────────────────────────────────
      if (step === "budget") {
        const budget = parseBudget(text);
        if (!budget) {
          pushSino(
            "Preciso do orçamento em reais para calcular poder de compra e preço.\n\nPode ser assim: 450 mil, 600000 ou R$ 800.000.",
          );
          return;
        }
        const next = { ...intake, budget };
        setIntake(next);
        setStep("profile");
        pushSino(
          `Orçamento ${brl.format(budget)} anotado.\n\nAgora me diga: quantos quartos e o objetivo — morar ou investir?`,
        );
        return;
      }

      // ── perfil ─────────────────────────────────────────────────
      if (step === "profile") {
        const { quartos, goal } = parseProfile(text);
        if (!quartos && !goal) {
          pushSino(
            "Quase lá. Me diga os quartos e o objetivo.\n\nExemplos: “2 quartos para morar” ou “investir, 3q”.",
          );
          return;
        }
        const next: Intake = {
          ...intake,
          quartos: quartos ?? intake.quartos ?? 2,
          goal: goal ?? intake.goal ?? "morar",
        };
        setIntake(next);
        if (next.regionId) deliverMetrics(next.regionId, next);
        return;
      }
    } finally {
      setBusy(false);
    }
  };

  const pickSuggestion = (item: AddressSuggestion) => {
    const label = item.street
      ? `${item.street}, ${item.neighborhoodName}`
      : item.neighborhoodName;
    setDraft(label);
    setSuggestOpen(false);
    void send(label);
  };

  return (
    <section className="flex max-h-[min(42vh,340px)] flex-col overflow-hidden rounded-2xl border border-[#e0e7f1] bg-white shadow-[0_8px_28px_rgba(15,40,80,0.08)]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[#eef1f6] bg-gradient-to-r from-[#f7faff] to-white px-3.5 py-2.5">
        <div className="relative shrink-0">
          <div className="rounded-full bg-gradient-to-br from-[#006aff] to-[#00a3ff] p-[2px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sino-mobile-avatar.png?v=surf-lean"
              alt="Sino Analytics"
              className="h-9 w-9 rounded-full bg-white object-cover"
            />
          </div>
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400"
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-[#0a1220]">
              Sino Analytics
            </p>
            <span className="rounded-full bg-[#e8f1ff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#006aff]">
              IA
            </span>
          </div>
          <p className="text-[11px] font-medium text-[#6a7a90]">
            Online · inteligência imobiliária
          </p>
        </div>
      </header>

      <div className="custom-scrollbar relative min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-[#f8fafc] px-3 py-3">
        {messages.length === 0 && !busy && (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center px-4 text-center">
            <p className="text-[13px] font-medium text-[#8a96a8]">
              Digite abaixo para começar
            </p>
            <p className="mt-1 text-[11px] leading-snug text-[#a0aab8]">
              O Sino pede bairro, orçamento e perfil — e devolve preço,
              infraestrutura e oportunidade.
            </p>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[88%] whitespace-pre-line rounded-2xl rounded-br-md bg-[#006aff] px-3 py-2 text-[13px] font-medium leading-relaxed text-white shadow-sm">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sino-mobile-avatar.png?v=surf-lean"
                alt=""
                className="mb-0.5 h-6 w-6 shrink-0 rounded-full bg-white object-cover ring-1 ring-[#dbe7f7]"
              />
              <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#e6edf5] bg-white px-3 py-2 shadow-sm">
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#1e293b]">
                  {m.text}
                </p>
              </div>
            </div>
          ),
        )}

        {busy && (
          <div className="flex items-center gap-2 pl-8 text-[12px] font-medium text-[#006aff]">
            <span className="inline-flex gap-0.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#006aff]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#006aff] [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#006aff] [animation-delay:240ms]" />
            </span>
            Analisando…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void send(draft);
        }}
        className="shrink-0 border-t border-[#eef1f6] bg-white p-2.5"
      >
        <label htmlFor="sino-chat-input" className="sr-only">
          Converse com o Sino Analytics
        </label>
        <div ref={rootRef} className="relative">
          <div className="group flex min-h-[44px] items-center gap-2 rounded-full border border-[#d7e0ea] bg-[#f8fafc] px-2 py-1 transition focus-within:border-[#006aff] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#006aff]/20">
            <svg
              viewBox="0 0 24 24"
              className="ml-1 h-4 w-4 shrink-0 text-[#8a8a93] group-focus-within:text-[#006aff]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <div className="relative min-w-0 flex-1">
              {showTyped && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 flex items-center px-2 text-sm text-[#94a3b8]"
                >
                  {typedPlaceholder}
                  <span className="ml-px inline-block h-4 w-px animate-pulse bg-[#006aff]/70" />
                </span>
              )}
              <input
                id="sino-chat-input"
                role={canSuggest ? "combobox" : undefined}
                aria-expanded={canSuggest ? showList : undefined}
                aria-controls={canSuggest ? listId : undefined}
                aria-autocomplete={canSuggest ? "list" : undefined}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (canSuggest) setSuggestOpen(true);
                }}
                onFocus={() => {
                  if (canSuggest) setSuggestOpen(true);
                }}
                onKeyDown={(e) => {
                  if (!showList) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((i) =>
                      Math.min(i + 1, addressHits.length - 1),
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && addressHits[activeIndex]) {
                    e.preventDefault();
                    pickSuggestion(addressHits[activeIndex]);
                  } else if (e.key === "Escape") {
                    setSuggestOpen(false);
                  }
                }}
                placeholder=""
                autoComplete="off"
                disabled={busy}
                className="relative z-[1] min-w-0 w-full bg-transparent px-2 py-1.5 text-sm text-[#1e293b] outline-none disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-full bg-[#006aff] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-[#0058d6] disabled:opacity-40"
              disabled={!draft.trim() || busy}
              aria-label="Enviar"
            >
              Enviar
            </button>
          </div>

          {showList && (
            <ul
              id={listId}
              role="listbox"
              className="absolute bottom-[calc(100%+6px)] z-30 max-h-44 w-full overflow-y-auto rounded-xl border border-[#e6edf5] bg-white py-1 shadow-lg"
            >
              {addressHits.map((item, idx) => (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={idx === activeIndex}
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(item)}
                    className={`flex w-full flex-col px-3 py-2 text-left ${
                      idx === activeIndex ? "bg-[#e8f1ff]" : "hover:bg-[#f8fafc]"
                    }`}
                  >
                    <span className="text-sm font-semibold text-[#0a1220]">
                      {item.kind === "rua"
                        ? item.street
                        : item.neighborhoodName}
                    </span>
                    <span className="text-[11px] text-[#6a7a90]">
                      {item.kind === "rua"
                        ? `Rua em ${item.neighborhoodName}`
                        : "Bairro"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </section>
  );
}
