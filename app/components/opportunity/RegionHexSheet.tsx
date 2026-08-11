"use client";

import { useEffect, useMemo, useState } from "react";
import { NEIGHBORHOODS, METRIC_LABELS } from "../../data/neighborhoods";
import { getRegionById } from "../../services/regionsApi";
import type { RegionDetail } from "../../types/region";
import { formatPct, scoreCss, bandLabel } from "../../utils/opportunity";
import DualScore from "./DualScore";

type Props = {
  regionId: string | null;
  onClose: () => void;
  onOpenFull?: (id: string) => void;
};

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

function levelFrom10(v: number): { label: string; tone: string } {
  if (v >= 8) return { label: "Excelente", tone: "text-[#1a7f37]" };
  if (v >= 6.5) return { label: "Bom", tone: "text-[#006aff]" };
  if (v >= 5) return { label: "Regular", tone: "text-[#b45309]" };
  return { label: "Atenção", tone: "text-[#b91c1c]" };
}

function MetricGlyph({
  kind,
}: {
  kind: "transporte" | "educacao" | "consumo" | "seguranca" | "risco";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (kind === "transporte") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="12" rx="2" />
        <path d="M8 17v2M16 17v2M4 11h16" />
      </svg>
    );
  }
  if (kind === "educacao") {
    return (
      <svg {...common}>
        <path d="M3 9l9-5 9 5-9 5-9-5z" />
        <path d="M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" />
      </svg>
    );
  }
  if (kind === "consumo") {
    return (
      <svg {...common}>
        <path d="M4 8h16l-1.5 11H5.5L4 8z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </svg>
    );
  }
  if (kind === "seguranca") {
    return (
      <svg {...common}>
        <path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 4.3 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

const BAIRRO_METRICS = [
  {
    key: "transporte" as const,
    glyph: "transporte" as const,
    hint: "Acesso a ônibus, vias e mobilidade",
  },
  {
    key: "educacao" as const,
    glyph: "educacao" as const,
    hint: "Escolas e instituições próximas",
  },
  {
    key: "consumo" as const,
    glyph: "consumo" as const,
    hint: "Comércio, serviços e conveniência",
  },
  {
    key: "seguranca" as const,
    glyph: "seguranca" as const,
    hint: "Percepção de segurança na região",
  },
];

/** Ficha da região — scores + dados do bairro (sem lista de imóveis). */
export default function RegionHexSheet({
  regionId,
  onClose,
  onOpenFull,
}: Props) {
  const [region, setRegion] = useState<RegionDetail | null>(null);

  const neighborhood = useMemo(
    () => NEIGHBORHOODS.find((n) => n.id === regionId) ?? null,
    [regionId],
  );

  useEffect(() => {
    let cancelled = false;
    if (!regionId) {
      setRegion(null);
      return;
    }
    getRegionById(regionId).then((r) => {
      if (!cancelled) setRegion(r);
    });
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  if (!regionId || !region) return null;

  const metrics = neighborhood?.metrics;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex max-h-[min(68dvh,520px)] w-full flex-col overflow-hidden rounded-t-2xl border border-[#d1d1d5] border-b-0 bg-white shadow-2xl animate-fade-in sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-h-[min(74vh,520px)] sm:w-[min(100%-2rem,380px)] sm:rounded-xl sm:border-b">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[#e8e8ed] px-3 py-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#006aff]">
            Oportunidades · bairro
          </p>
          <h3 className="text-base font-bold text-[#2a2a33]">{region.name}</h3>
          <p
            className="text-[11px] font-semibold"
            style={{ color: scoreCss(region.score) }}
          >
            {bandLabel(region.band)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-sm font-bold text-[#6a6a72] hover:bg-[#f5f5f7]"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2.5 overflow-y-auto p-3 custom-scrollbar">
        <DualScore
          opportunityScore={region.score}
          matchScore={Math.round(
            region.score * 0.55 + region.breakdown.preco * 0.45,
          )}
        />

        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          <div className="rounded-lg bg-[#f5f5f7] p-1.5">
            <p className="text-[10px] text-[#6a6a72]">Preço/m²</p>
            <p className="font-bold text-[#2a2a33]">
              {formatBRL(region.precoM2)}
            </p>
          </div>
          <div className="rounded-lg bg-[#f5f5f7] p-1.5">
            <p className="text-[10px] text-[#6a6a72]">Valorização</p>
            <p className="font-bold text-[#1a7f37]">
              {formatPct(region.valorizacao12m)}
            </p>
          </div>
          <div className="rounded-lg bg-[#f5f5f7] p-1.5">
            <p className="text-[10px] text-[#6a6a72]">Oferta</p>
            <p className="font-bold text-[#2a2a33]">{region.oferta}</p>
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#6a6a72]">
            Dados do bairro
          </p>
          <p className="mb-2 text-[11px] leading-snug text-[#6a6a72]">
            Qualidade de vida na região. Imóveis à venda ficam no card do mapa e
            no marketplace.
          </p>

          {metrics ? (
            <ul className="space-y-1.5">
              {BAIRRO_METRICS.map(({ key, glyph, hint }) => {
                const raw = metrics[key];
                const pct = Math.round((raw / 10) * 100);
                const level = levelFrom10(raw);
                return (
                  <li
                    key={key}
                    className="rounded-xl border border-[#e8e8ed] bg-[#f8fafc] px-2.5 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#006aff] shadow-sm ring-1 ring-[#e8e8ed]">
                          <MetricGlyph kind={glyph} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#2a2a33]">
                            {METRIC_LABELS[key]}
                          </p>
                          <p className="truncate text-[10px] text-[#6a6a72]">
                            {hint}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums text-[#2a2a33]">
                          {raw.toFixed(1)}
                        </p>
                        <p className={`text-[10px] font-semibold ${level.tone}`}>
                          {level.label}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e8e8ed]">
                      <div
                        className="h-full rounded-full bg-[#006aff] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}

              <li className="rounded-xl border border-[#e8e8ed] bg-white px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff5f5] text-[#b91c1c] ring-1 ring-[#fecaca]">
                      <MetricGlyph kind="risco" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#2a2a33]">
                        Roubo / furto
                      </p>
                      <p className="text-[10px] text-[#6a6a72]">
                        Índice relativo (menor = melhor)
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-[#2a2a33]">
                    {metrics.rouboFurto.toFixed(1)}
                  </p>
                </div>
              </li>
            </ul>
          ) : (
            <div className="space-y-1.5">
              {(
                [
                  {
                    id: "infraestrutura" as const,
                    label: "Infraestrutura",
                    hint: "Transporte, serviços e urbanização",
                  },
                  {
                    id: "demografia" as const,
                    label: "Demografia",
                    hint: "Perfil e dinamismo populacional",
                  },
                  {
                    id: "desenvolvimento" as const,
                    label: "Desenvolvimento",
                    hint: "Empreendimentos e crescimento",
                  },
                  {
                    id: "mercado" as const,
                    label: "Mercado",
                    hint: "Liquidez e oferta imobiliária",
                  },
                ] as const
              ).map((row) => {
                const value = region.breakdown[row.id];
                return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-[#e8e8ed] bg-[#f8fafc] px-2.5 py-2"
                  >
                    <div className="mb-1 flex justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#2a2a33]">{row.label}</p>
                        <p className="text-[10px] text-[#6a6a72]">{row.hint}</p>
                      </div>
                      <span className="font-bold tabular-nums text-[#2a2a33]">
                        {value}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#e8e8ed]">
                      <div
                        className="h-full rounded-full bg-[#006aff]"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {region.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {region.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[#e8f1ff] px-2 py-0.5 text-[10px] font-semibold text-[#006aff]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {region.summary && (
          <p className="rounded-lg border border-[#eef1f6] bg-white px-2.5 py-2 text-[11px] leading-snug text-[#6a6a72]">
            {region.summary}
          </p>
        )}

        <button
          type="button"
          onClick={() => onOpenFull?.(region.id)}
          className="w-full rounded-full bg-[#006aff] py-2.5 text-sm font-bold text-white hover:bg-[#0058d6]"
        >
          Ver análise completa
        </button>
      </div>
    </div>
  );
}
