"use client";

import type { CompareRegionPoint } from "@/lib/negocio/compareRegions";
import { METRIC_LABELS } from "../../data/neighborhoods";
import { formatBRL } from "../../utils/realEstate";
import { getRadarPoint } from "../../utils/helpers";

interface ViewCompareProps {
  compareLocations: CompareRegionPoint[];
  hexData: any[];
  addressMap: Record<string, string>;
  getDynamicScore: (hex: any) => number;
  handlePrintPDF: () => void;
  handleResetCompare: () => void;
  handleShare: () => void;
  copied: boolean;
  loading?: boolean;
}

export default function ViewCompare({
  compareLocations,
  hexData,
  addressMap,
  getDynamicScore,
  handlePrintPDF,
  handleResetCompare,
  handleShare,
  copied,
  loading = false,
}: ViewCompareProps) {
  if (compareLocations.length < 2) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-[#c5d8f5] bg-[#f5f9ff] p-4 text-center">
        <p className="text-sm font-bold text-[#2a2a33]">Teste A/B</p>
        <p className="mt-1 text-[11px] text-[#6a6a72]">
          Preencha Região A e B acima e toque em{" "}
          <strong>Comparar locais</strong>.
        </p>
      </div>
    );
  }

  const hasHex = hexData.length >= 2;
  const a = compareLocations[0];
  const b = compareLocations[1];

  return (
    <div className="mt-4 flex flex-1 flex-col space-y-3 animate-fade-in">
      <h3 className="text-center text-xs font-bold uppercase tracking-wider text-[#8a8a93] print:text-left print:text-base">
        Teste A/B · regiões
      </h3>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#006aff] border-t-transparent" />
        </div>
      )}

      {/* Relação região completa */}
      <div className="grid grid-cols-2 gap-2">
        {[a, b].map((loc, index) => {
          const peer = index === 0 ? b : a;
          const winsRegion = loc.regionScore > peer.regionScore;
          return (
            <div
              key={loc.neighborhoodId}
              className={`rounded-xl border-2 p-2.5 ${
                winsRegion
                  ? "border-[#006aff] bg-[#f5f9ff]"
                  : "border-[#e8e8ed] bg-white"
              }`}
            >
              <p className="text-[10px] font-bold uppercase text-[#8a8a93]">
                Região {index === 0 ? "A" : "B"}
              </p>
              <p className="mt-0.5 text-xs font-bold leading-snug text-[#2a2a33]">
                {loc.neighborhoodName}
              </p>
              <p className="text-[10px] font-semibold text-[#6a6a72]">
                {loc.city}
              </p>
              <p className="mt-2 text-lg font-black tabular-nums text-[#006aff]">
                {loc.regionScore.toFixed(1)}
              </p>
              <p className="text-[10px] text-[#8a8a93]">Índice da região</p>
              <p className="mt-1 text-[10px] font-semibold text-[#2a2a33]">
                {formatBRL(loc.precoM2)}/m²
              </p>
              {loc.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {loc.tags.slice(0, 2).map((t: string) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#f5f5f7] px-1.5 py-0.5 text-[9px] font-semibold text-[#6a6a72]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Métricas lado a lado */}
      {a && b && (
        <div className="overflow-hidden rounded-xl border border-[#e8e8ed] bg-white">
          <p className="border-b border-[#eef1f6] bg-[#f8fafc] px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-[#8a8a93]">
            Perfil da região
          </p>
          <ul className="divide-y divide-[#eef1f6]">
            {(
              [
                "transporte",
                "consumo",
                "educacao",
                "seguranca",
              ] as const
            ).map((key) => (
              <li
                key={key}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 text-[11px]"
              >
                <span
                  className={`text-right font-bold tabular-nums ${
                    a.metrics[key] >= b.metrics[key]
                      ? "text-[#006aff]"
                      : "text-[#6a6a72]"
                  }`}
                >
                  {a.metrics[key].toFixed(1)}
                </span>
                <span className="min-w-[5.5rem] text-center font-semibold text-[#6a6a72]">
                  {METRIC_LABELS[key]}
                </span>
                <span
                  className={`font-bold tabular-nums ${
                    b.metrics[key] >= a.metrics[key]
                      ? "text-[#b45309]"
                      : "text-[#6a6a72]"
                  }`}
                >
                  {b.metrics[key].toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasHex ? (
        <>
          <div className="relative rounded-xl border border-slate-200 bg-white p-2 shadow-sm print:border-none print:shadow-none">
            <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Motor de negócio (hex)
            </p>
            <svg viewBox="0 0 200 180" className="h-40 w-full">
              {[2, 4, 6, 8, 10].map((v) => (
                <polygon
                  key={v}
                  points={`${getRadarPoint(v, 0)} ${getRadarPoint(v, 120)} ${getRadarPoint(v, 240)}`}
                  fill="none"
                  stroke="#e2e8f0"
                />
              ))}
              <polygon
                points={`${getRadarPoint(hexData[0].breakdown?.estrutural ?? 0, 0)} ${getRadarPoint(hexData[0].breakdown?.macroeconomico ?? 0, 120)} ${getRadarPoint(hexData[0].breakdown?.comportamental ?? 0, 240)}`}
                fill="rgba(0, 106, 255, 0.35)"
                stroke="#006aff"
                strokeWidth="2"
              />
              <polygon
                points={`${getRadarPoint(hexData[1].breakdown?.estrutural ?? 0, 0)} ${getRadarPoint(hexData[1].breakdown?.macroeconomico ?? 0, 120)} ${getRadarPoint(hexData[1].breakdown?.comportamental ?? 0, 240)}`}
                fill="rgba(245, 158, 11, 0.35)"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <text
                x="100"
                y="12"
                fontSize="10"
                textAnchor="middle"
                fill="#64748b"
                fontWeight="bold"
              >
                Demografia
              </text>
              <text
                x="180"
                y="150"
                fontSize="10"
                textAnchor="middle"
                fill="#64748b"
                fontWeight="bold"
              >
                Mercado
              </text>
              <text
                x="20"
                y="150"
                fontSize="10"
                textAnchor="middle"
                fill="#64748b"
                fontWeight="bold"
              >
                Fluxo
              </text>
            </svg>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-3 print:gap-8">
            {hexData.slice(0, 2).map((hex: any, index: number) => {
              const dynScore = getDynamicScore(hex);
              const opponentScore = getDynamicScore(
                hexData[index === 0 ? 1 : 0],
              );
              const isWinner = dynScore > opponentScore;
              const loc = compareLocations[index];
              const fallbackLabel =
                loc?.label ||
                addressMap[hex.h3_index] ||
                "Região";
              return (
                <div
                  key={hex.h3_index || index}
                  className={`flex flex-col rounded-xl border-2 p-3 transition-all print:border print:p-5 ${
                    isWinner
                      ? "scale-[1.02] border-green-500 bg-green-50/50 shadow-md print:scale-100 print:bg-green-50/30"
                      : "border-slate-200 bg-white opacity-90 print:opacity-100"
                  }`}
                >
                  {isWinner && (
                    <span className="mb-1 rounded-sm bg-green-100 py-0.5 text-center text-[10px] font-black uppercase text-green-600">
                      Melhor para o negócio
                    </span>
                  )}
                  <p className="flex h-8 items-center justify-center text-center text-[11px] font-bold leading-tight text-slate-700 line-clamp-2">
                    {fallbackLabel}
                  </p>
                  <div className="my-2 border-y border-slate-100/50 py-2 text-center">
                    <span
                      className={`text-2xl font-black ${
                        isWinner ? "text-green-600" : "text-slate-800"
                      }`}
                    >
                      {dynScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-auto space-y-2">
                    <p className="flex justify-between text-[9px] text-slate-500">
                      <span>Demografia</span>
                      <span className="font-bold">
                        {(hex.breakdown?.estrutural ?? 0).toFixed(1)}
                      </span>
                    </p>
                    <p className="flex justify-between text-[9px] text-slate-500">
                      <span>Mercado</span>
                      <span className="font-bold">
                        {(hex.breakdown?.macroeconomico ?? 0).toFixed(1)}
                      </span>
                    </p>
                    <p className="flex justify-between text-[9px] text-slate-500">
                      <span>Fluxo</span>
                      <span className="font-bold">
                        {(hex.breakdown?.comportamental ?? 0).toFixed(1)}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        !loading && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[11px] font-semibold text-amber-800">
            Comparação regional pronta. O radar do motor de negócio aparece
            quando a API de score responder — a relação entre regiões já está
            acima.
          </p>
        )
      )}

      <div className="space-y-2 print:hidden">
        <button
          type="button"
          onClick={handlePrintPDF}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5f5f7] px-4 py-2.5 text-sm font-bold text-[#2a2a33] transition hover:bg-[#e8e8ed]"
        >
          Baixar relatório
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 rounded-xl border border-[#d1d1d5] py-2 text-xs font-bold text-[#6a6a72] transition hover:border-[#006aff] hover:text-[#006aff]"
          >
            {copied ? "Copiado!" : "Partilhar"}
          </button>
          <button
            type="button"
            onClick={handleResetCompare}
            className="flex-1 rounded-xl border border-[#d1d1d5] py-2 text-xs font-bold text-[#6a6a72] transition hover:border-[#006aff] hover:text-[#006aff]"
          >
            Nova comparação
          </button>
        </div>
      </div>
    </div>
  );
}
