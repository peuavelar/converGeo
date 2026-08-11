"use client";

import { useEffect, useRef, useState } from "react";
import { NEIGHBORHOODS } from "../../data/neighborhoods";
import { getRegionByIdSync, searchRegions } from "../../services/regionsApi";

type ChatMessage = {
  id: string;
  role: "sino" | "user";
  text: string;
};

type Props = {
  onSelectRegion: (id: string) => void;
  suggestions?: string[];
  rankingHint?: string[];
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function resolveFromChat(
  raw: string,
): Promise<{ id: string; name: string } | null> {
  const q = raw.trim().toLowerCase();
  if (!q) return null;

  const hits = await searchRegions(q);
  if (hits[0]) return { id: hits[0].id, name: hits[0].name };

  const byName = [...NEIGHBORHOODS]
    .sort((a, b) => b.name.length - a.name.length)
    .find((n) => q.includes(n.name.toLowerCase()));
  if (byName) return { id: byName.id, name: byName.name };

  return null;
}

function wantsRanking(q: string) {
  return /ranking|melhor(es)?|oportunidad|top\s*\d*|onde vale|recomend/.test(
    q.toLowerCase(),
  );
}

const INTRO: ChatMessage[] = [
  {
    id: "intro-1",
    role: "sino",
    text: "Olá! Sou o Sino Analytics. Onde vale a pena comprar hoje em Salvador?",
  },
  {
    id: "intro-2",
    role: "sino",
    text: "Digite um bairro ou use um atalho — cruzo preço, infraestrutura e oportunidade em segundos.",
  },
];

/** Assistente de regiões — Sino Analytics. */
export default function OpportunityHero({
  onSelectRegion,
  suggestions,
  rankingHint = ["Pituba", "Imbuí", "Paralela", "Horto Florestal", "Itapuã"],
}: Props) {
  const chips = suggestions?.length ? suggestions : rankingHint;
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(INTRO);
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;

    setDraft("");
    setMessages((prev) => [...prev, { id: uid(), role: "user", text }]);
    setBusy(true);

    try {
      if (
        wantsRanking(text) &&
        !NEIGHBORHOODS.some((n) =>
          text.toLowerCase().includes(n.name.toLowerCase()),
        )
      ) {
        const top = rankingHint.slice(0, 5);
        const reply =
          top.length > 0
            ? `Ranking de oportunidade: ${top.map((n, i) => `${i + 1}º ${n}`).join(", ")}. Abra o ranking abaixo ou digite uma região para eu detalhar.`
            : "Abra o ranking abaixo ou digite uma região para eu analisar.";
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "sino", text: reply },
        ]);
        return;
      }

      const match = await resolveFromChat(text);
      if (match) {
        const region = getRegionByIdSync(match.id);
        const reply = region
          ? `${region.name}: Opportunity Score ${region.score}. ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(region.precoM2)}/m² · valorização +${region.valorizacao12m.toFixed(1)}% em 12 meses. Oferta ${region.oferta.toLowerCase()}. ${region.motivo} Marquei no mapa.`
          : `Encontrei ${match.name}. Abrindo no mapa.`;
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "sino", text: reply },
        ]);
        onSelectRegion(match.id);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "sino",
            text: "Não achei esse local ainda. Tente Pituba, Imbuí, Paralela — ou peça “ranking”.",
          },
        ]);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex max-h-[min(42vh,340px)] flex-col overflow-hidden rounded-2xl border border-[#e0e7f1] bg-white shadow-[0_8px_28px_rgba(15,40,80,0.08)]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[#eef1f6] bg-gradient-to-r from-[#f7faff] to-white px-3.5 py-2.5">
        <div className="relative shrink-0">
          <div className="rounded-full bg-gradient-to-br from-[#006aff] to-[#00a3ff] p-[2px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sino-mobile-avatar.png"
              alt="Sino Analytics"
              className="h-9 w-9 rounded-full bg-white object-contain p-0.5"
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
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[88%] rounded-2xl rounded-br-md bg-[#006aff] px-3 py-2 text-[13px] font-medium leading-relaxed text-white shadow-sm">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sino-mobile-avatar.png"
                alt=""
                className="mb-0.5 h-6 w-6 shrink-0 rounded-full bg-white object-contain p-0.5 ring-1 ring-[#dbe7f7]"
              />
              <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#e6edf5] bg-white px-3 py-2 shadow-sm">
                <p className="text-[13px] leading-relaxed text-[#1e293b]">
                  {m.text}
                </p>
              </div>
            </div>
          ),
        )}

        {messages.length <= 2 && (
          <div className="flex flex-wrap gap-1.5 pl-8">
            {chips.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => void send(s)}
                className="rounded-full border border-[#d7e3f2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2a4a6e] transition hover:border-[#006aff] hover:bg-[#e8f1ff] hover:text-[#006aff] disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {busy && (
          <div className="flex items-center gap-2 pl-8 text-[12px] font-medium text-[#006aff]">
            <span className="inline-flex gap-0.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#006aff]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#006aff] [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#006aff] [animation-delay:240ms]" />
            </span>
            Analisando região…
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
          Mensagem para Sino Analytics
        </label>
        <div className="flex items-center gap-2 rounded-full border border-[#d7e0ea] bg-[#f8fafc] px-2 py-1 focus-within:border-[#006aff] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#006aff]/20">
          <input
            id="sino-chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Pergunte ao Sino Analytics…"
            autoComplete="off"
            disabled={busy}
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-[#1e293b] outline-none placeholder:text-[#94a3b8] disabled:opacity-60"
          />
          <button
            type="submit"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#006aff] text-white shadow-sm hover:bg-[#0058d6] disabled:opacity-40"
            disabled={!draft.trim() || busy}
            aria-label="Enviar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M3.4 20.6 21 12 3.4 3.4 3 10.2 15 12 3 13.8z" />
            </svg>
          </button>
        </div>
      </form>
    </section>
  );
}
