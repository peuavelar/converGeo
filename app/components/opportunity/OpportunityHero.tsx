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
  /** Nomes do top ranking para atalhos / respostas. */
  rankingHint?: string[];
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Extrai bairro/região do texto livre do chat (banco local). */
async function resolveFromChat(
  raw: string,
): Promise<{ id: string; name: string } | null> {
  const q = raw.trim().toLowerCase();
  if (!q) return null;

  const hits = await searchRegions(q);
  if (hits[0]) return { id: hits[0].id, name: hits[0].name };

  // Frases tipo "quero saber do bairro X" — procura nome no texto
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
    text: "Onde vale a pena comprar hoje em Salvador?",
  },
  {
    id: "intro-2",
    role: "sino",
    text: "Me conta um bairro ou região — eu cruzo preço, infraestrutura e oportunidade. Você também pode abrir o ranking abaixo pela setinha 🔥.",
  },
];

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
      if (wantsRanking(text) && !NEIGHBORHOODS.some((n) => text.toLowerCase().includes(n.name.toLowerCase()))) {
        const top = rankingHint.slice(0, 5);
        const reply =
          top.length > 0
            ? `No ranking de oportunidade agora: ${top.map((n, i) => `${i + 1}º ${n}`).join(", ")}. Abra o menu 🔥 abaixo ou digite o nome de uma região que eu te dou os detalhes.`
            : "Abra o menu 🔥 “Regiões com maior oportunidade” para ver o ranking. Depois digite o nome de uma região que eu detalho.";
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
          ? `Boa! Analisei ${region.name}: Opportunity Score ${region.score}. Preço médio ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(region.precoM2)}/m² e valorização de +${region.valorizacao12m.toFixed(1)}% em 12 meses. Oferta ${region.oferta.toLowerCase()}. ${region.motivo} Marquei no mapa — peça mais se quiser (ex.: infraestrutura, comparar com outro bairro).`
          : `Encontrei ${match.name} no banco. Abrindo no mapa.`;
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
            text: "Não achei esse local no banco ainda. Digite um bairro (ex.: Pituba, Imbuí, Paralela), use um atalho, ou peça “ranking” para eu listar as melhores oportunidades.",
          },
        ]);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex max-h-[min(70vh,540px)] flex-col overflow-hidden rounded-2xl border border-[#1a2a44] bg-[#070b14] shadow-[0_12px_40px_rgba(0,40,120,0.28)]">
      <header className="flex shrink-0 items-center gap-3 border-b border-[#152238] bg-gradient-to-r from-[#0a1220] via-[#0c1830] to-[#0a1220] px-3.5 py-3">
        <div className="relative shrink-0">
          <div className="rounded-full bg-gradient-to-br from-[#006aff] to-[#00c2ff] p-[2px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sino-mobile-avatar.png"
              alt="Sino Mobile"
              className="h-11 w-11 rounded-full bg-white object-contain p-0.5"
            />
          </div>
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0a1220] bg-emerald-400"
            aria-hidden
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">Sino Mobile</p>
          <p className="text-[11px] font-medium text-[#5eb0ff]">
            Online · Inteligência imobiliária
          </p>
        </div>
      </header>

      <div className="custom-scrollbar relative flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(ellipse at top right, rgba(0,106,255,0.22), transparent 55%), radial-gradient(ellipse at bottom left, rgba(0,180,255,0.08), transparent 50%)",
          }}
          aria-hidden
        />

        {messages.map((m, idx) =>
          m.role === "user" ? (
            <div key={m.id} className="relative flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-[#006aff] to-[#0050c8] px-3.5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#006aff]/25">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="relative flex items-end gap-2">
              {idx === 0 || messages[idx - 1]?.role === "user" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/sino-mobile-avatar.png"
                  alt=""
                  className="mb-0.5 h-7 w-7 shrink-0 rounded-full bg-white object-contain p-0.5 ring-1 ring-[#006aff]/40"
                />
              ) : (
                <span className="w-7 shrink-0" aria-hidden />
              )}
              <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#1e3a5f] bg-[#101a2c] px-3.5 py-2.5 shadow-lg shadow-black/20">
                {idx === 0 && (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#5eb0ff]">
                    Sino Mobile
                  </p>
                )}
                <p className="text-sm leading-relaxed text-[#e8eef8]">
                  {m.text}
                </p>
              </div>
            </div>
          ),
        )}

        {/* Atalhos — só no início ou após pedir bairro */}
        <div className="relative flex items-end gap-2">
          <span className="w-7 shrink-0" aria-hidden />
          <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-[#1e3a5f] bg-[#101a2c] px-3.5 py-2.5">
            <p className="text-[12px] text-[#9fb3d1]">Atalhos rápidos:</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(s)}
                  className="rounded-full border border-[#2a4a73] bg-[#0a1424] px-2.5 py-1 text-[11px] font-semibold text-[#c7d7ef] transition hover:border-[#006aff] hover:bg-[#006aff]/15 hover:text-white disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {busy && (
          <div className="relative flex items-end gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sino-mobile-avatar.png"
              alt=""
              className="mb-0.5 h-7 w-7 shrink-0 rounded-full bg-white object-contain p-0.5"
            />
            <div className="rounded-2xl rounded-bl-md border border-[#1e3a5f] bg-[#101a2c] px-3.5 py-2.5 text-xs text-[#5eb0ff]">
              Sino está analisando…
            </div>
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
        className="shrink-0 border-t border-[#152238] bg-[#0a1220] p-3"
      >
        <label htmlFor="sino-chat-input" className="sr-only">
          Mensagem para Sino Mobile
        </label>
        <div className="flex items-end gap-2 rounded-2xl border border-[#243a5c] bg-[#070b14] px-2.5 py-2 focus-within:border-[#006aff] focus-within:ring-2 focus-within:ring-[#006aff]/25">
          <input
            id="sino-chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escreva para o Sino Mobile…"
            autoComplete="off"
            disabled={busy}
            className="min-w-0 flex-1 bg-transparent px-1.5 py-1.5 text-sm text-white placeholder:text-[#6b7f9c] outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-[#006aff] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#006aff]/30 hover:bg-[#1a7aff] disabled:opacity-40"
            disabled={!draft.trim() || busy}
          >
            Enviar
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-[#5a6f8c]">
          Chat separado da busca do topo · Sino Mobile
        </p>
      </form>
    </section>
  );
}
