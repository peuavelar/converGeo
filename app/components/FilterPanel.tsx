"use client";

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
  handleCompareClick: () => void;
}

export default function FilterPanel(props: FilterPanelProps) {
  return (
    <div className="flex flex-col space-y-3 print:hidden">
      <form onSubmit={props.handleAddressSearch} className="space-y-1">
        <label
          htmlFor="endereco-negocio"
          className="block text-xs font-semibold text-slate-600"
        >
          Endereço
        </label>
        <div className="flex gap-1.5">
          <AddressSuggest
            inputId="endereco-negocio"
            value={props.searchQuery}
            onChange={props.setSearchQuery}
            onPick={props.onPickAddress}
            isSearching={props.isSearching}
          />
          <button
            type="submit"
            disabled={props.isSearching}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {props.isSearching ? "..." : "OK"}
          </button>
        </div>
      </form>
      {props.searchError && (
        <p className="text-xs font-semibold text-rose-600">
          {props.searchError}
        </p>
      )}

      <label className="block text-xs font-semibold text-slate-600">
        Tipo de empreendimento
        <select
          value={props.propertyType}
          onChange={(e) =>
            props.setPropertyType(e.target.value as PropertyType)
          }
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-blue-500"
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

      <label className="block text-xs font-semibold text-slate-600">
        Segmento
        <select
          value={props.activeSegment}
          onChange={(e) => props.setActiveSegment(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
        >
          {BUSINESS_SEGMENTS.map((segment) => (
            <option key={segment.value} value={segment.value}>
              {segment.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[11px] text-slate-500">
        CNAE ref.:{" "}
        {BUSINESS_SEGMENTS.find((s) => s.value === props.activeSegment)?.cnae ??
          "—"}
      </p>

      <details className="rounded-lg border border-slate-200 bg-white p-2.5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          Ajustar pesos do motor
        </summary>
        <div className="mt-2 space-y-2">
          {(
            [
              ["Demografia", props.weightDemografia, props.setWeightDemografia],
              ["Mercado", props.weightMercado, props.setWeightMercado],
              ["Fluxo", props.weightFluxo, props.setWeightFluxo],
            ] as const
          ).map(([label, value, setter]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
                <span>{label}</span>
                <span>{value}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          ))}
        </div>
      </details>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={props.handleTop5Click}
          className={`rounded-lg px-2.5 py-2 text-sm font-semibold ${
            props.viewMode === "top"
              ? "bg-slate-900 text-white"
              : "bg-blue-600 text-white hover:bg-blue-500"
          }`}
        >
          Top 5
        </button>
        <button
          type="button"
          onClick={props.handleHeatmapClick}
          className={`rounded-lg px-2.5 py-2 text-sm font-semibold ${
            props.viewMode === "heatmap"
              ? "bg-slate-900 text-white"
              : "bg-slate-200 text-slate-800 hover:bg-slate-300"
          }`}
        >
          Raio-X
        </button>
        <button
          type="button"
          onClick={props.handleCompareClick}
          className={`col-span-2 rounded-lg border px-2.5 py-2 text-sm font-semibold ${
            props.viewMode === "compare"
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Comparar locais (A/B)
        </button>
      </div>
    </div>
  );
}
