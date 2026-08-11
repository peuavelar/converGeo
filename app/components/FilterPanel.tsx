"use client";

import { useState } from "react";
import AddressSuggest from "./AddressSuggest";
import { BUSINESS_SEGMENTS } from "../data/segments";
import type { AddressSuggestion } from "../data/streets";
import {
  COMMERCIAL_PROPERTY_TYPES,
  type PropertyType,
} from "../utils/realEstate";

interface FilterPanelProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  handleAddressSearch: (e: React.FormEvent) => void;
  onPickAddress: (suggestion: AddressSuggestion) => void;
  isSearching: boolean;
  searchError: string;
  activeSegment: string;
  setActiveSegment: (v: string) => void;
  propertyType: PropertyType;
  setPropertyType: (v: PropertyType) => void;
  showSliders: boolean;
  setShowSliders: (v: boolean) => void;
  weightDemografia: number;
  setWeightDemografia: (v: number) => void;
  weightMercado: number;
  setWeightMercado: (v: number) => void;
  weightFluxo: number;
  setWeightFluxo: (v: number) => void;
  viewMode: "single" | "top" | "compare" | "heatmap" | null;
  handleTop5Click: () => void;
  handleHeatmapClick: () => void;
  /** Executa comparação A/B com os textos digitados. */
  onRunCompare: (localA: string, localB: string) => Promise<void> | void;
  compareRunning?: boolean;
  compareError?: string;
}

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-[#e6e6ea] bg-white px-3 py-2.5 text-sm text-[#0a0a0b] outline-none transition focus:border-[#0a0a0b] focus:ring-2 focus:ring-[#0a0a0b]/12";

export default function FilterPanel(props: FilterPanelProps) {
  const [localA, setLocalA] = useState("");
  const [localB, setLocalB] = useState("");

  return (
    <div className="flex flex-col gap-3.5 print:hidden">
      <div className="rounded-xl border border-[#e6e6ea] bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(10,10,11,0.04)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a8a93]">
          Cobertura
        </p>
        <p className="mt-0.5 text-xs font-semibold text-[#0a0a0b]">
          Salvador · Lauro de Freitas (RMS)
        </p>
      </div>

      <form onSubmit={props.handleAddressSearch} className="space-y-1.5">
        <label
          htmlFor="endereco-negocio"
          className="block text-xs font-bold text-[#6a6a72]"
        >
          Endereço (análise pontual)
        </label>
        <div className="flex gap-2">
          <AddressSuggest
            inputId="endereco-negocio"
            value={props.searchQuery}
            onChange={props.setSearchQuery}
            onPick={props.onPickAddress}
            isSearching={props.isSearching}
            placeholder="Bairro ou rua em Salvador / Lauro"
          />
          <button
            type="submit"
            disabled={props.isSearching}
            className="min-h-[44px] shrink-0 rounded-xl bg-[#0a0a0b] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#1c1c1f] active:scale-[0.98] disabled:opacity-60"
          >
            {props.isSearching ? "…" : "OK"}
          </button>
        </div>
      </form>
      {props.searchError && (
        <p className="text-xs font-semibold text-rose-600">
          {props.searchError}
        </p>
      )}

      <label className="block text-xs font-bold text-[#6a6a72]">
        Tipo de empreendimento
        <select
          value={props.propertyType}
          onChange={(e) =>
            props.setPropertyType(e.target.value as PropertyType)
          }
          className={fieldClass}
        >
          <optgroup label="Comercial">
            {COMMERCIAL_PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <label className="block text-xs font-bold text-[#6a6a72]">
        Segmento
        <select
          value={props.activeSegment}
          onChange={(e) => props.setActiveSegment(e.target.value)}
          className={`${fieldClass} font-semibold`}
        >
          {BUSINESS_SEGMENTS.map((segment) => (
            <option key={segment.value} value={segment.value}>
              {segment.label}
            </option>
          ))}
        </select>
      </label>
      <p className="-mt-1 text-[11px] text-[#8a8a93]">
        CNAE ref.:{" "}
        <span className="font-semibold text-[#6a6a72]">
          {BUSINESS_SEGMENTS.find((s) => s.value === props.activeSegment)
            ?.cnae ?? "—"}
        </span>
      </p>

      <details className="group rounded-xl border border-[#e6e6ea] bg-white open:shadow-sm">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-bold text-[#0a0a0b] marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            Ajustar pesos do motor
            <span className="text-[#8a8a93] transition group-open:rotate-90">
              ›
            </span>
          </span>
        </summary>
        <div className="space-y-3 border-t border-[#f0f0f2] px-3 py-3">
          {(
            [
              ["Demografia", props.weightDemografia, props.setWeightDemografia],
              ["Mercado", props.weightMercado, props.setWeightMercado],
              ["Fluxo", props.weightFluxo, props.setWeightFluxo],
            ] as const
          ).map(([label, value, setter]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-[#6a6a72]">
                <span>{label}</span>
                <span className="tabular-nums text-[#0a0a0b]">{value}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="w-full accent-[#0a0a0b]"
              />
            </div>
          ))}
        </div>
      </details>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={props.handleTop5Click}
          className={`min-h-[44px] rounded-xl px-3 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
            props.viewMode === "top"
              ? "bg-[#0a0a0b] text-white shadow-md"
              : "border border-[#e6e6ea] bg-white text-[#0a0a0b] hover:border-[#0a0a0b]"
          }`}
        >
          Top 5
        </button>
        <button
          type="button"
          onClick={props.handleHeatmapClick}
          className={`min-h-[44px] rounded-xl px-3 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
            props.viewMode === "heatmap"
              ? "bg-[#0a0a0b] text-white shadow-md"
              : "border border-[#e6e6ea] bg-white text-[#0a0a0b] hover:border-[#0a0a0b]"
          }`}
        >
          Raio-X
        </button>
      </div>

      {/* Comparação A/B — digitação + botão executa */}
      <div className="space-y-2.5 rounded-2xl border border-[#e6e6ea] bg-white p-3 shadow-[0_8px_24px_rgba(10,10,11,0.04)]">
        <p className="text-xs font-bold text-[#0a0a0b]">Comparar regiões</p>
        <p className="text-[11px] leading-snug text-[#6a6a72]">
          Digite dois bairros. A comparação usa a região completa (não só o
          ponto no mapa).
        </p>

        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#0a0a0b]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0a0a0b] text-[10px] text-white">
              A
            </span>
            Região A
          </label>
          <AddressSuggest
            inputId="negocio-compare-a"
            value={localA}
            onChange={setLocalA}
            onPick={(s) =>
              setLocalA(s.label || s.neighborhoodName)
            }
            placeholder="Ex.: Pituba, Portão…"
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#0a0a0b]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#0a0a0b] bg-white text-[10px] text-[#0a0a0b]">
              B
            </span>
            Região B
          </label>
          <AddressSuggest
            inputId="negocio-compare-b"
            value={localB}
            onChange={setLocalB}
            onPick={(s) =>
              setLocalB(s.label || s.neighborhoodName)
            }
            placeholder="Ex.: Barra, Vilas do Atlântico…"
          />
        </div>

        {props.compareError && (
          <p className="text-xs font-semibold text-rose-600">
            {props.compareError}
          </p>
        )}

        <button
          type="button"
          disabled={props.compareRunning || !localA.trim() || !localB.trim()}
          onClick={() => void props.onRunCompare(localA, localB)}
          className="min-h-[48px] w-full rounded-xl bg-[#0a0a0b] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#1c1c1f] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {props.compareRunning ? "Comparando…" : "Comparar locais (A/B)"}
        </button>
      </div>
    </div>
  );
}
